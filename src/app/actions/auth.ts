"use server";

import { createServerSupabaseClient, getServerAuthUser } from "@/lib/supabase/server";

export async function ensureAnonymousSessionAction() {
  const existingUser = await getServerAuthUser();

  if (existingUser) {
    return existingUser.id;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}
