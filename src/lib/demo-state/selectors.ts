import { getMatchById } from "@/lib/feed";
import { getRegionLabel, getSkillLevelLabel } from "@/lib/constants";
import type {
  AppNotification,
  DemoAppState,
  FeedContext,
  Match,
  ParticipationRequest,
  ParticipationStatus,
} from "@/lib/types";

export function getCurrentProfile(state: DemoAppState) {
  return state.profiles.find((profile) => profile.id === state.currentProfileId);
}

export function getProfileById(state: DemoAppState, profileId: string) {
  return state.profiles.find((profile) => profile.id === profileId);
}

export function getMatch(state: DemoAppState, matchId: string) {
  return state.matches.find((match) => match.id === matchId);
}

export function getMatchOrganizer(state: DemoAppState, match: Match) {
  return getProfileById(state, match.creator_profile_id);
}

export function getMyParticipationRequests(state: DemoAppState) {
  return state.participationRequests
    .filter((request) => request.requester_profile_id === state.currentProfileId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function getInboundRequestsForMatch(state: DemoAppState, matchId: string) {
  return state.participationRequests
    .filter((request) => request.match_id === matchId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function getHostedMatches(state: DemoAppState) {
  return state.matches.filter(
    (match) => match.creator_profile_id === state.currentProfileId && match.status !== "cancelled",
  );
}

export function getNotificationsForCurrentProfile(state: DemoAppState) {
  return state.notifications
    .filter((notification) => notification.profile_id === state.currentProfileId)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function getUnreadNotificationCount(state: DemoAppState) {
  return getNotificationsForCurrentProfile(state).filter((notification) => !notification.read_at).length;
}

export function getUnreadNotificationIds(state: DemoAppState) {
  return getNotificationsForCurrentProfile(state)
    .filter((notification) => !notification.read_at)
    .map((notification) => notification.id);
}

export function getNotificationTone(notification: AppNotification) {
  if (notification.kind === "request_accepted" || notification.kind === "request_confirmed") {
    return "bg-[#e4f6e8] text-[#1f7a38]" as const;
  }

  if (notification.kind === "request_rejected") {
    return "bg-[#f6f1f0] text-[#6b5852]" as const;
  }

  return "bg-[#fff0d7] text-[#9a6111]" as const;
}

export function getParticipationForMatch(
  state: DemoAppState,
  matchId: string,
  requesterId = state.currentProfileId,
) {
  return state.participationRequests.find(
    (request) => request.match_id === matchId && request.requester_profile_id === requesterId,
  );
}

export function getActiveParticipationForMatch(
  state: DemoAppState,
  matchId: string,
  requesterId = state.currentProfileId,
) {
  return state.participationRequests.find(
    (request) =>
      request.match_id === matchId &&
      request.requester_profile_id === requesterId &&
      ["pending", "accepted", "confirmed"].includes(request.status),
  );
}

export function getParticipationStatusLabel(status: ParticipationStatus) {
  if (status === "pending") {
    return "호스트 확인 대기";
  }

  if (status === "accepted") {
    return "오픈채팅 조율 중";
  }

  if (status === "confirmed") {
    return "최종 확정";
  }

  if (status === "rejected") {
    return "거절됨";
  }

  if (status === "expired") {
    return "마감됨";
  }

  return "취소됨";
}

export function getParticipationStatusTone(status: ParticipationStatus) {
  if (status === "confirmed") {
    return "success" as const;
  }

  if (status === "accepted") {
    return "team" as const;
  }

  if (status === "pending") {
    return "soon" as const;
  }

  return "outline" as const;
}

export function getParticipationSummary(request: ParticipationRequest, match: Match) {
  if (match.mode === "team") {
    return "팀 1개 요청";
  }

  return `${request.requested_count}명 요청`;
}

export function getParticipationContactLink(
  state: DemoAppState,
  request: ParticipationRequest,
) {
  const match = getMatch(state, request.match_id);

  if (!match || !["accepted", "confirmed"].includes(request.status)) {
    return null;
  }

  if (request.accepted_contact_link) {
    return {
      href: request.accepted_contact_link,
      label: "오픈채팅방 접속",
    };
  }

  if (match.contact_type === "openchat" && match.contact_link) {
    return {
      href: match.contact_link,
      label: "오픈채팅방 접속",
    };
  }

  const host = getProfileById(state, request.host_profile_id);

  if (!host?.open_chat_link) {
    return null;
  }

  return {
    href: host.open_chat_link,
    label: "오픈채팅방 접속",
  };
}

export function getDefaultRequestedCount(match: Match, context?: FeedContext) {
  if (match.mode === "team") {
    return 1;
  }

  const requested = context?.groupSize ?? match.min_group_size;
  return Math.min(
    Math.max(requested, match.min_group_size),
    Math.min(match.max_group_size, match.remaining_slots),
  );
}

export function getMatchMetaForState(
  state: DemoAppState,
  matchId: string,
  referenceNow: number,
) {
  return getMatchById(state, matchId, referenceNow);
}

export function getMatchRegionLabel(match: Match) {
  return getRegionLabel(match.region_slug);
}

export function getProfileSkillLabel(state: DemoAppState, profileId: string) {
  const profile = getProfileById(state, profileId);
  return profile ? getSkillLevelLabel(profile.skill_level) : null;
}
