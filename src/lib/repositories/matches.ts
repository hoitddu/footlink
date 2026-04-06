import { unstable_cache } from "next/cache";

import { REGION_OPTIONS } from "@/lib/constants";
import { getFeedMatches } from "@/lib/feed";
import { getCurrentProfile } from "@/lib/repositories/profiles";
import { createPublicServerSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow, mapProfileRow } from "@/lib/supabase/mappers";
import type { FeedContext, FeedDataSource } from "@/lib/types";
import { createAppStateSnapshot } from "@/lib/repositories/snapshots";
import {
  MATCH_DETAIL_SELECT,
  MATCH_FEED_SELECT,
  MATCH_REQUEST_PERSONALIZATION_SELECT,
  PROFILE_DETAIL_SELECT,
  type ActivityMatchRequestRow,
  type DetailMatchRow,
  type DetailProfileRow,
  type FeedMatchRow,
} from "@/lib/supabase/selects";

function getDateRangeBounds(context: FeedContext) {
  if (!context.selectedDateFrom) {
    return null;
  }

  const start = new Date(`${context.selectedDateFrom}T00:00:00+09:00`).toISOString();
  const endKey = context.selectedDateTo ?? context.selectedDateFrom;
  const end = new Date(`${endKey}T23:59:59+09:00`).toISOString();

  return { start, end };
}

function serializeFeedContext(context: FeedContext) {
  return JSON.stringify({
    mode: context.mode,
    groupSize: context.groupSize,
    regionSlug: context.regionSlug ?? null,
    selectedDateFrom: context.selectedDateFrom ?? null,
    selectedDateTo: context.selectedDateTo ?? null,
    skillLevel: context.skillLevel ?? null,
  });
}

const getCachedFeedRows = unstable_cache(
  async (serializedContext: string) => {
    const context = JSON.parse(serializedContext) as FeedContext;
    const supabase = createPublicServerSupabaseClient();
    let query = supabase
      .from("matches")
      .select(MATCH_FEED_SELECT)
      .eq("status", "open")
      .gt("remaining_slots", 0)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(50);

    if (context.regionSlug) {
      query = query.eq("region_slug", context.regionSlug);
    }

    const dateBounds = getDateRangeBounds(context);
    if (dateBounds) {
      query = query.gte("start_at", dateBounds.start).lte("start_at", dateBounds.end);
    }

    if (context.mode === "solo") {
      query = query.in("listing_type", ["mercenary", "partial_join"]);
    } else if (context.mode === "small_group") {
      query = query
        .eq("listing_type", "partial_join")
        .lte("min_group_size", context.groupSize)
        .gte("max_group_size", context.groupSize);
    } else {
      query = query.eq("listing_type", "team_match");
    }

    if (context.skillLevel) {
      query = query.eq("skill_level", context.skillLevel);
    }

    const { data, error } = await query.returns<FeedMatchRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  },
  ["feed-rows"],
  { revalidate: 30 },
);

const getCachedPublicMatchRow = unstable_cache(
  async (matchId: string) => {
    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from("matches")
      .select(MATCH_DETAIL_SELECT)
      .eq("id", matchId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as unknown as DetailMatchRow | null) ?? null;
  },
  ["public-match-row"],
  { revalidate: 30 },
);

const getCachedPublicProfiles = unstable_cache(
  async (serializedIds: string) => {
    const profileIds = serializedIds.split(",").filter(Boolean);

    if (profileIds.length === 0) {
      return [] satisfies DetailProfileRow[];
    }

    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_DETAIL_SELECT)
      .in("id", profileIds)
      .returns<DetailProfileRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  },
  ["public-profiles"],
  { revalidate: 60 },
);

export async function getFeedDataSource(context: FeedContext): Promise<FeedDataSource> {
  const data = await getCachedFeedRows(serializeFeedContext(context));

  return {
    matches: (data ?? []).map(mapMatchRow),
    participationRequests: [],
    profiles: [],
    regions: REGION_OPTIONS,
  };
}

export async function listMatchesForFeed(
  context: FeedContext,
  preset: Parameters<typeof getFeedMatches>[2],
  referenceNow?: number,
) {
  const source = await getFeedDataSource(context);
  return getFeedMatches(source, context, preset, referenceNow);
}

export async function getMatchDetail(id: string) {
  const snapshot = await getMatchDetailSnapshot(id);

  if (!snapshot) {
    return null;
  }

  return snapshot.matches[0] ?? null;
}

export async function getMatchDetailSnapshot(matchId: string) {
  const [matchRow, currentProfile] = await Promise.all([
    getCachedPublicMatchRow(matchId),
    getCurrentProfile(),
  ]);

  if (!matchRow) {
    return null;
  }

  const match = mapMatchRow(matchRow);
  const [profiles, myRequest] = await Promise.all([
    getCachedPublicProfiles(match.creator_profile_id),
    currentProfile ? getMatchPersonalization(matchId, currentProfile.id) : Promise.resolve(null),
  ]);
  const mappedProfiles = profiles.map(mapProfileRow);

  return createAppStateSnapshot({
    currentProfile,
    profiles: mappedProfiles,
    matches: [match],
    requests: myRequest ? [myRequest] : [],
  });
}

async function getMatchPersonalization(matchId: string, currentProfileId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_PERSONALIZATION_SELECT)
    .eq("match_id", matchId)
    .eq("requester_profile_id", currentProfileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapMatchRequestRow(data as unknown as ActivityMatchRequestRow) : null;
}
