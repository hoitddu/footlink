"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentProfile } from "@/lib/repositories/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SubmitParticipationInput } from "@/lib/types";
import {
  MATCH_REQUEST_PATH_SELECT,
  MATCH_REQUEST_VALIDATION_SELECT,
  type MatchRequestValidationRow,
  type RequestPathRow,
} from "@/lib/supabase/selects";

async function getRequestRow(requestId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_PATH_SELECT)
    .eq("id", requestId)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as RequestPathRow;
}

export async function submitParticipationAction(input: SubmitParticipationInput) {
  const currentProfile = await requireCurrentProfile();
  const supabase = await createServerSupabaseClient();
  const { data: matchRow, error: matchError } = await supabase
    .from("matches")
    .select(MATCH_REQUEST_VALIDATION_SELECT)
    .eq("id", input.matchId)
    .single();

  if (matchError) {
    throw matchError;
  }

  const match = matchRow as unknown as MatchRequestValidationRow;

  if (match.creator_profile_id === currentProfile.id) {
    throw new Error("?닿? 留뚮뱺 留ㅼ튂?먮뒗 李멸? ?붿껌??蹂대궪 ???놁뒿?덈떎.");
  }

  if (match.status !== "open" || match.remaining_slots <= 0) {
    throw new Error("?대? 留덇컧??留ㅼ튂?낅땲??");
  }

  if (input.requestedCount > match.remaining_slots) {
    throw new Error("?⑥? ?먮━蹂대떎 留롮? ?몄썝???붿껌?????놁뒿?덈떎.");
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
    .select(MATCH_REQUEST_PATH_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const request = data as unknown as RequestPathRow;

  revalidatePath("/home");
  revalidatePath("/activity");
  revalidatePath(`/match/${input.matchId}`);

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
