import { createDemoSeed } from "@/lib/demo-state/seed";
import { getProfileContactValue, normalizeContactValue } from "@/lib/contact";
import { isPastKoreaDateTime } from "@/lib/utils";
import type {
  AppNotification,
  CreateMatchInput,
  DemoAppState,
  Match,
  ParticipationRequest,
  ParticipationStatus,
  Profile,
  SubmitParticipationInput,
} from "@/lib/types";

const duplicateBlockingStatuses: ParticipationStatus[] = ["pending", "accepted", "confirmed"];
const dismissibleParticipationStatuses: ParticipationStatus[] = ["rejected", "withdrawn", "expired"];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: DemoAppState): DemoAppState {
  return {
    currentProfileId: state.currentProfileId,
    matches: state.matches.map((match) => ({ ...match })),
    participationRequests: state.participationRequests.map((request) => ({ ...request })),
    notifications: state.notifications.map((notification) => ({ ...notification })),
    profiles: state.profiles.map((profile) => ({
      ...profile,
      preferred_regions: [...profile.preferred_regions],
    })),
    regions: state.regions.map((region) => ({ ...region })),
  };
}

function getCurrentProfile(state: DemoAppState) {
  const profile = state.profiles.find((item) => item.id === state.currentProfileId);

  if (!profile) {
    throw new Error("현재 데모 사용자를 찾을 수 없습니다.");
  }

  return profile;
}

function getMatch(state: DemoAppState, matchId: string) {
  const match = state.matches.find((item) => item.id === matchId);

  if (!match) {
    throw new Error("매치를 찾을 수 없습니다.");
  }

  return match;
}

function getRequest(state: DemoAppState, requestId: string) {
  const request = state.participationRequests.find((item) => item.id === requestId);

  if (!request) {
    throw new Error("참가 요청을 찾을 수 없습니다.");
  }

  return request;
}

function assertProfileExists(state: DemoAppState, profileId: string) {
  if (!state.profiles.some((profile) => profile.id === profileId)) {
    throw new Error("데모 사용자를 찾을 수 없습니다.");
  }
}

function getProfile(state: DemoAppState, profileId: string) {
  const profile = state.profiles.find((item) => item.id === profileId);

  if (!profile) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  return profile;
}

function pushNotification(
  state: DemoAppState,
  notification: Omit<AppNotification, "id" | "created_at">,
) {
  state.notifications = [
    {
      id: createId("notification"),
      created_at: new Date().toISOString(),
      ...notification,
    },
    ...state.notifications,
  ];
}

function getAllowedRequestCount(match: Match) {
  if (match.mode === "team") {
    return { min: 1, max: 1 };
  }

  return {
    min: match.min_group_size,
    max: Math.min(match.max_group_size, Math.max(match.remaining_slots, 1)),
  };
}

function findActiveParticipation(state: DemoAppState, matchId: string, requesterProfileId: string) {
  return state.participationRequests.find(
    (request) =>
      request.match_id === matchId &&
      request.requester_profile_id === requesterProfileId &&
      duplicateBlockingStatuses.includes(request.status),
  );
}

function closeOpenRequests(state: DemoAppState, matchId: string, keptRequestId: string) {
  const now = new Date().toISOString();

  state.participationRequests = state.participationRequests.map((request) => {
    if (
      request.match_id !== matchId ||
      request.id === keptRequestId ||
      !["pending", "accepted"].includes(request.status)
    ) {
      return request;
    }

    return {
      ...request,
      status: "expired",
      decided_at: now,
      updated_at: now,
      host_note: request.host_note ?? "정원이 모두 마감됐습니다.",
    };
  });
}

export function validateDemoState(value: unknown): value is DemoAppState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DemoAppState>;

  return (
    typeof candidate.currentProfileId === "string" &&
    Array.isArray(candidate.matches) &&
    Array.isArray(candidate.participationRequests) &&
    Array.isArray(candidate.notifications) &&
    Array.isArray(candidate.profiles) &&
    Array.isArray(candidate.regions)
  );
}

export function switchProfile(state: DemoAppState, profileId: string) {
  assertProfileExists(state, profileId);
  return {
    ...cloneState(state),
    currentProfileId: profileId,
  };
}

export function updateCurrentProfile(
  state: DemoAppState,
  updates: Partial<
    Pick<
      Profile,
      | "nickname"
      | "preferred_mode"
      | "preferred_regions"
      | "preferred_sport"
      | "skill_level"
      | "age"
      | "open_chat_link"
      | "phone_number"
      | "default_contact_type"
    >
  >,
) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);

  Object.assign(currentProfile, updates);

  return next;
}

