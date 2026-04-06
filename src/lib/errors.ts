const APP_ERROR_MESSAGES = {
  AUTH_REQUIRED: "인증 세션이 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.",
  PROFILE_REQUIRED: "프로필을 먼저 저장해 주세요.",
  CONTACT_LINK_REQUIRED: "연결용 오픈채팅 링크를 입력해 주세요.",
  OWN_MATCH_REQUEST_FORBIDDEN: "내가 만든 매치에는 참가 요청을 보낼 수 없습니다.",
  MATCH_CLOSED: "이미 마감된 매치입니다.",
  REQUEST_COUNT_EXCEEDS_REMAINING: "남은 자리보다 많은 인원을 요청할 수 없습니다.",
  MATCH_DELETE_HAS_ACCEPTED_REQUESTS: "이미 수락된 참가자가 있는 모집은 삭제할 수 없습니다.",
  PROFILE_SAVE_INCOMPLETE: "프로필 저장이 완전하지 않습니다. 다시 시도해 주세요.",
} as const;

export type AppErrorCode = keyof typeof APP_ERROR_MESSAGES;

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message?: unknown };

    if (typeof message === "string") {
      return message;
    }
  }

  return null;
}

function isAppErrorCode(value: string): value is AppErrorCode {
  return Object.prototype.hasOwnProperty.call(APP_ERROR_MESSAGES, value);
}

function isUserFacingMessage(message: string) {
  return /[가-힣]/.test(message);
}

export function createAppError(code: AppErrorCode) {
  return new Error(code);
}

export function isAppError(error: unknown): error is Error {
  const message = getRawErrorMessage(error);

  return message ? isAppErrorCode(message) : false;
}

export function getAppErrorCode(error: unknown) {
  const message = getRawErrorMessage(error);

  return message && isAppErrorCode(message) ? message : null;
}

export function requiresProfileSetup(error: unknown) {
  const code = getAppErrorCode(error);

  return code === "AUTH_REQUIRED" || code === "PROFILE_REQUIRED";
}

export function getUserFacingErrorMessage(error: unknown, fallbackMessage: string) {
  const message = getRawErrorMessage(error);

  if (!message) {
    return fallbackMessage;
  }

  if (isAppErrorCode(message)) {
    return APP_ERROR_MESSAGES[message];
  }

  return isUserFacingMessage(message) ? message : fallbackMessage;
}

export function toUserFacingError(error: unknown, fallbackMessage: string) {
  return new Error(getUserFacingErrorMessage(error, fallbackMessage));
}
