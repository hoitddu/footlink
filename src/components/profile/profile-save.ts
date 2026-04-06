"use client";

import { upsertProfileAction } from "@/app/actions/profile";
import { createAppError } from "@/lib/errors";
import { ensureAnonymousSession } from "@/lib/supabase/client";
import type { UpdateProfileInput } from "@/lib/types";

export async function saveProfile(input: UpdateProfileInput) {
  const user = await ensureAnonymousSession();

  if (!user) {
    throw createAppError("AUTH_REQUIRED");
  }

  return upsertProfileAction(input);
}