export function createMatch(state: DemoAppState, input: CreateMatchInput) {
  if (isPastKoreaDateTime(input.start_at)) {
    throw new Error("MATCH_START_IN_PAST");
  }

  const normalizedContactValue = normalizeContactValue(input.contact_type, input.contact_link);

  if (!normalizedContactValue) {
    throw new Error("연락 정보를 입력해 주세요.");
  }

  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const createdAt = new Date().toISOString();
  const createdMatch: Match = {
    ...input,
    contact_link: normalizedContactValue,
    id: createId("match"),
    creator_profile_id: currentProfile.id,
    status: "open",
    created_at: createdAt,
    updated_at: createdAt,
  };

  next.matches = [createdMatch, ...next.matches];

  return { state: next, match: createdMatch };
}

export function cancelMatch(state: DemoAppState, matchId: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const match = getMatch(next, matchId);

  if (match.creator_profile_id !== currentProfile.id) {
    throw new Error("내가 만든 모집만 마감할 수 있습니다.");
  }

  if (match.status === "cancelled") {
    throw new Error("이미 마감된 모집입니다.");
  }

  const hasAcceptedRequest = next.participationRequests.some(
    (request) => request.match_id === match.id && request.status === "accepted",
  );
  const hasConfirmedRequest = next.participationRequests.some(
    (request) => request.match_id === match.id && request.status === "confirmed",
  );

  if (hasAcceptedRequest) {
    throw new Error("이미 수락된 참가자가 있는 모집은 마감할 수 없습니다.");
  }

  const now = new Date().toISOString();
  match.status = hasConfirmedRequest ? "matched" : "cancelled";
  match.updated_at = now;

  next.participationRequests = next.participationRequests.map((request) => {
    if (request.match_id !== match.id || request.status !== "pending") {
      return request;
    }

    return {
      ...request,
      status: "rejected",
      host_note: request.host_note ?? "호스트가 모집을 마감했습니다.",
      decided_at: now,
      updated_at: now,
    };
  });

  return { state: next, match };
}

export function submitParticipation(state: DemoAppState, input: SubmitParticipationInput) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const match = getMatch(next, input.matchId);
  const host = getProfile(next, match.creator_profile_id);

  if (match.creator_profile_id === currentProfile.id) {
    throw new Error("내가 만든 매치에는 참가 요청을 보낼 수 없습니다.");
  }

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  const existing = findActiveParticipation(next, match.id, currentProfile.id);

  if (existing) {
    throw new Error("이미 진행 중인 참가 요청이 있습니다.");
  }

  const requestedCount = Math.trunc(input.requestedCount);
  const allowed = getAllowedRequestCount(match);

  if (!Number.isFinite(requestedCount) || requestedCount < allowed.min || requestedCount > allowed.max) {
    throw new Error("요청 가능한 인원 수가 아닙니다.");
  }

  if (requestedCount > match.remaining_slots) {
    throw new Error("남은 자리보다 많은 인원을 요청할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const createdRequest: ParticipationRequest = {
    id: createId("request"),
    match_id: match.id,
    requester_profile_id: currentProfile.id,
    host_profile_id: match.creator_profile_id,
    entry_channel: match.contact_type,
    requested_count: requestedCount,
    message: input.message.trim(),
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  next.participationRequests = [createdRequest, ...next.participationRequests];
  pushNotification(next, {
    profile_id: host.id,
    kind: "host_request_received",
    title: "새 참가 요청이 도착했어요",
    body: `${currentProfile.nickname}님이 ${match.title}에 참가를 요청했어요.`,
    href: `/activity?tab=listings&highlight=${match.id}`,
    related_match_id: match.id,
    related_request_id: createdRequest.id,
  });

  return { state: next, request: createdRequest };
}

export function acceptParticipation(state: DemoAppState, requestId: string, hostNote?: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.host_profile_id !== currentProfile.id) {
    throw new Error("호스트만 요청을 수락할 수 있습니다.");
  }

  if (request.status !== "pending") {
    throw new Error("수락할 수 없는 요청 상태입니다.");
  }

  const match = getMatch(next, request.match_id);
  const host = getProfile(next, request.host_profile_id);
  const requester = getProfile(next, request.requester_profile_id);

  let acceptedContactValue = normalizeContactValue(match.contact_type, match.contact_link);

  if (!acceptedContactValue) {
    acceptedContactValue = normalizeContactValue(
      match.contact_type,
      getProfileContactValue(host, match.contact_type === "phone" ? "phone" : "openchat"),
    );
  }

  if (!acceptedContactValue) {
    throw new Error("CONTACT_LINK_REQUIRED");
  }

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  if (match.remaining_slots < request.requested_count) {
    throw new Error("남은 자리가 부족합니다.");
  }

  request.status = "accepted";
  request.decided_at = new Date().toISOString();
  request.updated_at = request.decided_at;
  request.host_note = hostNote?.trim() || request.host_note;
  request.accepted_contact_link = acceptedContactValue;

  pushNotification(next, {
    profile_id: requester.id,
    kind: "request_accepted",
    title: "참가 요청이 수락됐어요",
    body: `${currentProfile.nickname}님이 ${match.title} 요청을 수락했어요.`,
    href: `/activity?tab=requests&highlight=${request.id}&flash=accepted`,
    related_match_id: match.id,
    related_request_id: request.id,
  });

  return { state: next, request };
}

