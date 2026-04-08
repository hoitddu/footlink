import { getRegionLabel } from "@/lib/constants";
import type { FeedContext, FeedDataSource, FeedPreset, Match, MatchWithMeta } from "@/lib/types";
import { formatRelativeStart, formatStartAt, formatTimeOnly, haversineDistance } from "@/lib/utils";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

function getReferenceCoords(source: FeedDataSource, context: FeedContext) {
  if (typeof context.lat === "number" && typeof context.lng === "number") {
    return { lat: context.lat, lng: context.lng };
  }

  const fallback = source.regions.find((region) => region.slug === context.regionSlug) ?? source.regions[0];
  return { lat: fallback.lat, lng: fallback.lng };
}

function getWindowBounds(window: FeedContext["window"], referenceNow: number) {
  const now = new Date(referenceNow);

  if (window === "now") {
    return { start: now, end: new Date(referenceNow + 1000 * 60 * 60 * 4) };
  }

  if (window === "tomorrow") {
    const tomorrow = addDays(now, 1);
    return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
  }

  if (window === "weekend") {
    const day = now.getDay();
    const saturday =
      day === 0 ? startOfDay(addDays(now, -1)) : startOfDay(addDays(now, (6 - day + 7) % 7));
    const sunday = endOfDay(addDays(saturday, 1));

    return { start: saturday, end: sunday };
  }

  return { start: now, end: endOfDay(now) };
}

function isMatchVisible(match: Match, context: FeedContext, referenceNow: number) {
  if (match.status !== "open" || match.remaining_slots <= 0) {
    return false;
  }

  if (match.listing_type !== "mercenary") {
    return false;
  }

  if ((match.sport_type ?? "futsal") !== context.sport) {
    return false;
  }

  const startAt = new Date(match.start_at);
  const bounds = getWindowBounds(context.window, referenceNow);

  if (startAt < bounds.start || startAt > bounds.end) {
    return false;
  }

  if (context.onlyLastSpot && match.remaining_slots !== 1) {
    return false;
  }

  return true;
}

function getStatusMeta(match: Match, minutesUntilStart: number, referenceNow: number) {
  if (match.status !== "open" || match.remaining_slots <= 0) {
    return { label: "마감", tone: "calm" as const, urgencyLevel: "closed" as const };
  }

  if (match.remaining_slots === 1) {
    return {
      label: "1자리 남음",
      tone: "urgent" as const,
      urgencyLevel: "last_spot" as const,
    };
  }

  if (minutesUntilStart <= 120) {
    return {
      label: formatRelativeStart(minutesUntilStart),
      tone: minutesUntilStart <= 60 ? "urgent" as const : "soon" as const,
      urgencyLevel: "starting_soon" as const,
    };
  }

  const startAt = new Date(match.start_at);
  const now = new Date(referenceNow);

  if (isSameDay(startAt, now)) {
    return {
      label: `오늘 ${formatTimeOnly(match.start_at)}`,
      tone: "soon" as const,
      urgencyLevel: "today" as const,
    };
  }

  return {
    label: formatStartAt(match.start_at),
    tone: "calm" as const,
    urgencyLevel: "weekend" as const,
  };
}

function scoreMatch(match: Match, distanceKm: number, minutesUntilStart: number) {
  let score = 0;

  if (match.remaining_slots === 1) {
    score += 80;
  } else if (match.remaining_slots === 2) {
    score += 55;
  } else {
    score += Math.max(0, 40 - match.remaining_slots * 4);
  }

  if (minutesUntilStart <= 60) {
    score += 55;
  } else if (minutesUntilStart <= 120) {
    score += 35;
  } else if (minutesUntilStart <= 360) {
    score += 18;
  }

  if (distanceKm <= 1) {
    score += 25;
  } else if (distanceKm <= 3) {
    score += 16;
  } else if (distanceKm <= 5) {
    score += 10;
  }

  if ((match.sport_type ?? "futsal") === "soccer") {
    score -= 2;
  }

  return score;
}

