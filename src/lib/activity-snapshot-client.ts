"use client";

import type { DemoAppState } from "@/lib/types";

const STORAGE_KEY = "footlink:activity-snapshot";
const DEFAULT_MAX_AGE_MS = 15_000;

type SnapshotEnvelope = {
  snapshot: DemoAppState;
  cachedAt: number;
};

let memoryEnvelope: SnapshotEnvelope | null = null;
let inFlightSnapshotPromise: Promise<DemoAppState> | null = null;

function isFresh(envelope: SnapshotEnvelope | null, maxAgeMs: number) {
  return Boolean(envelope && Date.now() - envelope.cachedAt <= maxAgeMs);
}

function readPersistedEnvelope() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SnapshotEnvelope;

    if (!parsed?.snapshot || typeof parsed.cachedAt !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistEnvelope(envelope: SnapshotEnvelope) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Best-effort cache only.
  }
}

function writeEnvelope(snapshot: DemoAppState) {
  const envelope = {
    snapshot,
    cachedAt: Date.now(),
  };

  memoryEnvelope = envelope;
  persistEnvelope(envelope);

  return snapshot;
}

export function getCachedActivitySnapshot(maxAgeMs = DEFAULT_MAX_AGE_MS) {
  if (isFresh(memoryEnvelope, maxAgeMs)) {
    return memoryEnvelope?.snapshot ?? null;
  }

  const persisted = readPersistedEnvelope();

  if (isFresh(persisted, maxAgeMs)) {
    memoryEnvelope = persisted;
    return persisted?.snapshot ?? null;
  }

  return null;
}

export async function fetchActivitySnapshot({
  force = false,
}: {
  force?: boolean;
} = {}) {
  if (!force) {
    const cached = getCachedActivitySnapshot();

    if (cached) {
      return cached;
    }
  }

  if (!force && inFlightSnapshotPromise) {
    return inFlightSnapshotPromise;
  }

  const request = fetch(`/api/activity-snapshot${force ? "?force=1" : ""}`, {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("ACTIVITY_SNAPSHOT_FAILED");
      }

      const snapshot = (await response.json()) as DemoAppState;
      return writeEnvelope(snapshot);
    });

  if (force) {
    return request;
  }

  inFlightSnapshotPromise = request.finally(() => {
    inFlightSnapshotPromise = null;
  });

  return inFlightSnapshotPromise;
}

export async function warmActivitySnapshot(maxAgeMs = DEFAULT_MAX_AGE_MS) {
  const cached = getCachedActivitySnapshot(maxAgeMs);

  if (cached) {
    return cached;
  }

  return fetchActivitySnapshot();
}

export function primeActivitySnapshot(snapshot: DemoAppState) {
  return writeEnvelope(snapshot);
}
