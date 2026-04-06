import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import {
  createAppStateSnapshot,
  deriveNotificationsFromRequests,
} from "@/lib/repositories/snapshots";
import type { ParticipationRequest } from "@/lib/types";
import {
  MATCH_ACTIVITY_SELECT,
  MATCH_REQUEST_ACTIVITY_SELECT,
  type ActivityMatchRequestRow,
  type ActivityMatchRow,
} from "@/lib/supabase/selects";

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
    .select(MATCH_ACTIVITY_SELECT)
    .in("id", matchIds)
    .returns<ActivityMatchRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRow);
}

async function listMyRequests(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .eq("requester_profile_id", currentProfileId)
    .order("created_at", { ascending: false })
    .returns<ActivityMatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

async function listHostedMatches(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_ACTIVITY_SELECT)
    .eq("creator_profile_id", currentProfileId)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true })
    .returns<ActivityMatchRow[]>();

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
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .in("match_id", matchIds)
    .order("created_at", { ascending: false })
    .returns<ActivityMatchRequestRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRequestRow);
}

async function listRequesterNotifications(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .eq("requester_profile_id", currentProfileId)
    .in("status", ["accepted", "confirmed", "rejected"])
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ActivityMatchRequestRow[]>();

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
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .in("match_id", matchIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ActivityMatchRequestRow[]>();

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

  // Round 1: fetch hosted matches + primary requests + tab-independent notifications in parallel
  const [hostedMatches, primaryRequests, requesterNotifications] = await Promise.all([
    listHostedMatches(supabase, currentProfile.id),
    tab === "requests" ? listMyRequests(supabase, currentProfile.id) : Promise.resolve([]),
    tab === "listings"
      ? listRequesterNotifications(supabase, currentProfile.id)
      : Promise.resolve([]),
  ]);

  const hostedMatchIds = hostedMatches.map((match) => match.id);

  // Round 2: fetch dependent queries + eagerly resolve profiles in parallel
  const earlyProfileIds = new Set([
    currentProfile.id,
    ...hostedMatches.map((match) => match.creator_profile_id),
    ...primaryRequests.map((r) => r.requester_profile_id),
    ...primaryRequests.map((r) => r.host_profile_id),
    ...requesterNotifications.map((r) => r.requester_profile_id),
    ...requesterNotifications.map((r) => r.host_profile_id),
  ]);

  const externalMatchIdsFromRequests = Array.from(
    new Set(
      [...primaryRequests, ...requesterNotifications]
        .map((r) => r.match_id)
        .filter((id) => !new Set(hostedMatchIds).has(id)),
    ),
  );

  const [inboundRequests, hostNotifications, externalMatches, earlyProfiles] = await Promise.all([
    tab === "listings" ? listInboundRequests(supabase, hostedMatchIds) : Promise.resolve([]),
    tab === "requests"
      ? listPendingHostNotifications(supabase, hostedMatchIds)
      : Promise.resolve([]),
    listMatchesByIds(supabase, externalMatchIdsFromRequests),
    listProfilesByIds(Array.from(earlyProfileIds)),
  ]);

  const requests = dedupeById([
    ...primaryRequests,
    ...inboundRequests,
    ...requesterNotifications,
    ...hostNotifications,
  ]);

  const matches = dedupeById([...hostedMatches, ...externalMatches]);

  // Collect any missing profile IDs from inbound/host notifications (usually already covered)
  const allProfileIds = new Set([
    ...earlyProfileIds,
    ...inboundRequests.map((r) => r.requester_profile_id),
    ...inboundRequests.map((r) => r.host_profile_id),
    ...hostNotifications.map((r) => r.requester_profile_id),
    ...hostNotifications.map((r) => r.host_profile_id),
    ...externalMatches.map((m) => m.creator_profile_id),
  ]);
  const missingProfileIds = Array.from(allProfileIds).filter((id) => !earlyProfileIds.has(id));
  const extraProfiles =
    missingProfileIds.length > 0 ? await listProfilesByIds(missingProfileIds) : [];
  const profiles = dedupeById([...earlyProfiles, ...extraProfiles]);

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
