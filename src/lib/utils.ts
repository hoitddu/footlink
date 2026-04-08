import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { getAgeBandLabel, getSkillLevelLabel, getSportLabel } from "@/lib/constants";
import type { SkillLevel, SportType } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFee(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `도보 ${Math.max(1, Math.round(distanceKm * 12))}분`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

export function formatDistanceValue(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.max(1, Math.round(distanceKm * 1000))}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

export type TravelMode = "walk" | "transit" | "car";

export type TravelEstimate = {
  mode: TravelMode;
  label: string;
  minutes: number;
};

function estimateWalkMinutes(distanceKm: number) {
  return Math.max(1, Math.round(distanceKm * 12));
}

function estimateTransitMinutes(distanceKm: number) {
  return Math.max(8, Math.round(distanceKm * 4.5 + 6));
}

function estimateCarMinutes(distanceKm: number) {
  return Math.max(1, Math.round(distanceKm * 2.4 + 1));
}

export function getTravelEstimates(distanceKm: number): TravelEstimate[] {
  const walkMinutes = estimateWalkMinutes(distanceKm);
  const estimates: TravelEstimate[] = [];

  if (walkMinutes <= 30) {
    estimates.push({
      mode: "walk",
      label: `도보 ${walkMinutes}분`,
      minutes: walkMinutes,
    });
  }

  const transitMinutes = estimateTransitMinutes(distanceKm);
  estimates.push({
    mode: "transit",
    label: `대중교통 ${transitMinutes}분`,
    minutes: transitMinutes,
  });

  const carMinutes = estimateCarMinutes(distanceKm);
  estimates.push({
    mode: "car",
    label: `차량 ${carMinutes}분`,
    minutes: carMinutes,
  });

  return estimates;
}

export function formatStartAt(date: string) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(date));

  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${month}월 ${day}일 ${hour}:${minute}`;
}

export function formatTimeOnly(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function formatSkillLevel(level: SkillLevel) {
  return getSkillLevelLabel(level);
}

export function formatSportType(sport: SportType) {
  return getSportLabel(sport);
}

export function formatAgeBand(age: number) {
  return getAgeBandLabel(age);
}

export function formatRelativeStart(minutesUntilStart: number) {
  if (minutesUntilStart <= 0) {
    return "곧 시작";
  }

  if (minutesUntilStart < 60) {
    return `${minutesUntilStart}분 후`;
  }

  const hours = Math.floor(minutesUntilStart / 60);
  const minutes = minutesUntilStart % 60;

  if (minutes === 0) {
    return `${hours}시간 후`;
  }

  return `${hours}시간 ${minutes}분 후`;
}

export function formatUrgencyLabel(date: string, minutesUntilStart: number) {
  if (minutesUntilStart <= 60) {
    return `${Math.max(1, minutesUntilStart)}분 후 시작`;
  }

  if (minutesUntilStart <= 120) {
    return `${Math.round(minutesUntilStart / 60)}시간 내 시작`;
  }

  const target = new Date(date);
  const now = new Date();
  const sameDay = target.toDateString() === now.toDateString();

  if (sameDay) {
    return `오늘 ${formatTimeOnly(date)}`;
  }

  return formatStartAt(date);
}

export function haversineDistance(
  sourceLat: number,
  sourceLng: number,
  targetLat: number,
  targetLng: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latDelta = toRadians(targetLat - sourceLat);
  const lngDelta = toRadians(targetLng - sourceLng);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(sourceLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}
