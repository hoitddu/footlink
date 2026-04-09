import { createMatches, createParticipationRequests, profiles, regions } from "@/lib/mock-data";
import type { DemoAppState, DemoNotification, Profile } from "@/lib/types";

const VALID_MATCH_POSITIONS = new Set(["attack", "midfielder", "defense", "goalkeeper"]);

export const DEMO_STORAGE_KEY = "footlink-demo-state-v1";
export const DEFAULT_DEMO_PROFILE_ID = "profile-minho";

export function createDemoSeed(referenceNow?: number): DemoAppState {
  return {
    currentProfileId: DEFAULT_DEMO_PROFILE_ID,
    matches: createMatches(referenceNow).map((match) => ({ ...match })),
    participationRequests: createParticipationRequests(referenceNow).map((request) => ({ ...request })),
    notifications: [],
    profiles: profiles.map((profile) => ({ ...profile, preferred_regions: [...profile.preferred_regions] })),
    regions: regions.map((region) => ({ ...region })),
  };
}

function normalizeProfile(profile: unknown, fallback: Profile): Profile {
  if (!profile || typeof profile !== "object") {
    return { ...fallback, preferred_regions: [...fallback.preferred_regions] };
  }

  const candidate = profile as Partial<Profile> & { age?: unknown };
  const resolvedAge =
    typeof candidate.age === "number" && Number.isFinite(candidate.age)
      ? Math.max(0, Math.trunc(candidate.age))
      : fallback.age;

  return {
    ...fallback,
    ...candidate,
    age: resolvedAge,
    preferred_regions: Array.isArray(candidate.preferred_regions)
      ? [...candidate.preferred_regions]
      : [...fallback.preferred_regions],
  };
}

function normalizeNotification(notification: unknown): DemoNotification | null {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const candidate = notification as Partial<DemoNotification>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.profile_id !== "string" ||
    typeof candidate.kind !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.body !== "string" ||
    typeof candidate.href !== "string" ||
    typeof candidate.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    profile_id: candidate.profile_id,
    kind: candidate.kind as DemoNotification["kind"],
    title: candidate.title,
    body: candidate.body,
    href: candidate.href,
    created_at: candidate.created_at,
    related_match_id: candidate.related_match_id,
    related_request_id: candidate.related_request_id,
    read_at: candidate.read_at,
  };
}

export function normalizeDemoState(candidate: DemoAppState): DemoAppState {
  const seed = createDemoSeed();

  const normalizedMatches = Array.isArray(candidate.matches)
    ? candidate.matches.map((match) => {
        const sportType = match.sport_type ?? "futsal";

        return {
          ...match,
          sport_type: sportType,
          duration_minutes:
            typeof match.duration_minutes === "number" && Number.isFinite(match.duration_minutes)
              ? Math.max(30, Math.trunc(match.duration_minutes))
              : 120,
          futsal_format:
            sportType === "futsal" ? (match.futsal_format ?? "5vs5") : null,
          position_targets: Array.isArray(match.position_targets)
            ? match.position_targets.filter(
                (position): position is (typeof match.position_targets)[number] =>
                  typeof position === "string" && VALID_MATCH_POSITIONS.has(position),
              )
            : [],
        };
      })
    : seed.matches;

  return {
    currentProfileId: seed.profiles.some((profile) => profile.id === candidate.currentProfileId)
      ? candidate.currentProfileId
      : seed.currentProfileId,
    matches: normalizedMatches,
    participationRequests: Array.isArray(candidate.participationRequests)
      ? candidate.participationRequests.map((request) => ({ ...request }))
      : seed.participationRequests,
    notifications: Array.isArray(candidate.notifications)
      ? candidate.notifications
          .map((notification) => normalizeNotification(notification))
          .filter((notification): notification is DemoNotification => notification !== null)
      : seed.notifications,
    profiles: seed.profiles.map((seedProfile) =>
      normalizeProfile(candidate.profiles.find((profile) => profile.id === seedProfile.id), seedProfile),
    ),
    regions: Array.isArray(candidate.regions) ? candidate.regions.map((region) => ({ ...region })) : seed.regions,
  };
}
