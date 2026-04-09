"use client";

import { useEffect } from "react";

import { warmActivitySnapshot } from "@/lib/activity-snapshot-client";
import { useCurrentProfileState } from "@/lib/current-profile-context";

export function ActivitySnapshotPrefetch() {
  const { profile, ready } = useCurrentProfileState();

  useEffect(() => {
    if (!ready || !profile) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const run = () => {
      if (cancelled) {
        return;
      }

      void warmActivitySnapshot().catch(() => {
        // Best-effort warmup only.
      });
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(run, 900);
    }

    return () => {
      cancelled = true;

      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [profile, ready]);

  return null;
}
