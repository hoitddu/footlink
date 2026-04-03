import { getFeedMatches, getMatchById } from "@/lib/feed";
import { matches, participationRequests, profiles, regions } from "@/lib/mock-data";
import type { FeedContext, FeedPreset } from "@/lib/types";

const defaultSource = {
  matches,
  participationRequests,
  profiles,
  regions,
};

export async function listMatchesForFeed(
  context: FeedContext,
  preset: FeedPreset,
  referenceNow?: number,
) {
  return getFeedMatches(defaultSource, context, preset, referenceNow);
}

export async function getMatchDetail(id: string, referenceNow?: number) {
  return getMatchById(defaultSource, id, referenceNow);
}
