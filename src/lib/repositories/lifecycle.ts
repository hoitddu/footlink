import { createServerSupabaseClient } from "@/lib/supabase/server";

// Module-level throttle: close_expired_matches is a housekeeping RPC
// that doesn't need to run on every request. We cap it to at most
// one execution per THROTTLE_MS across the whole Node process.
const THROTTLE_MS = 60_000;
let lastRunAt = 0;
let inflight: Promise<void> | null = null;

async function runCloseExpiredMatches() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("close_expired_matches");

  if (error) {
    throw error;
  }
}

/**
 * Awaits the lifecycle RPC when it's truly due (e.g. inside mutations that
 * must observe up-to-date match state). Returns immediately if another
 * call recently completed.
 */
export async function ensureMatchLifecycleMaintenance() {
  const now = Date.now();

  if (now - lastRunAt < THROTTLE_MS) {
    return;
  }

  if (inflight) {
    return inflight;
  }

  inflight = runCloseExpiredMatches()
    .then(() => {
      lastRunAt = Date.now();
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Fire-and-forget variant used on GET paths (page snapshots). Never blocks
 * the rendering request, and is throttled so navigation stays instant.
 */
export function scheduleMatchLifecycleMaintenance() {
  const now = Date.now();

  if (now - lastRunAt < THROTTLE_MS || inflight) {
    return;
  }

  // Mark optimistically so concurrent renders skip re-scheduling.
  lastRunAt = now;
  inflight = runCloseExpiredMatches()
    .catch((error) => {
      // Roll back timestamp on failure so it'll retry next request.
      lastRunAt = 0;
      console.error("close_expired_matches failed", error);
    })
    .finally(() => {
      inflight = null;
    });
}
