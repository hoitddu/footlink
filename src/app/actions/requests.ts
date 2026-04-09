"use server";

import { revalidatePath } from "next/cache";

import { createAppError, isAppError, toUserFacingError } from "@/lib/errors";
import { requireCurrentProfile } from "@/lib/repositories/profiles";
import { markNotificationsRead } from "@/lib/repositories/requests";
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

async function runMatchLifecycleMaintenance() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("close_expired_matches");

  if (error) {
    throw error;
  }

  return supabase;
}

export async function submitParticipationAction(input: SubmitParticipationInput) {
  try {
    const currentProfile = await requireCurrentProfile();
    const supabase = await runMatchLifecycleMaintenance();
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
      throw createAppError("OWN_MATCH_REQUEST_FORBIDDEN");
    }

    if (match.status !== "open" || match.remaining_slots <= 0) {
      throw createAppError("MATCH_CLOSED");
    }

    if (new Date(match.start_at).getTime() <= Date.now()) {
      throw createAppError("MATCH_CLOSED");
    }

    if (input.requestedCount > match.remaining_slots) {
      throw createAppError("REQUEST_COUNT_EXCEEDS_REMAINING");
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "참가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function acceptParticipationAction(requestId: string, hostNote?: string) {
  try {
    const supabase = await runMatchLifecycleMaintenance();
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "요청을 수락하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function confirmParticipationAction(requestId: string, hostNote?: string) {
  try {
    const supabase = await runMatchLifecycleMaintenance();
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "최종 확정을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function cancelParticipationConfirmationAction(requestId: string, hostNote?: string) {
  try {
    const supabase = await runMatchLifecycleMaintenance();
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "확정 취소를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function rejectParticipationAction(requestId: string, hostNote?: string) {
  try {
    const supabase = await runMatchLifecycleMaintenance();
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "요청을 거절하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function withdrawParticipationAction(requestId: string) {
  try {
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
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "요청을 취소하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function markNotificationsReadAction(notificationIds: string[]) {
  try {
    await markNotificationsRead(notificationIds);

    revalidatePath("/home");
    revalidatePath("/notifications");
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "알림 읽음 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
