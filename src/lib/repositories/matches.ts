import { REGION_OPTIONS } from "@/lib/constants";
import { getFeedMatches } from "@/lib/feed";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import type { FeedContext, FeedDataSource, ParticipationRequest } from "@/lib/types";
import type { MatchRequestRow, MatchRow } from "@/lib/supabase/types";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import { createAppStateSnapshot } from "@/lib/repositories/snapshots";

function getDateRangeBounds(context: FeedContext) {
  if (!context.selectedDateFrom) {
    return null;
  }

  const start = new Date(`${context.selectedDateFrom}T00:00:00+09:00`).toISOString();
  const endKey = context.selectedDateTo ?? context.selectedDateFrom;
  const end = new Date(`${endKey}T23:59:59+09:00`).toISOString();

  return { start, end };
}

export async function getFeedDataSource(context: FeedContext): Promise<FeedDataSource> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("matches")
    .select("*")
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

  const { data, error } = await query.returns<MatchRow[]>();

  if (error) {
    throw error;
  }

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
  const supabase = await createServerSupabaseClient();
  const currentProfile = await getCurrentProfile();

  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!matchRow) {
    return null;
  }

  const match = mapMatchRow(matchRow as MatchRow);
  const profileIds = [match.creator_profile_id];
  let myRequest: ParticipationRequest | undefined;

  if (currentProfile) {
    profileIds.push(currentProfile.id);
    const { data: requestRow, error: requestError } = await supabase
      .from("match_requests")
      .select("*")
      .eq("match_id", matchId)
      .eq("requester_profile_id", currentProfile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      throw requestError;
    }

    if (requestRow) {
      myRequest = mapMatchRequestRow(requestRow as MatchRequestRow);
    }
  }

  const profiles = await listProfilesByIds(Array.from(new Set(profileIds)));

  return createAppStateSnapshot({
    currentProfile,
    profiles,
    matches: [match],
    requests: myRequest ? [myRequest] : [],
  });
}
