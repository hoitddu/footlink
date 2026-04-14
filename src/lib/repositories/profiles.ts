import { cache } from "react";

import { createServerSupabaseClient, getServerAuthUser } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/lib/contact";
import { mapProfileRow } from "@/lib/supabase/mappers";
import type { Profile, UpdateProfileInput } from "@/lib/types";
import { PROFILE_APP_SELECT, type AppProfileRow } from "@/lib/supabase/selects";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function getOrCreateServerAuthUser(supabase: ServerSupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  const normalizedUserError = userError?.message.toLowerCase() ?? "";

  if (userError && !normalizedUserError.includes("auth session missing")) {
    throw userError;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("AUTH_REQUIRED");
  }

  return data.user;
}

export async function getCurrentProfileByAuthUserId(
  supabase: ServerSupabaseClient,
  authUserId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_APP_SELECT)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as unknown as AppProfileRow) : null;
}

export const getCurrentProfile = cache(async () => {
  const user = await getServerAuthUser();

  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  return getCurrentProfileByAuthUserId(supabase, user.id);
});

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  return profile;
}

export async function upsertCurrentProfile(input: UpdateProfileInput) {
  const supabase = await createServerSupabaseClient();
  const user = await getOrCreateServerAuthUser(supabase);
  const now = new Date().toISOString();
  const payload = {
    auth_user_id: user.id,
    nickname: input.nickname.trim(),
    age: input.age,
    preferred_mode: input.preferred_mode ?? null,
    preferred_regions: input.preferred_regions,
    skill_level: input.skill_level,
    open_chat_link: input.open_chat_link?.trim() || null,
    phone_number: normalizePhoneNumber(input.phone_number ?? "") || null,
    default_contact_type: input.default_contact_type ?? null,
    updated_at: now,
    ...(input.preferred_sport !== undefined ? { preferred_sport: input.preferred_sport } : {}),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "auth_user_id" })
    .select(PROFILE_APP_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapProfileRow(data as unknown as AppProfileRow);
}

export async function listProfilesByIds(profileIds: string[]) {
  if (profileIds.length === 0) {
    return [] satisfies Profile[];
  }

  const supabase = await createServerSupabaseClient();
  return listProfilesByIdsWithSupabase(supabase, profileIds);
}

export async function listProfilesByIdsWithSupabase(
  supabase: ServerSupabaseClient,
  profileIds: string[],
) {
  if (profileIds.length === 0) {
    return [] satisfies Profile[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_APP_SELECT)
    .in("id", profileIds)
    .returns<AppProfileRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProfileRow);
}
