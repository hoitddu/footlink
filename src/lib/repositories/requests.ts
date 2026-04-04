import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import { createAppStateSnapshot, deriveNotificationsFromRequests } from "@/lib/repositories/snapshots";
import type { Match, ParticipationRequest } from "@/lib/types";
import type { MatchRequestRow, MatchRow } from "@/lib/supabase/types";

async function listMatchesByIds(matchIds: string[]) {
  if (matchIds.length === 0) {
    return [] satisfies Match[];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .in("id", matchIds)
    .returns<MatchRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRow);
}

export async function getActivitySnapshot() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return createAppStateSnapshot({ currentProfile: null });
  }

  const supabase = await createServerSupabaseClient();
  const { data: myRequestsData, error: myRequestsError } = await supabase
    .from("match_requests")
    .select("*")
    .eq("requester_profile_id", currentProfile.id)
    .order("created_at", { ascending: false })
    .returns<MatchRequestRow[]>();

  if (myRequestsError) {
    throw myRequestsError;
  }

  const { data: hostedMatchesData, error: hostedMatchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("creator_profile_id", currentProfile.id)
    .order("start_at", { ascending: true })
    .returns<MatchRow[]>();

  if (hostedMatchesError) {
    throw hostedMatchesError;
  }

  const hostedMatches = (hostedMatchesData ?? []).map(mapMatchRow);
  const hostedMatchIds = hostedMatches.map((match) => match.id);
  let inboundRequests: ParticipationRequest[] = [];

  if (hostedMatchIds.length > 0) {
    const { data: inboundData, error: inboundError } = await supabase
      .from("match_requests")
      .select("*")
      .in("match_id", hostedMatchIds)
      .order("created_at", { ascending: false })
      .returns<MatchRequestRow[]>();

    if (inboundError) {
      throw inboundError;
    }

    inboundRequests = (inboundData ?? []).map(mapMatchRequestRow);
  }

  const myRequests = (myRequestsData ?? []).map(mapMatchRequestRow);
  const allRequests = [...myRequests, ...inboundRequests];
  const relatedMatchIds = Array.from(new Set(allRequests.map((request) => request.match_id)));
  const requestMatches = await listMatchesByIds(
    relatedMatchIds.filter((matchId) => !hostedMatchIds.includes(matchId)),
  );
  const allMatches = [...hostedMatches, ...requestMatches];
  const relatedProfileIds = Array.from(
    new Set([
      currentProfile.id,
      ...allMatches.map((match) => match.creator_profile_id),
      ...allRequests.map((request) => request.requester_profile_id),
      ...allRequests.map((request) => request.host_profile_id),
    ]),
  );
  const profiles = await listProfilesByIds(relatedProfileIds);
  const notifications = deriveNotificationsFromRequests(
    currentProfile.id,
    allMatches,
    allRequests,
    profiles,
  );

  return createAppStateSnapshot({
    currentProfile,
    profiles,
    matches: allMatches,
    requests: allRequests,
    notifications,
  });
}
