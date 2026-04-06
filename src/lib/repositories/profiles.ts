import { cache } from "react";

import { createServerSupabaseClient, getServerAuthUser } from "@/lib/supabase/server";
import { mapProfileRow } from "@/lib/supabase/mappers";
import type { Profile, UpdateProfileInput } from "@/lib/types";
import { PROFILE_APP_SELECT, type AppProfileRow } from "@/lib/supabase/selects";

export const getCurrentProfile = cache(async () => {
  const user = await getServerAuthUser();

  if (!user) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_APP_SELECT)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as unknown as AppProfileRow) : null;
});

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  return profile;
}

export async function upsertCurrentProfile(input: UpdateProfileInput) {
  const user = await getServerAuthUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const payload = {
    auth_user_id: user.id,
    nickname: input.nickname.trim(),
    age: input.age,
    preferred_mode: input.preferred_mode ?? null,
    preferred_regions: input.preferred_regions,
    skill_level: input.skill_level,
    open_chat_link: input.open_chat_link?.trim() || null,
    updated_at: now,
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
