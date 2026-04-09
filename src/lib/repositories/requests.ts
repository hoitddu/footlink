import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import {
  createAppStateSnapshot,
  deriveNotificationsFromRequests,
  getDerivedNotificationId,
} from "@/lib/repositories/snapshots";
import type { ParticipationRequest } from "@/lib/types";
import {
  MATCH_ACTIVITY_SELECT,
  MATCH_REQUEST_ACTIVITY_SELECT,
  NOTIFICATION_READ_SELECT,
  type ActivityMatchRequestRow,
  type ActivityMatchRow,
  type NotificationReadSelectRow,
} from "@/lib/supabase/selects";

export type ActivitySnapshotTab = "requests" | "listings";

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function isNotificationReadStorageMissing(error: { code?: string; message?: string }) {
  return error.code === "42P01" || error.message?.includes("notification_reads");
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
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_ACTIVITY_SELECT)
    .eq("creator_profile_id", currentProfileId)
    .eq("status", "open")
    .gt("start_at", now)
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

async function listNotificationReads(
  supabase: SupabaseClient,
  currentProfileId: string,
  notificationIds: string[],
) {
  if (notificationIds.length === 0) {
    return [] satisfies NotificationReadSelectRow[];
  }

  const { data, error } = await supabase
    .from("notification_reads")
    .select(NOTIFICATION_READ_SELECT)
    .eq("profile_id", currentProfileId)
    .in("notification_id", notificationIds)
    .returns<NotificationReadSelectRow[]>();

  if (error) {
    if (isNotificationReadStorageMissing(error)) {
      return [] satisfies NotificationReadSelectRow[];
    }

    throw error;
  }

  return data ?? [];
}

function applyNotificationReads(
  notifications: ReturnType<typeof deriveNotificationsFromRequests>,
  readRows: NotificationReadSelectRow[],
) {
  const readMap = new Map(readRows.map((row) => [row.notification_id, row.read_at]));

  return notifications.map((notification) => ({
    ...notification,
    read_at: readMap.get(notification.id) ?? notification.read_at,
  }));
}

export async function getActivitySnapshot() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return createAppStateSnapshot({ currentProfile: null });
  }

  const supabase = await createServerSupabaseClient();
  const { error: lifecycleError } = await supabase.rpc("close_expired_matches");

  if (lifecycleError) {
    throw lifecycleError;
  }

  const [hostedMatches, primaryRequests] = await Promise.all([
    listHostedMatches(supabase, currentProfile.id),
    listMyRequests(supabase, currentProfile.id),
  ]);

  const hostedMatchIds = hostedMatches.map((match) => match.id);
  const hostedMatchIdSet = new Set(hostedMatchIds);

  const earlyProfileIds = new Set([
    currentProfile.id,
    ...hostedMatches.map((match) => match.creator_profile_id),
    ...primaryRequests.map((r) => r.requester_profile_id),
    ...primaryRequests.map((r) => r.host_profile_id),
  ]);

  const externalMatchIdsFromRequests = Array.from(
    new Set(
      primaryRequests
        .map((r) => r.match_id)
        .filter((id) => !hostedMatchIdSet.has(id)),
    ),
  );

  const [inboundRequests, externalMatches, earlyProfiles] = await Promise.all([
    listInboundRequests(supabase, hostedMatchIds),
    listMatchesByIds(supabase, externalMatchIdsFromRequests),
    listProfilesByIds(Array.from(earlyProfileIds)),
  ]);

  const requests = dedupeById([...primaryRequests, ...inboundRequests]);

  const matches = dedupeById([...hostedMatches, ...externalMatches]);

  const allProfileIds = new Set([
    ...earlyProfileIds,
    ...inboundRequests.map((r) => r.requester_profile_id),
    ...inboundRequests.map((r) => r.host_profile_id),
    ...externalMatches.map((m) => m.creator_profile_id),
  ]);
  const missingProfileIds = Array.from(allProfileIds).filter((id) => !earlyProfileIds.has(id));
  const extraProfiles =
    missingProfileIds.length > 0 ? await listProfilesByIds(missingProfileIds) : [];
  const profiles = dedupeById([...earlyProfiles, ...extraProfiles]);

  return createAppStateSnapshot({
    currentProfile,
    profiles,
    matches,
    requests,
  });
}

