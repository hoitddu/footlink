"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Profile } from "@/lib/types";
import {
  fetchCurrentProfile,
  getCachedCurrentProfile,
  primeCurrentProfile,
  subscribeCurrentProfile,
} from "@/lib/current-profile-client";

type CurrentProfileContextValue = {
  profile: Profile | null;
  ready: boolean;
  refresh: (options?: { force?: boolean }) => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
};

const CurrentProfileContext = createContext<CurrentProfileContextValue>({
  profile: null,
  ready: false,
  refresh: async () => null,
  setProfile: () => {},
});

export function CurrentProfileProvider({
  value,
  children,
}: {
  value?: Profile | null;
  children: ReactNode;
}) {
  const cachedProfile = value !== undefined ? value : getCachedCurrentProfile();
  const [profile, setProfileState] = useState<Profile | null>(cachedProfile ?? null);
  const [ready, setReady] = useState(value !== undefined || cachedProfile !== undefined);

  useEffect(() => {
    const unsubscribe = subscribeCurrentProfile((nextProfile) => {
      setProfileState(nextProfile);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (ready) {
      return;
    }

    let cancelled = false;

    void fetchCurrentProfile()
      .then((nextProfile) => {
        if (cancelled) {
          return;
        }

        setProfileState(nextProfile);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setProfileState(null);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  const contextValue = useMemo<CurrentProfileContextValue>(
    () => ({
      profile,
      ready,
      refresh: async (options) => {
        const nextProfile = await fetchCurrentProfile({ force: options?.force });
        setProfileState(nextProfile);
        setReady(true);
        return nextProfile;
      },
      setProfile: (nextProfile) => {
        primeCurrentProfile(nextProfile);
        setProfileState(nextProfile);
        setReady(true);
      },
    }),
    [profile, ready],
  );

  return (
    <CurrentProfileContext.Provider value={contextValue}>
      {children}
    </CurrentProfileContext.Provider>
  );
}

/**
 * Client-side hook for reading the profile that the app-shell layout fetched
 * once per request. Lets client components access the viewer without a
 * round-trip to Supabase.
 */
export function useCurrentProfile() {
  return useContext(CurrentProfileContext).profile;
}

export function useCurrentProfileState() {
  return useContext(CurrentProfileContext);
}
