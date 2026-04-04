import { createDemoSeed } from "@/lib/demo-state/seed";
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

const activeStatuses: ParticipationStatus[] = ["pending", "accepted"];

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
      activeStatuses.includes(request.status),
  );
}

function closeRemainingRequests(state: DemoAppState, matchId: string, acceptedRequestId: string) {
  const now = new Date().toISOString();

  state.participationRequests = state.participationRequests.map((request) => {
    if (
      request.match_id !== matchId ||
      request.id === acceptedRequestId ||
      !activeStatuses.includes(request.status)
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
      "nickname" | "preferred_mode" | "preferred_regions" | "skill_level" | "age" | "open_chat_link"
    >
  >,
) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);

  Object.assign(currentProfile, updates);

  return next;
}

export function createMatch(state: DemoAppState, input: CreateMatchInput) {
  if (!input.contact_link.trim()) {
    throw new Error("연결용 오픈채팅 링크를 입력해주세요.");
  }

  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const createdAt = new Date().toISOString();
  const createdMatch: Match = {
    ...input,
    id: createId("match"),
    creator_profile_id: currentProfile.id,
    status: "open",
    created_at: createdAt,
    updated_at: createdAt,
  };

  next.matches = [createdMatch, ...next.matches];

  return { state: next, match: createdMatch };
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
  const requester = getProfile(next, request.requester_profile_id);

  if (!match.contact_link?.trim()) {
    throw new Error("CONTACT_LINK_REQUIRED");
  }

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  if (match.remaining_slots < request.requested_count) {
    throw new Error("남은 자리가 부족합니다.");
  }

  match.remaining_slots -= request.requested_count;
  match.updated_at = new Date().toISOString();

  if (match.remaining_slots <= 0) {
    match.remaining_slots = 0;
    match.status = "matched";
  }

  request.status = "accepted";
  request.decided_at = new Date().toISOString();
  request.updated_at = request.decided_at;
  request.host_note = hostNote?.trim() || request.host_note;
  request.accepted_contact_link = match.contact_link || null;

  if (match.status === "matched") {
    closeRemainingRequests(next, match.id, request.id);
  }

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

export function rejectParticipation(state: DemoAppState, requestId: string, hostNote?: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.host_profile_id !== currentProfile.id) {
    throw new Error("호스트만 요청을 거절할 수 있습니다.");
  }

  if (request.status !== "pending") {
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
