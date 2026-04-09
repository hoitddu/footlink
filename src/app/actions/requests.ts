"use server";

import { revalidatePath } from "next/cache";

import { invalidateActivitySnapshotServerCache } from "@/lib/activity-snapshot-server-cache";
import { createAppError, isAppError, toUserFacingError } from "@/lib/errors";
import { ensureMatchLifecycleMaintenance } from "@/lib/repositories/lifecycle";
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
    .select("id, match_id, requester_profile_id, host_profile_id")
    .eq("id", requestId)
    .single();

  if (error) {
    throw error;
  }

  return data as unknown as RequestPathRow & {
    requester_profile_id: string;
    host_profile_id: string;
  };
}

async function runMatchLifecycleMaintenance() {
  await ensureMatchLifecycleMaintenance();
  return createServerSupabaseClient();
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
    invalidateActivitySnapshotServerCache([currentProfile.id, match.creator_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${input.matchId}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "筌〓㈇? ?遺욧퍕??筌ｌ꼶???? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
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
      if (error.message === "INSUFFICIENT_REMAINING_SLOTS") {
        throw createAppError("INSUFFICIENT_REMAINING_SLOTS");
      }

      if (error.message === "MATCH_NOT_OPEN") {
        throw createAppError("MATCH_CLOSED");
      }

      throw error;
    }

    const request = await getRequestRow(requestId);
    invalidateActivitySnapshotServerCache([request.requester_profile_id, request.host_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${request.match_id}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "?遺욧퍕????롮뵭??? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
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
      if (error.message === "INSUFFICIENT_REMAINING_SLOTS") {
        throw createAppError("INSUFFICIENT_REMAINING_SLOTS");
      }

      if (error.message === "MATCH_NOT_OPEN") {
        throw createAppError("MATCH_CLOSED");
      }

      throw error;
    }

    const request = await getRequestRow(requestId);
    invalidateActivitySnapshotServerCache([request.requester_profile_id, request.host_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${request.match_id}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "筌ㅼ뮇伊??類ㅼ젟??筌ｌ꼶???? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
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
    invalidateActivitySnapshotServerCache([request.requester_profile_id, request.host_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${request.match_id}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "?類ㅼ젟 ?띯뫁?쇘몴?筌ｌ꼶???? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
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
    invalidateActivitySnapshotServerCache([request.requester_profile_id, request.host_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${request.match_id}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "?遺욧퍕??椰꾧퀣???? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
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
    invalidateActivitySnapshotServerCache([request.requester_profile_id, request.host_profile_id]);

    revalidatePath("/activity");
    revalidatePath(`/match/${request.match_id}`);

    return request;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "?遺욧퍕???띯뫁???? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
  }
}

export async function dismissParticipationRequestAction(requestId: string) {
  try {
    const currentProfile = await requireCurrentProfile();
    const supabase = await createServerSupabaseClient();
    const { data: request, error: requestError } = await supabase
      .from("match_requests")
      .select("id, match_id, requester_profile_id, status")
      .eq("id", requestId)
      .returns<{ id: string; match_id: string; requester_profile_id: string; status: string }[]>()
      .single();

    if (requestError) {
      throw requestError;
    }

    if (request.requester_profile_id !== currentProfile.id) {
      throw new Error("?遺욧퍕?癒?춸 筌〓챷肉??遺욧퍕 疫꿸퀡以???????????됰뮸??덈뼄.");
    }

    if (!["rejected", "withdrawn", "expired"].includes(request.status)) {
      throw new Error("??? 筌욊쑵六?餓λ쵐???遺욧퍕?? ?????????곷뮸??덈뼄.");
    }

    const { error: dismissError } = await supabase.from("request_activity_dismissals").upsert(
      {
        profile_id: currentProfile.id,
        request_id: request.id,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,request_id" },
    );

    if (dismissError) {
      throw dismissError;
    }

    invalidateActivitySnapshotServerCache(currentProfile.id);
    revalidatePath("/activity");

    return request.id;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "筌〓챷肉??遺욧퍕 疫꿸퀡以???????? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
  }
}

export async function markNotificationsReadAction(notificationIds: string[]) {
  try {
    await markNotificationsRead(notificationIds);

    revalidatePath("/notifications");
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "???뵝 ??뚯벉 ?怨밴묶?????館釉?쭪? 筌륁궢六??щ빍?? ?醫롫뻻 ????쇰뻻 ??뺣즲??雅뚯눘苑??");
  }
}
