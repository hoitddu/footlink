import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type EnvMap = Record<string, string>;

type HostSession = {
  access_token: string;
  refresh_token: string;
};

type HostProfile = {
  id: string;
  nickname: string;
};

const CONTACT_SHARE_LABEL = /^\uC5F0\uB77D \uACF5\uC720$/;
const CONFIRM_SLOT_LABEL = /^\uC790\uB9AC \uD655\uC815$/;
const ONE_SLOT_LABEL = /^1\uC790\uB9AC$/;
const CLOSED_LABEL = /^\uBAA8\uC9D1 \uB9C8\uAC10$/;

function loadEnvFile(filePath: string) {
  const env: EnvMap = {};
  const raw = fs.readFileSync(filePath, "utf8");

  raw.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith("#")) {
      return;
    }

    const separator = line.indexOf("=");

    if (separator === -1) {
      return;
    }

    env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  });

  return env;
}

const env = loadEnvFile(path.join(process.cwd(), ".env.local"));
const APP_URL = process.env.FOOTLINK_E2E_BASE_URL ?? "http://127.0.0.1:3100";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(".env.local is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function decodeSessionCookie(value: string): HostSession {
  const encoded = value.replace(/^base64-/, "");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HostSession;
}

function createNodeSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function seedRequester(label: string, stamp: number) {
  const client = createNodeSupabaseClient();
  const { data: authData, error: authError } = await client.auth.signInAnonymously();

  if (authError || !authData.user) {
    throw authError ?? new Error("Anonymous requester sign-in failed");
  }

  const now = new Date().toISOString();
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .upsert(
      {
        auth_user_id: authData.user.id,
        nickname: `e2e-${label}-${stamp}`,
        age: 20,
        preferred_mode: "solo",
        preferred_sport: "futsal",
        preferred_regions: ["Suwon"],
        skill_level: "mid",
        open_chat_link: null,
        phone_number: null,
        default_contact_type: "openchat",
        updated_at: now,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id, nickname")
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("Requester profile upsert failed");
  }

  return {
    client,
    profile: {
      id: profile.id as string,
      nickname: profile.nickname as string,
    },
  };
}

async function listRequestStatuses(client: SupabaseClient, matchId: string) {
  const { data, error } = await client
    .from("match_requests")
    .select("id, status")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function cleanupMatch(client: SupabaseClient, matchId: string) {
  const existing = await listRequestStatuses(client, matchId);

  for (const request of existing.filter((item) => item.status === "confirmed")) {
    const { error } = await client.rpc("cancel_match_request_confirmation", {
      p_request_id: request.id,
      p_host_note: "e2e cleanup",
    });

    if (error) {
      throw error;
    }
  }

  const afterConfirmRollback = await listRequestStatuses(client, matchId);

  for (const request of afterConfirmRollback.filter((item) => item.status === "accepted")) {
    const { error } = await client.rpc("reject_match_request", {
      p_request_id: request.id,
      p_host_note: "e2e cleanup",
    });

    if (error) {
      throw error;
    }
  }

  const { error: cancelError } = await client.rpc("cancel_host_match", {
    p_match_id: matchId,
  });

  if (cancelError) {
    throw cancelError;
  }
}

test("host can accept and confirm two 2-slot requests in sequence", async ({
  context,
  page,
}) => {
  const stamp = Date.now();
  let hostClient: SupabaseClient | null = null;
  let matchId: string | null = null;
  const matchTitle = `E2E accept-2 ${stamp}`;

  try {
    await page.goto(`${APP_URL}/profile`, { waitUntil: "networkidle" });
    await page.locator("input").first().fill(`e2e-host-${stamp}`);
    await page.locator("button").last().click();
    await page.waitForURL(/flash=saved/);

    const cookies = await context.cookies(APP_URL);
    const sessionCookie = cookies.find((cookie) => cookie.name.includes("auth-token"));

    expect(sessionCookie).toBeTruthy();

    const session = decodeSessionCookie(sessionCookie!.value);
    const hostProfile = (await page.evaluate(() =>
      JSON.parse(window.sessionStorage.getItem("footlink.current-profile.v1") ?? "null"),
    )) as HostProfile | null;

    expect(hostProfile?.id).toBeTruthy();

    hostClient = createNodeSupabaseClient();

    const { error: sessionError } = await hostClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    expect(sessionError).toBeNull();

    const { data: match, error: matchError } = await hostClient
      .from("matches")
      .insert({
        creator_profile_id: hostProfile!.id,
        mode: "solo",
        listing_type: "mercenary",
        sport_type: "futsal",
        futsal_format: "5vs5",
        position_targets: [],
        title: matchTitle,
        region_slug: "suwon",
        address: "Suwon Test Venue 1111-1",
        lat: 37.2636,
        lng: 127.0286,
        start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 120,
        fee: 10000,
        total_slots: 2,
        remaining_slots: 2,
        min_group_size: 1,
        max_group_size: 1,
        skill_level: "mid",
        contact_type: "openchat",
        contact_link: "https://open.kakao.com/o/e2e-host",
        note: "e2e flow",
        status: "open",
      })
      .select("id")
      .single();

    expect(matchError).toBeNull();
    expect(match?.id).toBeTruthy();

    matchId = match!.id as string;

    const requester1 = await seedRequester("req1", stamp);
    const requester2 = await seedRequester("req2", stamp);
    const now = new Date().toISOString();

    const { error: request1Error } = await requester1.client.from("match_requests").insert({
      match_id: matchId,
      requester_profile_id: requester1.profile.id,
      host_profile_id: hostProfile!.id,
      requested_count: 1,
      message: "e2e request 1",
      entry_channel: "openchat",
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    expect(request1Error).toBeNull();

    const { error: request2Error } = await requester2.client.from("match_requests").insert({
      match_id: matchId,
      requester_profile_id: requester2.profile.id,
      host_profile_id: hostProfile!.id,
      requested_count: 1,
      message: "e2e request 2",
      entry_channel: "openchat",
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    expect(request2Error).toBeNull();

    // The server keeps a short-lived activity snapshot cache per profile.
    await page.waitForTimeout(11_000);

    const activityPage = await context.newPage();
    await activityPage.goto(`${APP_URL}/activity?tab=listings&highlight=${matchId}`, {
      waitUntil: "networkidle",
    });

    const hostCard = activityPage.locator("article").filter({ hasText: matchTitle });
    await expect(hostCard).toHaveCount(1);

    const contactButtons = hostCard.locator("button").filter({ hasText: CONTACT_SHARE_LABEL });
    await expect(contactButtons).toHaveCount(2);

    await contactButtons.first().click();
    await expect(hostCard.locator("button").filter({ hasText: CONTACT_SHARE_LABEL })).toHaveCount(1);
    await expect(hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL })).toHaveCount(1);

    await hostCard.locator("button").filter({ hasText: CONTACT_SHARE_LABEL }).first().click();
    await expect(hostCard.locator("button").filter({ hasText: CONTACT_SHARE_LABEL })).toHaveCount(0);
    await expect(hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL })).toHaveCount(2);

    await expect
      .poll(
        async () => (await listRequestStatuses(hostClient, matchId)).map((item) => item.status),
        { timeout: 10_000 },
      )
      .toEqual(["accepted", "accepted"]);

    await hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL }).first().click();
    await expect(hostCard.getByText(ONE_SLOT_LABEL)).toBeVisible();
    await expect(hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL })).toHaveCount(1);

    await hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL }).first().click();
    await expect(hostCard.getByText(CLOSED_LABEL)).toBeVisible();
    await expect(hostCard.locator("button").filter({ hasText: CONFIRM_SLOT_LABEL })).toHaveCount(0);

    await expect
      .poll(
        async () => (await listRequestStatuses(hostClient, matchId)).map((item) => item.status),
        { timeout: 10_000 },
      )
      .toEqual(["confirmed", "confirmed"]);

    await expect
      .poll(
        async () => {
          const { data, error } = await hostClient
            .from("matches")
            .select("remaining_slots, status")
            .eq("id", matchId)
            .single();

          if (error) {
            throw error;
          }

          return data;
        },
        { timeout: 10_000 },
      )
      .toEqual({
        remaining_slots: 0,
        status: "matched",
      });
  } finally {
    if (hostClient && matchId) {
      try {
        await cleanupMatch(hostClient, matchId);
      } catch (error) {
        console.error("cleanup failed", error);
      }
    }
  }
});
