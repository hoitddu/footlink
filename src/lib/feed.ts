import { getRegionLabel } from "@/lib/constants";
import type { FeedContext, FeedDataSource, FeedPreset, Match, MatchWithMeta } from "@/lib/types";
import {
  formatRelativeStart,
  formatStartAt,
  formatTimeOnly,
  getShortestTravelEstimate,
  haversineDistance,
} from "@/lib/utils";

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

function getDateBounds(context: FeedContext, referenceNow: number) {
  if (context.selectedDateFrom) {
    const selectedDate = new Date(`${context.selectedDateFrom}T12:00:00+09:00`);
    return {
      start: startOfDay(selectedDate),
      end: endOfDay(selectedDate),
    };
  }

  const now = new Date(referenceNow);

  if (context.window === "now") {
    return {
      start: now,
      end: new Date(referenceNow + 1000 * 60 * 60 * 4),
    };
  }

  if (context.window === "today") {
    return { start: now, end: endOfDay(now) };
  }

  if (context.window === "tomorrow") {
    const tomorrow = addDays(now, 1);
    return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
  }

  if (context.window === "weekend") {
    const day = now.getDay();
    const saturday = day === 0 ? addDays(now, -1) : addDays(now, (6 - day + 7) % 7);
    return { start: startOfDay(saturday), end: endOfDay(addDays(saturday, 1)) };
  }

  return { start: now, end: endOfDay(addDays(now, 6)) };
}

