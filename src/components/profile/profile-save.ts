"use client";

import { ensureAnonymousSessionAction } from "@/app/actions/auth";
import { upsertProfileAction } from "@/app/actions/profile";
import { createAppError } from "@/lib/errors";
import type { UpdateProfileInput } from "@/lib/types";

export async function saveProfile(input: UpdateProfileInput) {
  const userId = await ensureAnonymousSessionAction();

  if (!userId) {
    throw createAppError("AUTH_REQUIRED");
  }

  return upsertProfileAction(input);
}