export function confirmParticipation(state: DemoAppState, requestId: string, hostNote?: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.host_profile_id !== currentProfile.id) {
    throw new Error("호스트만 최종 확정할 수 있습니다.");
  }

  if (request.status !== "accepted") {
    throw new Error("최종 확정할 수 없는 요청 상태입니다.");
  }

  const requester = getProfile(next, request.requester_profile_id);
  const match = getMatch(next, request.match_id);
  const now = new Date().toISOString();

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  if (match.remaining_slots < request.requested_count) {
    throw new Error("남은 자리가 부족합니다.");
  }

  match.remaining_slots -= request.requested_count;
  match.updated_at = now;

  if (match.remaining_slots <= 0) {
    match.remaining_slots = 0;
    match.status = "matched";
    closeOpenRequests(next, match.id, request.id);
  }

  request.status = "confirmed";
  request.decided_at = now;
  request.updated_at = now;
  request.host_note = hostNote?.trim() || request.host_note;

  pushNotification(next, {
    profile_id: requester.id,
    kind: "request_confirmed",
    title: "참가가 최종 확정됐어요",
    body: `${currentProfile.nickname}님이 ${match.title} 참가를 최종 확정했어요.`,
    href: `/activity?tab=requests&highlight=${request.id}&flash=confirmed`,
    related_match_id: match.id,
    related_request_id: request.id,
  });

  return { state: next, request };
}

export function cancelParticipationConfirmation(
  state: DemoAppState,
  requestId: string,
  hostNote?: string,
) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.host_profile_id !== currentProfile.id) {
    throw new Error("호스트만 확정을 취소할 수 있습니다.");
  }

  if (request.status !== "confirmed") {
    throw new Error("확정을 취소할 수 없는 요청 상태입니다.");
  }

  const now = new Date().toISOString();
  const match = getMatch(next, request.match_id);

  request.status = "accepted";
  request.decided_at = now;
  request.updated_at = now;
  request.host_note = hostNote?.trim() || request.host_note;

  match.remaining_slots = Math.min(match.total_slots, match.remaining_slots + request.requested_count);
  match.status = "open";
  match.updated_at = now;

  return { state: next, request };
}

export function rejectParticipation(state: DemoAppState, requestId: string, hostNote?: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.host_profile_id !== currentProfile.id) {
    throw new Error("호스트만 요청을 거절할 수 있습니다.");
  }

  if (!["pending", "accepted"].includes(request.status)) {
    throw new Error("거절할 수 없는 요청 상태입니다.");
  }

  const requester = getProfile(next, request.requester_profile_id);
  const match = getMatch(next, request.match_id);
  const now = new Date().toISOString();

  request.status = "rejected";
  request.decided_at = now;
  request.updated_at = now;
  request.host_note = hostNote?.trim() || request.host_note;

  pushNotification(next, {
    profile_id: requester.id,
    kind: "request_rejected",
    title: "참가 요청이 거절됐어요",
    body: `${currentProfile.nickname}님이 ${match.title} 요청을 거절했어요.`,
    href: `/activity?tab=requests&highlight=${request.id}&flash=rejected`,
    related_match_id: match.id,
    related_request_id: request.id,
  });

  return { state: next, request };
}

export function withdrawParticipation(state: DemoAppState, requestId: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.requester_profile_id !== currentProfile.id) {
    throw new Error("요청자만 참가 요청을 취소할 수 있습니다.");
  }

  if (request.status !== "pending") {
    throw new Error("취소할 수 없는 요청 상태입니다.");
  }

  const now = new Date().toISOString();
  request.status = "withdrawn";
  request.decided_at = now;
  request.updated_at = now;

  return { state: next, request };
}

export function dismissParticipationRequest(state: DemoAppState, requestId: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.requester_profile_id !== currentProfile.id) {
    throw new Error("요청자만 참여 기록을 삭제할 수 있습니다.");
  }

  if (!dismissibleParticipationStatuses.includes(request.status)) {
    throw new Error("삭제할 수 없는 참여 요청 상태입니다.");
  }

  next.participationRequests = next.participationRequests.filter((item) => item.id !== requestId);
  next.notifications = next.notifications.filter(
    (notification) =>
      !(notification.profile_id === currentProfile.id && notification.related_request_id === requestId),
  );

  return next;
}

export function markNotificationsRead(state: DemoAppState, notificationIds?: string[]) {
  const next = cloneState(state);
  const now = new Date().toISOString();
  const ids = notificationIds ? new Set(notificationIds) : null;

  next.notifications = next.notifications.map((notification) => {
    if (notification.profile_id !== next.currentProfileId || notification.read_at) {
      return notification;
    }

    if (ids && !ids.has(notification.id)) {
      return notification;
    }

    return {
      ...notification,
      read_at: now,
    };
  });

  return next;
}

export function createResetState() {
  return createDemoSeed();
}
