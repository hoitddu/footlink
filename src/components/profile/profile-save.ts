"use client";

import { upsertProfileAction } from "@/app/actions/profile";
import { primeCurrentProfile } from "@/lib/current-profile-client";
import type { UpdateProfileInput } from "@/lib/types";

export async function saveProfile(input: UpdateProfileInput) {
  const profile = await upsertProfileAction(input);
  primeCurrentProfile(profile);
  return profile;
}
