"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentProfile } from "@/lib/repositories/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mapMatchRequestRow, mapMatchRow } from "@/lib/supabase/mappers";
import type { SubmitParticipationInput } from "@/lib/types";
import type { MatchRequestRow, MatchRow } from "@/lib/supabase/types";

async function getRequestRow(requestId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("match_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (error) {
    throw error;
  }

  return mapMatchRequestRow(data as MatchRequestRow);
}

export async function submitParticipationAction(input: SubmitParticipationInput) {
  const currentProfile = await requireCurrentProfile();
  const supabase = await createServerSupabaseClient();
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", input.matchId)
    .single();

  if (matchError) {
    throw matchError;
  }

  const match = mapMatchRow(matchRow as MatchRow);

  if (match.creator_profile_id === currentProfile.id) {
    throw new Error("내가 만든 매치에는 참가 요청을 보낼 수 없습니다.");
  }

  if (match.status !== "open" || match.remaining_slots <= 0) {
    throw new Error("이미 마감된 매치입니다.");
  }

  if (input.requestedCount > match.remaining_slots) {
    throw new Error("남은 자리보다 많은 인원을 요청할 수 없습니다.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("match_requests")
    .insert({
      match_id: match.id,
      requester_profile_id: currentProfile.id,
      host_profile_id: match.creator_profile_id,
      requested_count: input.requestedCount,
      message: input.message.trim() || null,
      entry_channel: match.contact_type,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const request = mapMatchRequestRow(data as MatchRequestRow);

  revalidatePath("/home");
  revalidatePath("/activity");
  revalidatePath(`/match/${match.id}`);

  return request;
}

export async function acceptParticipationAction(requestId: string, hostNote?: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("accept_match_request", {
    p_request_id: requestId,
    p_host_note: hostNote?.trim() || null,
  });

  if (error) {
    throw error;
  }

  const request = await getRequestRow(requestId);

  revalidatePath("/home");
  revalidatePath("/activity");
  revalidatePath(`/match/${request.match_id}`);

  return request;
}

export async function confirmParticipationAction(requestId: string, hostNote?: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("confirm_match_request", {
    p_request_id: requestId,
    p_host_note: hostNote?.trim() || null,
  });

  if (error) {
    throw error;
  }

  const request = await getRequestRow(requestId);

  revalidatePath("/activity");
  revalidatePath(`/match/${request.match_id}`);

  return request;
}

export async function cancelParticipationConfirmationAction(requestId: string, hostNote?: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("cancel_match_request_confirmation", {
    p_request_id: requestId,
    p_host_note: hostNote?.trim() || null,
  });

  if (error) {
    throw error;
  }

  const request = await getRequestRow(requestId);

  revalidatePath("/activity");
  revalidatePath(`/match/${request.match_id}`);

  return request;
}

export async function rejectParticipationAction(requestId: string, hostNote?: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("reject_match_request", {
    p_request_id: requestId,
    p_host_note: hostNote?.trim() || null,
  });

  if (error) {
    throw error;
  }

  const request = await getRequestRow(requestId);

  revalidatePath("/activity");
  revalidatePath(`/match/${request.match_id}`);

  return request;
}

export async function withdrawParticipationAction(requestId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("withdraw_match_request", {
    p_request_id: requestId,
  });

  if (error) {
    throw error;
  }

  const request = await getRequestRow(requestId);

  revalidatePath("/activity");
  revalidatePath(`/match/${request.match_id}`);

  return request;
}
