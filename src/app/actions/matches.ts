"use server";

import { revalidatePath } from "next/cache";

import { createAppError, isAppError, toUserFacingError } from "@/lib/errors";
import { normalizeContactValue } from "@/lib/contact";
import { requireCurrentProfile } from "@/lib/repositories/profiles";
import { mapMatchRow } from "@/lib/supabase/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MATCH_CREATE_RETURN_SELECT,
  type CreateMatchReturnRow,
} from "@/lib/supabase/selects";
import type { CreateMatchInput } from "@/lib/types";
import { isPastKoreaDateTime } from "@/lib/utils";

export async function createMatchAction(input: CreateMatchInput) {
  try {
    const currentProfile = await requireCurrentProfile();

    if (isPastKoreaDateTime(input.start_at)) {
      throw createAppError("MATCH_START_IN_PAST");
    }

    const normalizedContactValue = normalizeContactValue(input.contact_type, input.contact_link);

    if (!normalizedContactValue) {
      throw createAppError("CONTACT_LINK_REQUIRED");
    }

    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();
    const payload = {
      ...input,
      creator_profile_id: currentProfile.id,
      contact_link: normalizedContactValue,
      note: input.note.trim() || null,
      status: "open" as const,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("matches")
      .insert(payload)
      .select(MATCH_CREATE_RETURN_SELECT)
      .single();

    if (error) {
      throw error;
    }

    const match = mapMatchRow(data as unknown as CreateMatchReturnRow);

    revalidatePath("/home");
    revalidatePath("/create");
    revalidatePath("/activity");
    revalidatePath(`/match/${match.id}`);

    return match;
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "매치를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

export async function cancelMatchAction(matchId: string) {
  try {
    await requireCurrentProfile();
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("cancel_host_match", {
      p_match_id: matchId,
    });

    if (error) {
      if (error.message === "MATCH_DELETE_HAS_ACCEPTED_REQUESTS") {
        throw createAppError("MATCH_DELETE_HAS_ACCEPTED_REQUESTS");
      }

      throw error;
    }

    revalidatePath("/home");
    revalidatePath("/activity");
    revalidatePath(`/match/${matchId}`);

    return { id: matchId };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }

    throw toUserFacingError(error, "모집을 마감하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
