import { REGION_OPTIONS } from "@/lib/constants";
import type { EntryMode, FeedContext, SkillLevel } from "@/lib/types";

function parseNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(date));
}

function formatSelectedDateRange(selectedDateFrom?: string, selectedDateTo?: string) {
  if (!selectedDateFrom) {
    return "오늘";
  }

  if (!selectedDateTo || selectedDateFrom === selectedDateTo) {
    return formatDate(selectedDateFrom);
  }

  return `${formatDate(selectedDateFrom)} - ${formatDate(selectedDateTo)}`;
}

export function parseFeedContext(searchParams: Record<string, string | undefined>) {
  const mode = (searchParams.mode as EntryMode | undefined) ?? "solo";
  const groupSize =
    parseNumber(searchParams.groupSize) ?? (mode === "small_group" ? 2 : mode === "team" ? 5 : 1);
  const regionSlug = searchParams.region ?? "suwon";
  const selectedDateFrom = searchParams.dateFrom ?? searchParams.date;
  const selectedDateTo = searchParams.dateTo ?? searchParams.dateFrom ?? searchParams.date;
  const skillLevel = searchParams.skill as SkillLevel | undefined;
  const lat = parseNumber(searchParams.lat);
  const lng = parseNumber(searchParams.lng);
  const fallbackRegion =
    REGION_OPTIONS.find((region) => region.slug === regionSlug) ?? REGION_OPTIONS[0];

  const context: FeedContext = {
    mode,
    groupSize,
    regionSlug,
    regionLabel: fallbackRegion.label,
    selectedDateFrom,
    selectedDateTo,
    selectedDateLabel: formatSelectedDateRange(selectedDateFrom, selectedDateTo),
    skillLevel,
    lat,
    lng,
  };

  return context;
}

export function buildContextQuery(context: FeedContext) {
  const params = new URLSearchParams({
    mode: context.mode,
    groupSize: String(context.groupSize),
  });

  if (context.regionSlug) {
    params.set("region", context.regionSlug);
  }

  if (context.selectedDateFrom) {
    params.set("dateFrom", context.selectedDateFrom);
  }

  if (context.selectedDateTo) {
    params.set("dateTo", context.selectedDateTo);
  }

  if (context.skillLevel) {
    params.set("skill", context.skillLevel);
  }

  if (typeof context.lat === "number" && typeof context.lng === "number") {
    params.set("lat", context.lat.toFixed(6));
    params.set("lng", context.lng.toFixed(6));
  }

  return params.toString();
}
