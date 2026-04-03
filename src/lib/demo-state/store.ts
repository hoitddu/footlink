import { createDemoSeed } from "@/lib/demo-state/seed";
import type {
  CreateMatchInput,
  DemoNotification,
  DemoAppState,
  Match,
  ParticipationRequest,
  ParticipationStatus,
  Profile,
  SubmitParticipationInput,
} from "@/lib/types";

const activeStatuses: ParticipationStatus[] = ["pending", "chat_entered", "accepted"];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: DemoAppState): DemoAppState {
  return {
    currentProfileId: state.currentProfileId,
    matches: state.matches.map((match) => ({ ...match })),
    participationRequests: state.participationRequests.map((request) => ({ ...request })),
    notifications: state.notifications.map((notification) => ({ ...notification })),
    profiles: state.profiles.map((profile) => ({ ...profile, preferred_regions: [...profile.preferred_regions] })),
    regions: state.regions.map((region) => ({ ...region })),
  };
}

function getCurrentProfile(state: DemoAppState) {
  const profile = state.profiles.find((item) => item.id === state.currentProfileId);

  if (!profile) {
    throw new Error("현재 데모 유저를 찾을 수 없습니다.");
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
    throw new Error("참가 기록을 찾을 수 없습니다.");
  }

  return request;
}

function assertProfileExists(state: DemoAppState, profileId: string) {
  if (!state.profiles.some((profile) => profile.id === profileId)) {
    throw new Error("데모 유저를 찾을 수 없습니다.");
  }
}

function getProfile(state: DemoAppState, profileId: string) {
  const profile = state.profiles.find((item) => item.id === profileId);

  if (!profile) {
    throw new Error("프로필을 찾을 수 없습니다.");
  }

  return profile;
}

function pushNotification(state: DemoAppState, notification: Omit<DemoNotification, "id" | "created_at">) {
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
    max: Math.min(match.max_group_size, Math.max(match.needed_count, 1)),
  };
}

function findActiveParticipation(
  state: DemoAppState,
  matchId: string,
  requesterId: string,
) {
  return state.participationRequests.find(
    (request) =>
      request.match_id === matchId &&
      request.requester_id === requesterId &&
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
      status: "rejected",
      decided_at: now,
      host_note: request.host_note ?? "정원이 모두 마감되었습니다.",
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
  if (input.contact_type === "openchat" && !input.contact_value.trim()) {
    throw new Error("오픈채팅 링크를 입력해주세요.");
  }

  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const createdMatch: Match = {
    ...input,
    id: createId("match"),
    creator_id: currentProfile.id,
    status: "open",
  };

  next.matches = [createdMatch, ...next.matches];

  return { state: next, match: createdMatch };
}

export function submitParticipation(state: DemoAppState, input: SubmitParticipationInput) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const match = getMatch(next, input.matchId);
  const host = getProfile(next, match.creator_id);

  if (match.creator_id === currentProfile.id) {
    throw new Error("내가 만든 매치에는 참가 요청을 보낼 수 없습니다.");
  }

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  const existing = findActiveParticipation(next, match.id, currentProfile.id);

  if (existing) {
    throw new Error("이미 진행 중인 참가 기록이 있습니다.");
  }

  const requestedCount = Math.trunc(input.requestedCount);
  const allowed = getAllowedRequestCount(match);

  if (!Number.isFinite(requestedCount) || requestedCount < allowed.min || requestedCount > allowed.max) {
    throw new Error("요청 가능한 인원 수가 아닙니다.");
  }

  if (requestedCount > match.needed_count) {
    throw new Error("남은 자리보다 많은 인원을 요청할 수 없습니다.");
  }

  const createdRequest: ParticipationRequest = {
    id: createId("request"),
    match_id: match.id,
    requester_id: currentProfile.id,
    host_id: match.creator_id,
    entry_channel: match.contact_type,
    requested_count: requestedCount,
    message: input.message.trim(),
    status: match.contact_type === "openchat" ? "chat_entered" : "pending",
    created_at: new Date().toISOString(),
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

  if (request.host_id !== currentProfile.id) {
    throw new Error("호스트만 요청을 수락할 수 있습니다.");
  }

  if (!["pending", "chat_entered"].includes(request.status)) {
    throw new Error("수락할 수 없는 상태입니다.");
  }

  const match = getMatch(next, request.match_id);
  const requester = getProfile(next, request.requester_id);

  if (request.entry_channel === "request_only" && !currentProfile.open_chat_link?.trim()) {
    throw new Error("요청을 수락하기 전에 프로필에 오픈채팅 링크를 먼저 설정해주세요.");
  }

  if (match.status !== "open") {
    throw new Error("이미 마감된 매치입니다.");
  }

  if (match.needed_count < request.requested_count) {
    throw new Error("남은 자리가 부족합니다.");
  }

  match.needed_count -= request.requested_count;
  if (match.needed_count <= 0) {
    match.needed_count = 0;
    match.status = "matched";
  }

  request.status = "accepted";
  request.decided_at = new Date().toISOString();
  request.host_note = hostNote?.trim() || request.host_note;

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

  if (request.host_id !== currentProfile.id) {
    throw new Error("호스트만 요청을 거절할 수 있습니다.");
  }

  if (!["pending", "chat_entered"].includes(request.status)) {
    throw new Error("거절할 수 없는 상태입니다.");
  }

  request.status = "rejected";
  request.decided_at = new Date().toISOString();
  request.host_note = hostNote?.trim() || request.host_note;

  return { state: next, request };
}

export function withdrawParticipation(state: DemoAppState, requestId: string) {
  const next = cloneState(state);
  const currentProfile = getCurrentProfile(next);
  const request = getRequest(next, requestId);

  if (request.requester_id !== currentProfile.id) {
    throw new Error("신청자만 요청을 취소할 수 있습니다.");
  }

  if (!["pending", "chat_entered"].includes(request.status)) {
    throw new Error("취소할 수 없는 상태입니다.");
  }

  request.status = "withdrawn";
  request.decided_at = new Date().toISOString();

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
