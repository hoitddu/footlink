import type { FeedTimeWindow, RegionOption, SkillLevel, SportType } from "@/lib/types";

export const AGE_BANDS = [
  { value: 10, label: "10대" },
  { value: 20, label: "20대" },
  { value: 30, label: "30대" },
  { value: 40, label: "40대" },
  { value: 50, label: "50대+" },
] as const;

export const REGION_OPTIONS: RegionOption[] = [
  { slug: "suwon", label: "수원", area: "gyeonggi", lat: 37.2636, lng: 127.0286 },
];

export const SPORT_OPTIONS: Array<{ value: SportType; label: string }> = [
  { value: "futsal", label: "풋살" },
  { value: "soccer", label: "축구" },
];

export const SPORT_LABELS: Record<SportType, string> = {
  futsal: "풋살",
  soccer: "축구",
};

export const TIME_WINDOW_OPTIONS: Array<{ value: FeedTimeWindow; label: string }> = [
  { value: "now", label: "지금" },
  { value: "today", label: "오늘" },
  { value: "tomorrow", label: "내일" },
  { value: "weekend", label: "주말" },
];

export const TIME_WINDOW_LABELS: Record<FeedTimeWindow, string> = {
  now: "지금",
  today: "오늘",
  tomorrow: "내일",
  weekend: "주말",
};

export const RADIUS_OPTIONS = [
  { value: 3, label: "3km" },
  { value: 5, label: "5km" },
  { value: 999, label: "수원 전체" },
] as const;

export const SKILL_LEVELS: SkillLevel[] = ["beginner", "low", "mid", "high"];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: "입문",
  low: "초급",
  mid: "중급",
  high: "상급",
};

export function getSportLabel(sport: SportType) {
  return SPORT_LABELS[sport];
}

export function getTimeWindowLabel(window: FeedTimeWindow) {
  return TIME_WINDOW_LABELS[window];
}

export function getSkillLevelLabel(level: SkillLevel) {
  return SKILL_LEVEL_LABELS[level];
}

export function getAgeBandLabel(age: number) {
  if (age >= 50) return "50대+";
  if (age >= 40) return "40대";
  if (age >= 30) return "30대";
  if (age >= 20) return "20대";
  return "10대";
}

export function getRegionLabel(regionSlug: string) {
  return REGION_OPTIONS.find((region) => region.slug === regionSlug)?.label ?? "수원";
}
