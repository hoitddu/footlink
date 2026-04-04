import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import {
  createAppStateSnapshot,
  deriveNotificationsFromRequests,
} from "@/lib/repositories/snapshots";
import type { ParticipationRequest } from "@/lib/types";
import type { MatchRequestRow, MatchRow } from "@/lib/supabase/types";

export type ActivitySnapshotTab = "requests" | "listings";

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function listMatchesByIds(supabase: SupabaseClient, matchIds: string[]) {
  if (matchIds.length === 0) {
    return [];
  }

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

async function listMyRequests(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("requester_profile_id", currentProfileId)
    .order("created_at", { ascending: false })
    .returns<MatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

async function listHostedMatches(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("creator_profile_id", currentProfileId)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true })
    .returns<MatchRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRow);
}

async function listInboundRequests(supabase: SupabaseClient, matchIds: string[]) {
  if (matchIds.length === 0) {
    return [] satisfies ParticipationRequest[];
  }

  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .in("match_id", matchIds)
    .order("created_at", { ascending: false })
    .returns<MatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

async function listRequesterNotifications(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("requester_profile_id", currentProfileId)
    .in("status", ["accepted", "confirmed", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<MatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

async function listPendingHostNotifications(supabase: SupabaseClient, matchIds: string[]) {
  if (matchIds.length === 0) {
    return [] satisfies ParticipationRequest[];
  }

  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .in("match_id", matchIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<MatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

export async function getActivitySnapshot(tab: ActivitySnapshotTab = "requests") {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return createAppStateSnapshot({ currentProfile: null });
  }

  const supabase = await createServerSupabaseClient();
  const [hostedMatches, primaryRequests] = await Promise.all([
    listHostedMatches(supabase, currentProfile.id),
    tab === "requests" ? listMyRequests(supabase, currentProfile.id) : Promise.resolve([]),
  ]);

  const hostedMatchIds = hostedMatches.map((match) => match.id);

  const [inboundRequests, requesterNotifications, hostNotifications] = await Promise.all([
    tab === "listings" ? listInboundRequests(supabase, hostedMatchIds) : Promise.resolve([]),
    tab === "listings"
      ? listRequesterNotifications(supabase, currentProfile.id)
      : Promise.resolve([]),
    tab === "requests"
      ? listPendingHostNotifications(supabase, hostedMatchIds)
      : Promise.resolve([]),
  ]);

  const requests = dedupeById([
    ...primaryRequests,
    ...inboundRequests,
    ...requesterNotifications,
    ...hostNotifications,
  ]);

  const knownMatchIds = new Set(hostedMatchIds);
  const externalMatchIds = Array.from(
    new Set(
      requests.map((request) => request.match_id).filter((matchId) => !knownMatchIds.has(matchId)),
    ),
  );
  const externalMatches = await listMatchesByIds(supabase, externalMatchIds);
  const matches = dedupeById([...hostedMatches, ...externalMatches]);

  const relatedProfileIds = Array.from(
    new Set([
      currentProfile.id,
      ...matches.map((match) => match.creator_profile_id),
      ...requests.map((request) => request.requester_profile_id),
      ...requests.map((request) => request.host_profile_id),
    ]),
  );
  const profiles = await listProfilesByIds(relatedProfileIds);
  const notifications = deriveNotificationsFromRequests(
    currentProfile.id,
    matches,
    requests,
    profiles,
  );

  return createAppStateSnapshot({
    currentProfile,
    profiles,
    matches,
    requests,
    notifications,
  });
}