export async function getNotificationsSnapshot() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return createAppStateSnapshot({ currentProfile: null });
  }

  const supabase = await createServerSupabaseClient();
  const hostedMatches = await listHostedMatches(supabase, currentProfile.id);
  const hostedMatchIds = hostedMatches.map((match) => match.id);
  const hostedMatchIdSet = new Set(hostedMatchIds);

  const [requesterNotifications, hostNotifications] = await Promise.all([
    listRequesterNotifications(supabase, currentProfile.id),
    listPendingHostNotifications(supabase, hostedMatchIds),
  ]);

  const earlyProfileIds = new Set([
    currentProfile.id,
    ...hostedMatches.map((match) => match.creator_profile_id),
    ...requesterNotifications.map((request) => request.requester_profile_id),
    ...requesterNotifications.map((request) => request.host_profile_id),
    ...hostNotifications.map((request) => request.requester_profile_id),
    ...hostNotifications.map((request) => request.host_profile_id),
  ]);

  const externalMatchIds = Array.from(
    new Set(
      requesterNotifications
        .map((request) => request.match_id)
        .filter((matchId) => !hostedMatchIdSet.has(matchId)),
    ),
  );

  const [externalMatches, earlyProfiles] = await Promise.all([
    listMatchesByIds(supabase, externalMatchIds),
    listProfilesByIds(Array.from(earlyProfileIds)),
  ]);

  const requests = dedupeById([...requesterNotifications, ...hostNotifications]);
  const matches = dedupeById([...hostedMatches, ...externalMatches]);

  const allProfileIds = new Set([
    ...earlyProfileIds,
    ...externalMatches.map((match) => match.creator_profile_id),
  ]);
  const missingProfileIds = Array.from(allProfileIds).filter((id) => !earlyProfileIds.has(id));
  const extraProfiles = missingProfileIds.length > 0 ? await listProfilesByIds(missingProfileIds) : [];
  const profiles = dedupeById([...earlyProfiles, ...extraProfiles]);

  const notifications = deriveNotificationsFromRequests(currentProfile.id, matches, requests, profiles);
  const readRows = await listNotificationReads(
    supabase,
    currentProfile.id,
    notifications.map((notification) => notification.id),
  );
  const notificationsWithReads = applyNotificationReads(notifications, readRows);

  return createAppStateSnapshot({
    currentProfile,
    profiles,
    matches,
    requests,
    notifications: notificationsWithReads,
  });
}

export async function getUnreadNotificationCount() {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile) {
    return 0;
  }

  const supabase = await createServerSupabaseClient();
  const hostedMatches = await listHostedMatches(supabase, currentProfile.id);
  const hostedMatchIds = hostedMatches.map((match) => match.id);

  const [requesterNotifications, hostNotifications] = await Promise.all([
    listRequesterNotifications(supabase, currentProfile.id),
    listPendingHostNotifications(supabase, hostedMatchIds),
  ]);

  const notificationIds = dedupeById([...requesterNotifications, ...hostNotifications])
    .map((request) => getDerivedNotificationId(currentProfile.id, request))
    .filter((notificationId): notificationId is string => Boolean(notificationId));

  const readRows = await listNotificationReads(supabase, currentProfile.id, notificationIds);

  return notificationIds.length - readRows.length;
}

export async function markNotificationsRead(notificationIds: string[]) {
  const currentProfile = await getCurrentProfile();

  if (!currentProfile || notificationIds.length === 0) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const readAt = new Date().toISOString();
  const rows = notificationIds.map((notificationId) => ({
    profile_id: currentProfile.id,
    notification_id: notificationId,
    read_at: readAt,
    created_at: readAt,
  }));

  const { error } = await supabase
    .from("notification_reads")
    .upsert(rows, { onConflict: "profile_id,notification_id" });

  if (error) {
    if (isNotificationReadStorageMissing(error)) {
      return;
    }

    throw error;
  }
}
