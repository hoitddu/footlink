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

export async function cancelMatchAction(matchId: string) {
  const currentProfile = await requireCurrentProfile();
  const supabase = await createServerSupabaseClient();

  const { data: acceptedRequests, error: acceptedRequestsError } = await supabase
    .from("match_requests")
    .select("id")
    .eq("match_id", matchId)
    .in("status", ["accepted", "confirmed"]);

  if (acceptedRequestsError) {
    throw acceptedRequestsError;
  }

  if ((acceptedRequests ?? []).length > 0) {
    throw new Error("이미 수락된 참가자가 있는 모집은 삭제할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "cancelled",
      updated_at: now,
    })
    .eq("id", matchId)
    .eq("creator_profile_id", currentProfile.id)
    .neq("status", "cancelled")
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const { error: rejectPendingError } = await supabase
    .from("match_requests")
    .update({
      status: "rejected",
      host_note: "호스트가 모집을 삭제했습니다.",
      decided_at: now,
      updated_at: now,
    })
    .eq("match_id", matchId)
    .eq("status", "pending");

  if (rejectPendingError) {
    throw rejectPendingError;
  }

  const match = mapMatchRow(data as MatchRow);

  revalidatePath("/home");
  revalidatePath("/activity");
  revalidatePath(`/match/${match.id}`);

  return match;
}
