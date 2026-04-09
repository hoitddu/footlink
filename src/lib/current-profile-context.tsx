"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Profile } from "@/lib/types";

const CurrentProfileContext = createContext<Profile | null>(null);

export function CurrentProfileProvider({
  value,
  children,
}: {
  value: Profile | null;
  children: ReactNode;
}) {
  return <CurrentProfileContext.Provider value={value}>{children}</CurrentProfileContext.Provider>;
}

/**
 * Client-side hook for reading the profile that the app-shell layout fetched
 * once per request. Lets client components access the viewer without a
 * round-trip to Supabase.
 */
export function useCurrentProfile() {
  return useContext(CurrentProfileContext);
}
