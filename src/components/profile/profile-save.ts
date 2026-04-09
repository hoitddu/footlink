"use client";

import { ensureAnonymousSessionAction } from "@/app/actions/auth";
import { upsertProfileAction } from "@/app/actions/profile";
import { primeCurrentProfile } from "@/lib/current-profile-client";
import { createAppError } from "@/lib/errors";
import type { UpdateProfileInput } from "@/lib/types";

export async function saveProfile(input: UpdateProfileInput) {
  const userId = await ensureAnonymousSessionAction();

  if (!userId) {
    throw createAppError("AUTH_REQUIRED");
  }

  const profile = await upsertProfileAction(input);
  primeCurrentProfile(profile);
  return profile;
}
