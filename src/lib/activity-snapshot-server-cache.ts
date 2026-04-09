import type { DemoAppState } from "@/lib/types";

const CACHE_TTL_MS = 10_000;

type SnapshotCacheEntry = {
  snapshot: DemoAppState;
  cachedAt: number;
};

const snapshotCache = new Map<string, SnapshotCacheEntry>();
const inFlightSnapshots = new Map<string, Promise<DemoAppState>>();

function isFresh(entry: SnapshotCacheEntry | undefined) {
  return Boolean(entry && Date.now() - entry.cachedAt < CACHE_TTL_MS);
}

export function primeActivitySnapshotServerCache(profileId: string, snapshot: DemoAppState) {
  snapshotCache.set(profileId, {
    snapshot,
    cachedAt: Date.now(),
  });

  return snapshot;
}

export function invalidateActivitySnapshotServerCache(profileIds: string | string[]) {
  const ids = Array.isArray(profileIds) ? profileIds : [profileIds];

  ids.forEach((profileId) => {
    snapshotCache.delete(profileId);
    inFlightSnapshots.delete(profileId);
  });
}

export async function getCachedActivitySnapshotServer(
  profileId: string,
  load: () => Promise<DemoAppState>,
) {
  const cached = snapshotCache.get(profileId);

  if (isFresh(cached)) {
    return cached!.snapshot;
  }

  const pending = inFlightSnapshots.get(profileId);

  if (pending) {
    return pending;
  }

  const promise = load()
    .then((snapshot) => primeActivitySnapshotServerCache(profileId, snapshot))
    .finally(() => {
      inFlightSnapshots.delete(profileId);
    });

  inFlightSnapshots.set(profileId, promise);

  return promise;
}
