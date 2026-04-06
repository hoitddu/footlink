import { REGION_OPTIONS, getRegionLabel } from "@/lib/constants";
import type { AppNotification, DemoAppState, Match, ParticipationRequest, Profile } from "@/lib/types";

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function getDerivedNotificationId(
  currentProfileId: string,
  request: ParticipationRequest,
) {
  if (request.host_profile_id === currentProfileId && request.status === "pending") {
    return `host-${request.id}`;
  }

  if (request.requester_profile_id !== currentProfileId) {
    return null;
  }

  if (request.status === "accepted") {
    return `accepted-${request.id}`;
  }

  if (request.status === "confirmed") {
    return `confirmed-${request.id}`;
  }

  if (request.status === "rejected") {
    return `rejected-${request.id}`;
  }

  return null;
}

export function createAppStateSnapshot({
  currentProfile,
  profiles,
  matches,
  requests,
  notifications = [],
}: {
  currentProfile?: Profile | null;
  profiles?: Profile[];
  matches?: Match[];
  requests?: ParticipationRequest[];
  notifications?: AppNotification[];
}): DemoAppState {
  const mergedProfiles = dedupeById([...(currentProfile ? [currentProfile] : []), ...(profiles ?? [])]);

  return {
    currentProfileId: currentProfile?.id ?? "",
    profiles: mergedProfiles,
    matches: dedupeById(matches ?? []),
    participationRequests: dedupeById(requests ?? []),
    notifications,
    regions: REGION_OPTIONS,
  };
}

export function deriveNotificationsFromRequests(
  currentProfileId: string,
  matches: Match[],
  requests: ParticipationRequest[],
  profiles: Profile[],
) {
  const matchMap = new Map(matches.map((match) => [match.id, match]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const notifications: AppNotification[] = [];

  requests.forEach((request) => {
    const match = matchMap.get(request.match_id);

    if (!match) {
      return;
    }

    if (request.host_profile_id === currentProfileId && request.status === "pending") {
      const requester = profileMap.get(request.requester_profile_id);
      notifications.push({
        id: getDerivedNotificationId(currentProfileId, request) ?? request.id,
        profile_id: currentProfileId,
        kind: "host_request_received",
        title: "새 참가 요청이 도착했어요",
        body: `${requester?.nickname ?? "참가자"}님이 ${match.title}에 참가를 요청했어요.`,
        href: `/activity?tab=listings&highlight=${match.id}`,
        created_at: request.created_at,
        related_match_id: match.id,
        related_request_id: request.id,
      });
    }

    if (request.requester_profile_id !== currentProfileId) {
      return;
    }

    if (request.status === "accepted") {
      const host = profileMap.get(request.host_profile_id);
      notifications.push({
        id: getDerivedNotificationId(currentProfileId, request) ?? request.id,
        profile_id: currentProfileId,
        kind: "request_accepted",
        title: "참가 요청이 수락됐어요",
        body: `${host?.nickname ?? getRegionLabel(match.region_slug)}님이 ${match.title} 요청을 수락했어요.`,
        href: `/activity?tab=requests&highlight=${request.id}&flash=accepted`,
        created_at: request.decided_at ?? request.created_at,
        related_match_id: match.id,
        related_request_id: request.id,
      });
    }

    if (request.status === "confirmed") {
      const host = profileMap.get(request.host_profile_id);
      notifications.push({
        id: getDerivedNotificationId(currentProfileId, request) ?? request.id,
        profile_id: currentProfileId,
        kind: "request_confirmed",
        title: "참가가 최종 확정됐어요",
        body: `${host?.nickname ?? getRegionLabel(match.region_slug)}님이 ${match.title} 참가를 최종 확정했어요.`,
        href: `/activity?tab=requests&highlight=${request.id}&flash=confirmed`,
        created_at: request.decided_at ?? request.created_at,
        related_match_id: match.id,
        related_request_id: request.id,
      });
    }

    if (request.status === "rejected") {
      const host = profileMap.get(request.host_profile_id);
      notifications.push({
        id: getDerivedNotificationId(currentProfileId, request) ?? request.id,
        profile_id: currentProfileId,
        kind: "request_rejected",
        title: "참가 요청이 거절됐어요",
        body: `${host?.nickname ?? getRegionLabel(match.region_slug)}님이 ${match.title} 요청을 거절했어요.`,
        href: `/activity?tab=requests&highlight=${request.id}&flash=rejected`,
        created_at: request.decided_at ?? request.created_at,
        related_match_id: match.id,
        related_request_id: request.id,
      });
    }
  });

  return notifications.sort((left, right) => right.created_at.localeCompare(left.created_at));
}
