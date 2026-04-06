"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

import { getAppDataSource } from "@/lib/app-config";
import { mapMatchRequestRow, mapProfileRow } from "@/lib/supabase/mappers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";
import {
  MATCH_REQUEST_PERSONALIZATION_SELECT,
  PROFILE_APP_SELECT,
  type ActivityMatchRequestRow,
  type AppProfileRow,
} from "@/lib/supabase/selects";

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

export async function getBrowserCurrentProfile() {
  if (getAppDataSource() !== "supabase") {
    return null;
  }

  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (userError && !userError.message.toLowerCase().includes("auth session missing")) {
      throw userError;
    }

    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_APP_SELECT)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as unknown as AppProfileRow) : null;
}

export async function getBrowserMatchPersonalization(matchId: string) {
  const currentProfile = await getBrowserCurrentProfile();

  if (!currentProfile) {
    return {
      currentProfile: null,
      myRequest: null,
    };
  }

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("match_requests")
    .select(MATCH_REQUEST_PERSONALIZATION_SELECT)
    .eq("match_id", matchId)
    .eq("requester_profile_id", currentProfile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    currentProfile,
    myRequest: data ? mapMatchRequestRow(data as unknown as ActivityMatchRequestRow) : null,
  };
}
