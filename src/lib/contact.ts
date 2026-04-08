import type { ContactType, DirectContactType, Profile } from "@/lib/types";

export const DIRECT_CONTACT_OPTIONS: Array<{
  value: DirectContactType;
  label: string;
}> = [
  { value: "openchat", label: "오픈채팅" },
  { value: "phone", label: "휴대폰" },
];

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatPhoneNumber(value: string) {
  const digits = normalizePhoneNumber(value);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function normalizeContactValue(type: ContactType, value: string) {
  if (type === "phone") {
    return normalizePhoneNumber(value);
  }

  return value.trim();
}

export function resolveContactType(type: ContactType, value?: string | null): ContactType {
  if (type !== "request_only") {
    return type;
  }

  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return type;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return "openchat";
  }

  if (normalizePhoneNumber(trimmedValue).length >= 9) {
    return "phone";
  }

  return type;
}

export function buildContactHref(type: ContactType, value?: string | null) {
  const normalized = normalizeContactValue(type, value ?? "");

  if (!normalized) {
    return null;
  }

  if (type === "phone") {
    return `tel:${normalized}`;
  }

  if (type === "openchat") {
    return normalized;
  }

  return null;
}

export function getContactTypeLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "전화";
    case "openchat":
      return "오픈채팅";
    default:
      return "앱에서 조율";
  }
}

export function getContactBadgeLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "전화 가능";
    case "openchat":
      return "오픈채팅 가능";
    default:
      return "앱에서 조율";
  }
}

export function getContactActionLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "전화하기";
    case "openchat":
      return "오픈채팅 열기";
    default:
      return "연락하기";
  }
}

export function getContactFieldLabel(type: DirectContactType) {
  return type === "phone" ? "휴대폰 번호" : "오픈채팅 링크";
}

export function getContactFieldPlaceholder(type: DirectContactType) {
  return type === "phone" ? "01012345678" : "https://open.kakao.com/...";
}

export function getContactDescription(type: ContactType) {
  switch (type) {
    case "phone":
      return "참여가 수락되면 바로 전화할 수 있습니다.";
    case "openchat":
      return "참여가 수락되면 바로 오픈채팅으로 이어집니다.";
    default:
      return "앱에서 요청을 보내면 호스트가 확인 후 상태를 업데이트합니다.";
  }
}

export function getProfileDefaultContactType(profile?: Profile | null): DirectContactType {
  if (profile?.default_contact_type === "phone" && profile.phone_number) {
    return "phone";
  }

  if (profile?.default_contact_type === "openchat" && profile.open_chat_link) {
    return "openchat";
  }

  if (profile?.open_chat_link) {
    return "openchat";
  }

  if (profile?.phone_number) {
    return "phone";
  }

  return "openchat";
}

export function getProfileContactValue(profile: Profile | null | undefined, type: DirectContactType) {
  if (type === "phone") {
    return profile?.phone_number ?? "";
  }

  return profile?.open_chat_link ?? "";
}
