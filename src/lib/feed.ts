import { getRegionLabel } from "@/lib/constants";
import type {
  EntryMode,
  FeedContext,
  FeedDataSource,
  FeedPreset,
  Match,
  MatchWithMeta,
} from "@/lib/types";
import { haversineDistance } from "@/lib/utils";

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isDateWithinRange(dateKey: string, start?: string, end?: string) {
  if (!start) {
    return true;
  }

  const normalizedEnd = end ?? start;
  return dateKey >= start && dateKey <= normalizedEnd;
}

function getRegionCenter(source: FeedDataSource, regionSlug?: string) {
  return source.regions.find((region) => region.slug === regionSlug) ?? source.regions[0];
}

function getReferenceCoords(source: FeedDataSource, context: FeedContext) {
  if (typeof context.lat === "number" && typeof context.lng === "number") {
    return { lat: context.lat, lng: context.lng };
  }

  const fallback = getRegionCenter(source, context.regionSlug);
  return { lat: fallback.lat, lng: fallback.lng };
}

function isCompatible(match: Match, mode: EntryMode, groupSize: number) {
  if (match.status !== "open") {
    return false;
  }

  if (mode === "solo") {
    return match.listing_type === "mercenary" || match.listing_type === "partial_join";
  }

  if (mode === "small_group") {
    return (
      match.listing_type === "partial_join" &&
      groupSize >= match.min_group_size &&
      groupSize <= match.max_group_size
    );
  }

  return match.listing_type === "team_match";
}

function getStatusMeta(match: Match, minutesUntilStart: number) {
  if (match.status === "matched" || match.remaining_slots <= 0) {
    return { label: "모집 완료", tone: "calm" as const };
  }

  if (match.listing_type === "team_match") {
    return { label: "상대 팀 모집 중", tone: "team" as const };
  }

  if (minutesUntilStart <= 60 && match.remaining_slots > 0) {
    return {
      label: `지금 ${match.remaining_slots}자리 부족`,
      tone: "urgent" as const,
    };
  }

  if (minutesUntilStart <= 120) {
    return {
      label: `${minutesUntilStart}분 후 시작`,
      tone: "soon" as const,
    };
  }

  return {
    label: `오늘 ${new Date(match.start_at).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`,
    tone: "calm" as const,
  };
}

function scoreMatch(
  match: Match,
  context: FeedContext,
  distanceKm: number,
  minutesUntilStart: number,
) {
  let score = 0;

  if (match.mode === context.mode) {
    score += 40;
  }

  if (context.skillLevel && match.skill_level === context.skillLevel) {
    score += 10;
  }

  if (minutesUntilStart <= 60) {
    score += 30;
  }

  if (distanceKm <= 1) {
    score += 25;
  }

  if (match.remaining_slots <= 2) {
    score += 20;
  }

  if (minutesUntilStart <= 60 * 12) {
    score += 15;
  }

  return score;
}

function applyPreset(matchesWithMeta: MatchWithMeta[], preset: FeedPreset) {
  if (preset === "price") {
    return [...matchesWithMeta].sort((left, right) => {
      if (left.fee !== right.fee) {
        return left.fee - right.fee;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return left.distanceKm - right.distanceKm;
    });
  }

  if (preset === "urgent") {
    return [...matchesWithMeta].sort((left, right) => {
      if (left.remaining_slots !== right.remaining_slots) {
        return left.remaining_slots - right.remaining_slots;
      }

      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return left.distanceKm - right.distanceKm;
    });
  }

  if (preset === "distance") {
    return [...matchesWithMeta].sort((left, right) => {
      if (left.distanceKm !== right.distanceKm) {
        return left.distanceKm - right.distanceKm;
      }

      return left.minutesUntilStart - right.minutesUntilStart;
    });
  }

  if (preset === "time") {
    return [...matchesWithMeta].sort((left, right) => {
      if (left.minutesUntilStart !== right.minutesUntilStart) {
        return left.minutesUntilStart - right.minutesUntilStart;
      }

      return left.distanceKm - right.distanceKm;
    });
  }

  return [...matchesWithMeta].sort((left, right) => {
    if (right.compatibilityScore !== left.compatibilityScore) {
      return right.compatibilityScore - left.compatibilityScore;
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
  preset: FeedPreset = "recommended",
  referenceNow = Date.now(),
) {
  const coords = getReferenceCoords(source, context);

  const prepared = source.matches
    .filter((match) => isCompatible(match, context.mode, context.groupSize))
    .filter((match) =>
      isDateWithinRange(
        toLocalDateKey(new Date(match.start_at)),
        context.selectedDateFrom,
        context.selectedDateTo,
      ),
    )
    .map((match) => {
      const distanceKm = haversineDistance(coords.lat, coords.lng, match.lat, match.lng);
      const minutesUntilStart = Math.max(
        1,
        Math.round((new Date(match.start_at).getTime() - referenceNow) / 60000),
      );
      const status = getStatusMeta(match, minutesUntilStart);

      return {
        ...match,
        region_label: getRegionLabel(match.region_slug),
        distanceKm,
        minutesUntilStart,
        statusLabel: status.label,
        statusTone: status.tone,
        compatibilityScore: scoreMatch(match, context, distanceKm, minutesUntilStart),
        organizer: source.profiles.find((profile) => profile.id === match.creator_profile_id),
      } satisfies MatchWithMeta;
    });

  return applyPreset(prepared, preset);
}

export function getFeedSections(items: MatchWithMeta[]) {
  return {
    immediate: items.filter((match) => match.minutesUntilStart <= 90),
    upcoming: items.filter((match) => match.minutesUntilStart > 90),
  };
}

export function getMatchById(source: FeedDataSource, id: string, referenceNow = Date.now()) {
  const match = source.matches.find((item) => item.id === id);

  if (!match) {
    return null;
  }

  const organizer = source.profiles.find((profile) => profile.id === match.creator_profile_id);
  const region = source.regions.find((item) => item.slug === match.region_slug);
  const distanceKm = region ? haversineDistance(region.lat, region.lng, match.lat, match.lng) : 0.8;
  const minutesUntilStart = Math.max(
    1,
    Math.round((new Date(match.start_at).getTime() - referenceNow) / 60000),
  );
  const status = getStatusMeta(match, minutesUntilStart);

  return {
    ...match,
    region_label: getRegionLabel(match.region_slug),
    distanceKm,
    minutesUntilStart,
    statusLabel: status.label,
    statusTone: status.tone,
    compatibilityScore: 0,
    organizer,
  } satisfies MatchWithMeta;
}