function isMatchVisible(match: Match, context: FeedContext, referenceNow: number) {
  if (match.status !== "open" || match.remaining_slots <= 0) {
    return false;
  }

  if (match.listing_type !== "mercenary") {
    return false;
  }

  if (context.sport !== "all" && (match.sport_type ?? "futsal") !== context.sport) {
    return false;
  }

  const startAt = new Date(match.start_at);
  const bounds = getDateBounds(context, referenceNow);

  return startAt >= bounds.start && startAt <= bounds.end;
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

function getTimePriorityScore(minutesUntilStart: number) {
  if (minutesUntilStart <= 120) {
    return 100;
  }

  if (minutesUntilStart <= 360) {
    return 80;
  }

  if (minutesUntilStart <= 720) {
    return 60;
  }

  if (minutesUntilStart <= 1440) {
    return 35;
  }

  if (minutesUntilStart <= 2880) {
    return 20;
  }

  return 10;
}

function getClosingPriorityScore(remainingSlots: number) {
  if (remainingSlots <= 1) {
    return 100;
  }

  if (remainingSlots === 2) {
    return 75;
  }

  if (remainingSlots === 3) {
    return 50;
  }

  if (remainingSlots === 4) {
    return 30;
  }

  return 15;
}

function getTravelPriorityScore(travelMinutes: number) {
  if (travelMinutes <= 15) {
    return 100;
  }

  if (travelMinutes <= 30) {
    return 75;
  }

  if (travelMinutes <= 45) {
    return 45;
  }

  if (travelMinutes <= 60) {
    return 20;
  }

  return 0;
}

function getFeePriorityScore(fee: number, minFee: number, maxFee: number) {
  if (minFee === maxFee) {
    return 70;
  }

  const normalized = (fee - minFee) / (maxFee - minFee);
  return Math.round(100 - normalized * 100);
}

function getRecommendedScore(
  match: Match,
  travelMinutes: number,
  minutesUntilStart: number,
  minFee: number,
  maxFee: number,
  contactAvailable: boolean,
) {
  const timeScore = getTimePriorityScore(minutesUntilStart);
  const closingScore = getClosingPriorityScore(match.remaining_slots);
  const travelScore = getTravelPriorityScore(travelMinutes);
  const feeScore = getFeePriorityScore(match.fee, minFee, maxFee);

  let bonus = 0;

  if (match.remaining_slots === 1 && minutesUntilStart <= 180) {
    bonus += 12;
  }

  if (contactAvailable) {
    bonus += 4;
  }

  if (travelMinutes >= 50) {
    bonus -= 6;
  }

  return Math.round(timeScore * 0.4 + closingScore * 0.3 + travelScore * 0.2 + feeScore * 0.1 + bonus);
}

function sortMatches(matchesWithMeta: MatchWithMeta[], preset: FeedPreset) {
  const items = [...matchesWithMeta];

  if (preset === "recommended") {
    return items.sort((left, right) => {
      if (right.recommendedScore !== left.recommendedScore) {
        return right.recommendedScore - left.recommendedScore;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      if (left.remaining_slots !== right.remaining_slots) {
        return left.remaining_slots - right.remaining_slots;
      }

      return getShortestTravelEstimate(left.distanceKm).minutes - getShortestTravelEstimate(right.distanceKm).minutes;
    });
  }

  if (preset === "distance") {
    return items.sort((left, right) => {
      const leftTravel = getShortestTravelEstimate(left.distanceKm).minutes;
      const rightTravel = getShortestTravelEstimate(right.distanceKm).minutes;

      if (leftTravel !== rightTravel) {
        return leftTravel - rightTravel;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return left.remaining_slots - right.remaining_slots;
    });
  }

  if (preset === "fee") {
    return items.sort((left, right) => {
      if (left.fee !== right.fee) {
        return left.fee - right.fee;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return getShortestTravelEstimate(left.distanceKm).minutes - getShortestTravelEstimate(right.distanceKm).minutes;
    });
  }

  if (preset === "closing") {
    return items.sort((left, right) => {
      if (left.remaining_slots !== right.remaining_slots) {
        return left.remaining_slots - right.remaining_slots;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return getShortestTravelEstimate(left.distanceKm).minutes - getShortestTravelEstimate(right.distanceKm).minutes;
    });
  }

  return items.sort((left, right) => {
    if (left.minutesUntilStart !== right.minutesUntilStart) {
      return left.minutesUntilStart - right.minutesUntilStart;
    }

    if (left.remaining_slots !== right.remaining_slots) {
      return left.remaining_slots - right.remaining_slots;
    }

    return getShortestTravelEstimate(left.distanceKm).minutes - getShortestTravelEstimate(right.distanceKm).minutes;
  });
}

export function getFeedMatches(
  source: FeedDataSource,
  context: FeedContext,
  preset: FeedPreset = "recommended",
  referenceNow = Date.now(),
) {
  const coords = getReferenceCoords(source, context);

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
        recommendedScore: 0,
        organizer: source.profiles.find((profile) => profile.id === match.creator_profile_id),
        contactAvailable:
          match.contact_type === "openchat" ||
          match.contact_type === "phone" ||
          Boolean(match.contact_link?.trim()),
        urgencyLevel: status.urgencyLevel,
      } satisfies MatchWithMeta;
    });

  const feeValues = prepared.map((match) => match.fee);
  const minFee = feeValues.length > 0 ? Math.min(...feeValues) : 0;
  const maxFee = feeValues.length > 0 ? Math.max(...feeValues) : 0;

  const scored = prepared.map((match) => ({
    ...match,
    recommendedScore: getRecommendedScore(
      match,
      getShortestTravelEstimate(match.distanceKm).minutes,
      match.minutesUntilStart,
      minFee,
      maxFee,
      match.contactAvailable,
    ),
  }));

  return sortMatches(scored, preset);
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
    recommendedScore: getRecommendedScore(
      match,
      getShortestTravelEstimate(distanceKm).minutes,
      minutesUntilStart,
      match.fee,
      match.fee,
      match.contact_type === "openchat" ||
        match.contact_type === "phone" ||
        Boolean(match.contact_link?.trim()),
    ),
    organizer: source.profiles.find((profile) => profile.id === match.creator_profile_id),
    contactAvailable:
      match.contact_type === "openchat" ||
      match.contact_type === "phone" ||
      Boolean(match.contact_link?.trim()),
    urgencyLevel: status.urgencyLevel,
  } satisfies MatchWithMeta;
}
