"use server";

import { revalidatePath } from "next/cache";

import { isAppError, toUserFacingError } from "@/lib/errors";
import { upsertCurrentProfile } from "@/lib/repositories/profiles";
import type { UpdateProfileInput } from "@/lib/types";

export async function upsertProfileAction(input: UpdateProfileInput) {
  try {
    const profile = await upsertCurrentProfile(input);

    revalidatePath("/profile");
    revalidatePath("/create");
    revalidatePath("/activity");
    revalidatePath("/home");

    return profile;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