function sortMatches(matchesWithMeta: MatchWithMeta[], preset: FeedPreset) {
  const items = [...matchesWithMeta];

  if (preset === "distance") {
    return items.sort((left, right) => {
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }

      if (left.remaining_slots !== right.remaining_slots) {
        return left.remaining_slots - right.remaining_slots;
      }

      return left.minutesUntilStart - right.minutesUntilStart;
    });
  }

  return items.sort((left, right) => {
    if (right.compatibilityScore !== left.compatibilityScore) {
      return right.compatibilityScore - left.compatibilityScore;
    }

    if (left.remaining_slots !== right.remaining_slots) {
      return left.remaining_slots - right.remaining_slots;
    }

    if (left.minutesUntilStart !== right.minutesUntilStart) {
      return left.minutesUntilStart - right.minutesUntilStart;
    }

    return left.distanceKm - right.distanceKm;
  });
}

export function getFeedMatches(
  source: FeedDataSource,
  context: FeedContext,
  preset: FeedPreset = "urgent",
  referenceNow = Date.now(),
) {
  const coords = getReferenceCoords(source, context);
  const radiusKm = context.radiusKm && context.radiusKm < 900 ? context.radiusKm : undefined;

  const prepared = source.matches
    .filter((match) => isMatchVisible(match, context, referenceNow))
    .map((match) => {
      const distanceKm = haversineDistance(coords.lat, coords.lng, match.lat, match.lng);
      const minutesUntilStart = Math.max(
        1,
        Math.round((new Date(match.start_at).getTime() - referenceNow) / 60000),
      );
      const status = getStatusMeta(match, minutesUntilStart, referenceNow);

      return {
        ...match,
        sport_type: match.sport_type ?? "futsal",
        region_label: getRegionLabel(match.region_slug),
        distanceKm,
        minutesUntilStart,
        statusLabel: status.label,
        statusTone: status.tone,
        compatibilityScore: scoreMatch(match, distanceKm, minutesUntilStart),
        organizer: source.profiles.find((profile) => profile.id === match.creator_profile_id),
        contactAvailable: Boolean(match.contact_link?.trim()),
        urgencyLevel: status.urgencyLevel,
      } satisfies MatchWithMeta;
    })
    .filter((match) => (radiusKm ? match.distanceKm <= radiusKm : true));

  return sortMatches(prepared, preset);
}

export function getFeedSections(items: MatchWithMeta[], referenceNow = Date.now()) {
  const now = new Date(referenceNow);

  return {
    immediate: items.filter((match) => match.minutesUntilStart <= 120),
    laterToday: items.filter((match) => {
      const startAt = new Date(match.start_at);
      return match.minutesUntilStart > 120 && isSameDay(startAt, now);
    }),
    weekend: items.filter((match) => {
      const startAt = new Date(match.start_at);
      return !isSameDay(startAt, now);
    }),
  };
}

export function getMatchById(source: FeedDataSource, id: string, referenceNow = Date.now()) {
  const match = source.matches.find((item) => item.id === id);

  if (!match) {
    return null;
  }

  const region = source.regions.find((item) => item.slug === match.region_slug) ?? source.regions[0];
  const distanceKm = haversineDistance(region.lat, region.lng, match.lat, match.lng);
  const minutesUntilStart = Math.max(
    1,
    Math.round((new Date(match.start_at).getTime() - referenceNow) / 60000),
  );
  const status = getStatusMeta(match, minutesUntilStart, referenceNow);

  return {
    ...match,
    sport_type: match.sport_type ?? "futsal",
    region_label: getRegionLabel(match.region_slug),
    distanceKm,
    minutesUntilStart,
    statusLabel: status.label,
    statusTone: status.tone,
    compatibilityScore: scoreMatch(match, distanceKm, minutesUntilStart),
    organizer: source.profiles.find((profile) => profile.id === match.creator_profile_id),
    contactAvailable: Boolean(match.contact_link?.trim()),
    urgencyLevel: status.urgencyLevel,
  } satisfies MatchWithMeta;
}
