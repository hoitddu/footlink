"use server";

import { revalidatePath } from "next/cache";

import { upsertCurrentProfile } from "@/lib/repositories/profiles";
import type { UpdateProfileInput } from "@/lib/types";

export async function upsertProfileAction(input: UpdateProfileInput) {
  const profile = await upsertCurrentProfile(input);

  revalidatePath("/profile");
  revalidatePath("/create");
  revalidatePath("/activity");
  revalidatePath("/home");

  return profile;
}
