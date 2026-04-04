import type { Profile } from "@/lib/types";

export function isProfileComplete(profile?: Profile | null) {
  return Boolean(profile?.nickname?.trim() && profile?.age && profile?.skill_level);
}
