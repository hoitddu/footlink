import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import { getCurrentProfile, listProfilesByIds } from "@/lib/repositories/profiles";
import { scheduleMatchLifecycleMaintenance } from "@/lib/repositories/lifecycle";
import {
  createAppStateSnapshot,
  deriveNotificationsFromRequests,
  getDerivedNotificationId,
} from "@/lib/repositories/snapshots";
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
type RequestActivityDismissalRow = { request_id: string };

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

async function listDismissedRequestIds(supabase: SupabaseClient, currentProfileId: string) {
  const { data, error } = await supabase
    .from("request_activity_dismissals")
    .select("request_id")
    .eq("profile_id", currentProfileId)
    .returns<RequestActivityDismissalRow[]>();

  if (error) {
    throw error;
  }

  return new Set((data ?? []).map((row) => row.request_id));
}

async function listHostedMatches(supabase: SupabaseClient, currentProfileId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_ACTIVITY_SELECT)
    .eq("creator_profile_id", currentProfileId)
    .in("status", ["open", "matched"])
    .gt("start_at", now)
    .order("start_at", { ascending: true })
    .returns<ActivityMatchRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRow);
}

async function listInboundRequestsByHost(supabase: SupabaseClient, hostProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .eq("host_profile_id", hostProfileId)
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

async function listPendingHostNotifications(supabase: SupabaseClient, hostProfileId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_ACTIVITY_SELECT)
    .eq("host_profile_id", hostProfileId)
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

  // Housekeeping runs in the background; never block page render.
  scheduleMatchLifecycleMaintenance();

  const supabase = await createServerSupabaseClient();

  // Single parallel wave: inbound requests are filtered by host_profile_id directly,
  // so they no longer depend on hostedMatchIds resolving first.
  const [hostedMatches, primaryRequests, dismissedRequestIds, inboundRequests] =
    await Promise.all([
      listHostedMatches(supabase, currentProfile.id),
      listMyRequests(supabase, currentProfile.id),
      listDismissedRequestIds(supabase, currentProfile.id),
      listInboundRequestsByHost(supabase, currentProfile.id),
    ]);

  const visiblePrimaryRequests = primaryRequests.filter(
    (request) => !dismissedRequestIds.has(request.id),
  );

  const hostedMatchIdSet = new Set(hostedMatches.map((match) => match.id));

  const externalMatchIds = Array.from(
    new Set(
      visiblePrimaryRequests
        .map((r) => r.match_id)
        .filter((id) => !hostedMatchIdSet.has(id)),
    ),
  );

  const profileIds = new Set<string>([
    currentProfile.id,
    ...hostedMatches.map((match) => match.creator_profile_id),
    ...visiblePrimaryRequests.map((r) => r.requester_profile_id),
    ...visiblePrimaryRequests.map((r) => r.host_profile_id),
    ...inboundRequests.map((r) => r.requester_profile_id),
    ...inboundRequests.map((r) => r.host_profile_id),
  ]);

  // Second (and final) wave: external matches + a single profile fetch
  // that already includes every id we need.
  const [externalMatches, profilesFromFirstPass] = await Promise.all([
    listMatchesByIds(supabase, externalMatchIds),
    listProfilesByIds(Array.from(profileIds)),
  ]);

  const externalCreatorIds = externalMatches
    .map((match) => match.creator_profile_id)
    .filter((id) => !profileIds.has(id));

  const extraProfiles =
    externalCreatorIds.length > 0 ? await listProfilesByIds(externalCreatorIds) : [];

  const requests = dedupeById([...visiblePrimaryRequests, ...inboundRequests]);
  const matches = dedupeById([...hostedMatches, ...externalMatches]);
  const profiles = dedupeById([...profilesFromFirstPass, ...extraProfiles]);

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

  const [hostedMatches, requesterNotifications, hostNotifications] = await Promise.all([
    listHostedMatches(supabase, currentProfile.id),
    listRequesterNotifications(supabase, currentProfile.id),
    listPendingHostNotifications(supabase, currentProfile.id),
  ]);
  const hostedMatchIdSet = new Set(hostedMatches.map((match) => match.id));

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

  const [requesterNotifications, hostNotifications] = await Promise.all([
    listRequesterNotifications(supabase, currentProfile.id),
    listPendingHostNotifications(supabase, currentProfile.id),
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
