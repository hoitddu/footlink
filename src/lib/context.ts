import { REGION_OPTIONS, getRegionLabel } from "@/lib/constants";
import type { FeedContext, FeedSort, FeedSportFilter, FeedTimeWindow } from "@/lib/types";

function parseNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value?: string) {
  return value === "1" || value === "true";
}

function normalizeWindow(value?: string): FeedTimeWindow {
  if (value === "all" || value === "now" || value === "today" || value === "tomorrow" || value === "weekend") {
    return value;
  }

  return "all";
}

function normalizeSport(value?: string): FeedSportFilter {
  if (value === "all" || value === "soccer" || value === "futsal") {
    return value;
  }

  return "futsal";
}

function normalizeSort(value?: string): FeedSort {
  if (
    value === "recommended" ||
    value === "time" ||
    value === "distance" ||
    value === "fee" ||
    value === "closing"
  ) {
    return value;
  }

  if (value === "urgent") {
    return "recommended";
  }

  return "recommended";
}

export function parseFeedContext(searchParams: Record<string, string | undefined>) {
  const regionSlug = searchParams.region ?? "suwon";
  const regionLabel = getRegionLabel(regionSlug);
  const lat = parseNumber(searchParams.lat);
  const lng = parseNumber(searchParams.lng);

  const context: FeedContext = {
    sport: normalizeSport(searchParams.sport),
    window: normalizeWindow(searchParams.window),
    radiusKm: parseNumber(searchParams.radiusKm),
    onlyLastSpot: parseBoolean(searchParams.onlyLastSpot),
    sort: normalizeSort(searchParams.sort),
    regionSlug,
    regionLabel,
    lat,
    lng,
    mode: (searchParams.mode as FeedContext["mode"]) ?? "solo",
    groupSize: parseNumber(searchParams.groupSize) ?? 1,
    skillLevel: searchParams.skill as FeedContext["skillLevel"],
    selectedDateFrom: searchParams.dateFrom ?? searchParams.date,
    selectedDateTo: searchParams.dateTo ?? searchParams.dateFrom ?? searchParams.date,
    selectedDateLabel: searchParams.dateLabel,
  };

  if (!context.regionSlug) {
    context.regionSlug = REGION_OPTIONS[0].slug;
    context.regionLabel = REGION_OPTIONS[0].label;
  }

  return context;
}

export function buildContextQuery(context: FeedContext) {
  const params = new URLSearchParams({
    sport: context.sport,
    sort: context.sort,
  });

  if (context.regionSlug) {
    params.set("region", context.regionSlug);
  }

  if (context.selectedDateFrom) {
    params.set("date", context.selectedDateFrom);
  }

  if (typeof context.lat === "number" && typeof context.lng === "number") {
    params.set("lat", context.lat.toFixed(6));
    params.set("lng", context.lng.toFixed(6));
  }

  return params.toString();
}
