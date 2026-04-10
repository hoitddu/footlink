import type { ContactType, DirectContactType, Profile } from "@/lib/types";

export type ContactActionKind = "call" | "sms" | "openchat";

export type ContactAction = {
  href: string;
  label: string;
  kind: ContactActionKind;
};

export const DIRECT_CONTACT_OPTIONS: Array<{
  value: DirectContactType;
  label: string;
}> = [
  { value: "openchat", label: "\uC624\uD508\uCC44\uD305" },
  { value: "phone", label: "\uD734\uB300\uD3F0" },
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

export function resolveContactType(
  type: ContactType,
  value?: string | null,
): ContactType {
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
  return buildContactActions(type, value)[0]?.href ?? null;
}

export function buildContactActions(
  type: ContactType,
  value?: string | null,
): ContactAction[] {
  const normalized = normalizeContactValue(type, value ?? "");

  if (!normalized) {
    return [];
  }

  if (type === "phone") {
    return [
      {
        href: `tel:${normalized}`,
        label: "\uC804\uD654\uD558\uAE30",
        kind: "call",
      },
      {
        href: `sms:${normalized}`,
        label: "\uBB38\uC790 \uBCF4\uB0B4\uAE30",
        kind: "sms",
      },
    ];
  }

  if (type === "openchat") {
    return [
      {
        href: normalized,
        label: "\uC624\uD508\uCC44\uD305 \uC5F4\uAE30",
        kind: "openchat",
      },
    ];
  }

  return [];
}

export function getContactTypeLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "\uC804\uD654/\uBB38\uC790";
    case "openchat":
      return "\uC624\uD508\uCC44\uD305";
    default:
      return "\uC571\uC5D0\uC11C \uC870\uC728";
  }
}

export function getContactBadgeLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "\uC804\uD654\u00B7\uBB38\uC790 \uAC00\uB2A5";
    case "openchat":
      return "\uC624\uD508\uCC44\uD305 \uAC00\uB2A5";
    default:
      return "\uC571\uC5D0\uC11C \uC870\uC728";
  }
}

export function getContactActionLabel(type: ContactType) {
  switch (type) {
    case "phone":
      return "\uC804\uD654\uD558\uAE30";
    case "openchat":
      return "\uC624\uD508\uCC44\uD305 \uC5F4\uAE30";
    default:
      return "\uC5F0\uB77D\uD558\uAE30";
  }
}

export function getContactFieldLabel(type: DirectContactType) {
  return type === "phone"
    ? "\uD734\uB300\uD3F0 \uBC88\uD638"
    : "\uC624\uD508\uCC44\uD305 \uB9C1\uD06C";
}

export function getContactFieldPlaceholder(type: DirectContactType) {
  return type === "phone" ? "01012345678" : "https://open.kakao.com/...";
}

export function getContactDescription(type: ContactType) {
  switch (type) {
    case "phone":
      return "\uCC38\uC5EC \uC694\uCCAD\uC774 \uC218\uB77D\uB418\uBA74 \uC804\uD654\uB098 \uBB38\uC790\uB85C \uBC14\uB85C \uC5F0\uB77D\uD560 \uC218 \uC788\uC5B4\uC694.";
    case "openchat":
      return "\uCC38\uC5EC \uC694\uCCAD\uC774 \uC218\uB77D\uB418\uBA74 \uC624\uD508\uCC44\uD305\uC73C\uB85C \uBC14\uB85C \uC5F0\uACB0\uD560 \uC218 \uC788\uC5B4\uC694.";
    default:
      return "\uC571\uC5D0\uC11C \uC694\uCCAD\uC744 \uBCF4\uB0B4\uBA74 \uD638\uC2A4\uD2B8\uAC00 \uD655\uC778 \uD6C4 \uC0C1\uD0DC\uB97C \uC5C5\uB370\uC774\uD2B8\uD569\uB2C8\uB2E4.";
  }
}

export function getProfileDefaultContactType(
  profile?: Profile | null,
): DirectContactType {
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

export function getProfileContactValue(
  profile: Profile | null | undefined,
  type: DirectContactType,
) {
  if (type === "phone") {
    return profile?.phone_number ?? "";
  }

  return profile?.open_chat_link ?? "";
}
