"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { getAppDataSource } from "@/lib/app-config";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
  }

  return browserClient;
}

export async function ensureAnonymousSession() {
  if (getAppDataSource() !== "supabase") {
    return null;
  }

  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  if (userError && !userError.message.toLowerCase().includes("auth session missing")) {
    throw userError;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.user as User | null;
}
