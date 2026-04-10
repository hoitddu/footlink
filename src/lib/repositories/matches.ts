import { unstable_cache } from "next/cache";

import { REGION_OPTIONS } from "@/lib/constants";
import { getFeedMatches } from "@/lib/feed";
import { scheduleMatchLifecycleMaintenance } from "@/lib/repositories/lifecycle";
import { getCurrentProfile } from "@/lib/repositories/profiles";
import { createAppStateSnapshot } from "@/lib/repositories/snapshots";
import { createPublicServerSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow, mapProfileRow } from "@/lib/supabase/mappers";
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
import type { FeedContext, FeedDataSource } from "@/lib/types";

export const FEED_ROWS_CACHE_TAG = "feed-rows-v2";

function endOfDayKst(date: Date) {
  return new Date(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T23:59:59+09:00`,
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function serializeFeedContext(context: FeedContext) {
  return JSON.stringify({
    regionSlug: context.regionSlug ?? "suwon",
  });
}

const getCachedFeedRows = unstable_cache(
  async (serializedContext: string) => {
    const context = JSON.parse(serializedContext) as Pick<FeedContext, "regionSlug">;
    const supabase = createPublicServerSupabaseClient();
    const now = new Date();
    const bounds = {
      start: now.toISOString(),
      end: endOfDayKst(addDays(now, 6)).toISOString(),
    };

    const query = supabase
      .from("matches")
      .select(MATCH_FEED_SELECT)
      .eq("status", "open")
      .eq("listing_type", "mercenary")
      .eq("region_slug", context.regionSlug ?? "suwon")
      .gt("remaining_slots", 0)
      .gte("start_at", bounds.start)
      .lte("start_at", bounds.end)
      .order("start_at", { ascending: true })
      .limit(120);

    const { data, error } = await query.returns<FeedMatchRow[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  },
  [FEED_ROWS_CACHE_TAG],
  { revalidate: 20, tags: [FEED_ROWS_CACHE_TAG] },
);

async function getPublicMatchRow(matchId: string) {
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
}

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
  ["public-profiles-v2"],
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
  // Housekeeping runs in the background; never block detail render.
  scheduleMatchLifecycleMaintenance();

  const [matchRow, currentProfile] = await Promise.all([
    getPublicMatchRow(matchId),
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
