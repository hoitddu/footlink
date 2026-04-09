"use client";

import type { Profile } from "@/lib/types";
import { getBrowserCurrentProfile } from "@/lib/supabase/browser";

const STORAGE_KEY = "footlink.current-profile.v1";
const EVENT_NAME = "footlink:current-profile";

let cachedCurrentProfile: Profile | null | undefined;
let inflightCurrentProfile: Promise<Profile | null> | null = null;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readStoredCurrentProfile() {
  if (!canUseStorage()) {
    return undefined;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return undefined;
  }

  return (JSON.parse(raw) as Profile | null) ?? null;
}

function writeStoredCurrentProfile(profile: Profile | null) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function broadcastCurrentProfile(profile: Profile | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<Profile | null>(EVENT_NAME, { detail: profile }));
}

export function getCachedCurrentProfile() {
  if (cachedCurrentProfile !== undefined) {
    return cachedCurrentProfile;
  }

  cachedCurrentProfile = readStoredCurrentProfile();
  return cachedCurrentProfile;
}

export function primeCurrentProfile(profile: Profile | null) {
  cachedCurrentProfile = profile;
  writeStoredCurrentProfile(profile);
  broadcastCurrentProfile(profile);
}

export function clearCurrentProfileCache() {
  cachedCurrentProfile = undefined;

  if (canUseStorage()) {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  broadcastCurrentProfile(null);
}

export async function fetchCurrentProfile({ force = false }: { force?: boolean } = {}) {
  const cached = force ? undefined : getCachedCurrentProfile();

  if (!force && cached !== undefined) {
    return cached;
  }

  if (inflightCurrentProfile) {
    return inflightCurrentProfile;
  }

  inflightCurrentProfile = getBrowserCurrentProfile()
    .then((profile) => {
      primeCurrentProfile(profile);
      return profile;
    })
    .finally(() => {
      inflightCurrentProfile = null;
    });

  return inflightCurrentProfile;
}

export function warmCurrentProfile() {
  return fetchCurrentProfile().catch(() => null);
}

export function subscribeCurrentProfile(listener: (profile: Profile | null) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<Profile | null>;
    listener(customEvent.detail ?? null);
  };

  window.addEventListener(EVENT_NAME, handleChange as EventListener);

  return () => {
    window.removeEventListener(EVENT_NAME, handleChange as EventListener);
  };
}
