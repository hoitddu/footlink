"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentProfile } from "@/lib/repositories/profiles";
import { mapMatchRow } from "@/lib/supabase/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateMatchInput } from "@/lib/types";
import type { MatchRow } from "@/lib/supabase/types";

export async function createMatchAction(input: CreateMatchInput) {
  const currentProfile = await requireCurrentProfile();

  if (!input.contact_link.trim()) {
    throw new Error("CONTACT_LINK_REQUIRED");
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const payload = {
    ...input,
    creator_profile_id: currentProfile.id,
    contact_link: input.contact_link.trim(),
    note: input.note.trim() || null,
    status: "open" as const,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("matches")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const match = mapMatchRow(data as MatchRow);

  revalidatePath("/home");
  revalidatePath("/create");
  revalidatePath("/activity");
  revalidatePath(`/match/${match.id}`);

  return match;
}
