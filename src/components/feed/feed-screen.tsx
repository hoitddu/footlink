"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BellDot,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MatchCard } from "@/components/feed/match-card";
import { BrandHeader } from "@/components/app/brand-header";
import { Button } from "@/components/ui/button";
import { buildContextQuery } from "@/lib/context";
import { REGION_OPTIONS, SKILL_LEVELS, getSkillLevelLabel } from "@/lib/constants";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getUnreadNotificationCount } from "@/lib/demo-state/selectors";
import { getFeedMatches } from "@/lib/feed";
import { isProfileComplete } from "@/lib/profiles";
import type { EntryMode, FeedContext, FeedDataSource, FeedPreset, Profile, SkillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ProfileCompletionSheet = dynamic(
  () =>
    import("@/components/profile/profile-completion-sheet").then(
      (module) => module.ProfileCompletionSheet,
    ),
  { loading: () => null, ssr: false },
);

const presets: Array<{ value: FeedPreset; label: string }> = [
  { value: "recommended", label: "추천" },
  { value: "urgent", label: "마감임박" },
  { value: "price", label: "가격" },
  { value: "time", label: "시간" },
  { value: "distance", label: "거리" },
];

const participantOptions: Array<{
  value: string;
  mode: EntryMode;
  label: string;
  groupSize: number;
}> = [
  { value: "solo:1", mode: "solo", label: "1명", groupSize: 1 },
  { value: "small_group:2", mode: "small_group", label: "2명", groupSize: 2 },
  { value: "small_group:3", mode: "small_group", label: "3명", groupSize: 3 },
  { value: "small_group:4", mode: "small_group", label: "4명", groupSize: 4 },
  { value: "team:5", mode: "team", label: "5명", groupSize: 5 },
  { value: "team:6", mode: "team", label: "6명+", groupSize: 6 },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getParticipantValue(context: FeedContext) {
  if (context.mode === "team") {
    return context.groupSize >= 6 ? "team:6" : "team:5";
  }

  if (context.mode === "small_group") {
    const normalizedSize = Math.min(Math.max(context.groupSize, 2), 4);
    return `small_group:${normalizedSize}`;
  }

  return "solo:1";
}

function getParticipantLabel(context: FeedContext) {
  const value = getParticipantValue(context);
  return participantOptions.find((o) => o.value === value)?.label ?? "1명";
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return `${parsed.getMonth() + 1}.${parsed.getDate()}`;
}

function formatSelectedDateRange(selectedDateFrom?: string, selectedDateTo?: string) {
  if (!selectedDateFrom) {
    return "";
  }

  if (!selectedDateTo || selectedDateFrom === selectedDateTo) {
    return formatDate(selectedDateFrom);
  }

  return `${formatDate(selectedDateFrom)}-${formatDate(selectedDateTo)}`;
}

function getUpcomingWeekday(baseDate: Date, targetDay: number) {
  const date = new Date(baseDate);
  const distance = (targetDay - baseDate.getDay() + 7) % 7;
  date.setDate(baseDate.getDate() + distance);
  return date;
}

function buildQuickOptions(today: Date) {
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const saturday = getUpcomingWeekday(today, 6);
  const sunday = getUpcomingWeekday(today, 0);

  return [
    { id: "today", label: "오늘", from: getDateKey(today), to: getDateKey(today) },
    { id: "tomorrow", label: "내일", from: getDateKey(tomorrow), to: getDateKey(tomorrow) },
    { id: "saturday", label: "토요일", from: getDateKey(saturday), to: getDateKey(saturday) },
    { id: "sunday", label: "일요일", from: getDateKey(sunday), to: getDateKey(sunday) },
  ];
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; key: string } | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ day, key: getDateKey(date) });
  }

  return cells;
}

function normalizeRange(dateA: string, dateB?: string) {
  if (!dateB || dateA <= dateB) {
    return { from: dateA, to: dateB ?? dateA };
  }

  return { from: dateB, to: dateA };
}

function FeedScreenView({
  initialContext,
  initialReferenceNow,
  source,
  currentProfile,
  hydrateCurrentProfile = false,
  notificationCount = 0,
}: {
  initialContext: FeedContext;
  initialReferenceNow: number;
  source: FeedDataSource;
  currentProfile?: Profile | null;
  hydrateCurrentProfile?: boolean;
  notificationCount?: number;
}) {
  const router = useRouter();
  const [context, setContext] = useState(initialContext);
  const [referenceNow] = useState(initialReferenceNow);
  const [preset, setPreset] = useState<FeedPreset>("recommended");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profilePromptDismissed, setProfilePromptDismissed] = useState(false);
  const [resolvedProfile, setResolvedProfile] = useState(currentProfile ?? null);
  const [profileReady, setProfileReady] = useState(!hydrateCurrentProfile);
  const [viewYear, setViewYear] = useState(() => new Date(initialReferenceNow).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(initialReferenceNow).getMonth());
  const [selectedQuickOptionId, setSelectedQuickOptionId] = useState<string | null>(null);

  const feedItems = useMemo(
    () => getFeedMatches(source, context, preset, referenceNow),
    [context, preset, referenceNow, source],
  );
  const contextQuery = buildContextQuery(context);
  const quickOptions = useMemo(() => buildQuickOptions(new Date(referenceNow)), [referenceNow]);
  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );
  const todayKey = useMemo(() => getDateKey(new Date(referenceNow)), [referenceNow]);
  const selectedDateLabel = formatSelectedDateRange(context.selectedDateFrom, context.selectedDateTo);
  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const rangeStart = context.selectedDateFrom;
  const rangeEnd = context.selectedDateTo;
  const shouldShowProfilePrompt = profileReady && !isProfileComplete(resolvedProfile) && !profilePromptDismissed;

  useEffect(() => {
    if (!hydrateCurrentProfile) {
      setResolvedProfile(currentProfile ?? null);
      setProfileReady(true);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void import("@/lib/supabase/browser")
        .then(({ getBrowserCurrentProfile }) => getBrowserCurrentProfile())
        .then((profile) => {
          if (!cancelled) {
            setResolvedProfile(profile);
          }
        })
        .catch(() => {
          // Keep the feed interactive even if profile bootstrap fails.
        })
        .finally(() => {
          if (!cancelled) {
            setProfileReady(true);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentProfile, hydrateCurrentProfile]);

  useEffect(() => {
    router.prefetch("/create");
    router.prefetch("/activity");
    router.prefetch("/notifications");
    router.prefetch("/profile");

    feedItems.slice(0, 4).forEach((match) => {
      router.prefetch(`/match/${match.id}?${contextQuery}`);
    });
  }, [contextQuery, feedItems, router]);

  const filterSummary = [
    "수원",
    getParticipantLabel(context),
    context.skillLevel ? getSkillLevelLabel(context.skillLevel) : "전체",
    selectedDateLabel || "전체",
  ].join(" · ");

  function updateDateRange(from?: string, to?: string) {
    setContext((current) => ({
      ...current,
      selectedDateFrom: from,
      selectedDateTo: to,
      selectedDateLabel: formatSelectedDateRange(from, to),
    }));
  }

  function handleParticipantChange(value: string) {
    const selected = participantOptions.find((option) => option.value === value);

    if (!selected) {
      return;
    }

    setContext((current) => ({
      ...current,
      mode: selected.mode,
      groupSize: selected.groupSize,
      regionSlug: "suwon",
      regionLabel: "수원",
    }));
  }

  function handleSkillChange(value: string) {
    setContext((current) => ({
      ...current,
      skillLevel: value === "all" ? undefined : (value as SkillLevel),
    }));
  }

  function handleQuickRangeSelect(from: string, to: string) {
    const matchedQuickOption = quickOptions.find((option) => option.from === from && option.to === to);
    setSelectedQuickOptionId(matchedQuickOption?.id ?? null);
    updateDateRange(from, to);
  }

  function handleDateSelect(dateKey: string) {
    setSelectedQuickOptionId(null);

    if (!rangeStart || rangeEnd) {
      updateDateRange(dateKey, undefined);
      return;
    }

    const normalized = normalizeRange(rangeStart, dateKey);
    updateDateRange(normalized.from, normalized.to);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
      return;
    }

    setViewMonth((month) => month - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
      return;
    }

    setViewMonth((month) => month + 1);
  }

  return (
    <div className="space-y-2">
      {/* Header: brand + notification inbox */}
      <BrandHeader
        left={
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#112317] text-[#b8ff5a]">
              <MapPin className="h-3.5 w-3.5 stroke-[2.2]" />
            </div>
            <span className="font-display text-[15px] font-bold tracking-[-0.03em] text-[#112317]">
              FOOTLINK
            </span>
          </Link>
        }
        right={
          <Link
            href="/notifications"
            aria-label="알림함 열기"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white text-[#112317] shadow-[0_10px_24px_rgba(6,21,12,0.12),0_1px_0_rgba(255,255,255,0.9)_inset] transition active:scale-95"
          >
            <BellDot className="h-[1.15rem] w-[1.15rem] text-[#112317] opacity-100 [stroke-width:2.3]" />
            {notificationCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full border-2 border-[#f6f8f6] bg-[#d94b3d] px-1 text-[9px] font-bold leading-none text-white shadow-[0_6px_12px_rgba(217,75,61,0.32)]">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </Link>
        }
      />

      {/* Sticky: filter summary bar + sort chips */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pb-1.5 pt-1 bg-[#f6f8f6]">
        {/* Filter summary bar */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-[1rem] bg-white/90 px-3.5 py-2.5 shadow-[0_2px_8px_rgba(6,21,12,0.06)] transition active:scale-[0.99]"
        >
          <span className="truncate text-[13px] font-semibold text-[#112317]">
            {filterSummary}
          </span>
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-[#88948c]" />
        </button>

        {/* Sort chips */}
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
          {presets.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPreset(item.value)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold leading-none transition",
                preset === item.value
                  ? "bg-[#112317] text-white"
                  : "bg-white/80 text-[#55625a]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {shouldShowProfilePrompt ? (
        <section className="surface-card rounded-[1.25rem] px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#112317] text-[#b8ff5a]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#112317]">
                프로필 10초만 설정하면 바로 참가 요청할 수 있어요
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#5f6c64]">
                닉네임, 연령대, 실력만 입력하면 됩니다. 오픈채팅 링크는 매치 생성할 때만 필요해요.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" size="sm" type="button" onClick={() => setProfileSheetOpen(true)}>
              지금 설정
            </Button>
            <Button
              className="flex-1"
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setProfilePromptDismissed(true)}
            >
              나중에
            </Button>
          </div>
        </section>
      ) : null}

      {/* Match list */}
      {feedItems.length > 0 ? (
        <div className="space-y-2">
          {feedItems.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              detailHref={`/match/${match.id}?${contextQuery}`}
              selectedGroupSize={context.groupSize}
            />
          ))}
        </div>
      ) : (
        <section className="surface-card rounded-[1.25rem] p-5 text-center">
          <p className="mb-3 text-sm text-[#88948c]">조건에 맞는 경기가 없습니다</p>
          <Button asChild className="w-full" size="sm">
            <Link href="/create">매치 생성하기</Link>
          </Button>
        </section>
      )}

      {/* Filter bottom sheet */}
      {isFilterOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="필터 닫기"
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-[#09110c]/48 backdrop-blur-[3px]"
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px]">
            <div className="rounded-t-[1.6rem] bg-white p-5 shadow-[0_-16px_48px_rgba(6,21,12,0.18)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[1.1rem] font-bold text-[#112317]">필터</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Region */}
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6c776f]">
                    지역
                  </span>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-[1rem] bg-[#eef2ee] px-4 py-3 pr-8 text-[14px] font-semibold outline-none"
                      value="suwon"
                      disabled
                    >
                      {REGION_OPTIONS.map((region) => (
                        <option key={region.slug} value={region.slug}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#88948c]" />
                  </div>
                </label>

                {/* Participants */}
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6c776f]">
                    참여 인원
                  </span>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-[1rem] bg-[#eef2ee] px-4 py-3 pr-8 text-[14px] font-semibold outline-none"
                      value={getParticipantValue(context)}
                      onChange={(event) => handleParticipantChange(event.target.value)}
                    >
                      {participantOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#88948c]" />
                  </div>
                </label>

                {/* Skill */}
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6c776f]">
                    Skill Level
                  </span>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-[1rem] bg-[#eef2ee] px-4 py-3 pr-8 text-[14px] font-semibold outline-none"
                      value={context.skillLevel ?? "all"}
                      onChange={(event) => handleSkillChange(event.target.value)}
                    >
                      <option value="all">전체</option>
                      {SKILL_LEVELS.map((skill) => (
                        <option key={skill} value={skill}>
                          {getSkillLevelLabel(skill)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#88948c]" />
                  </div>
                </label>

                {/* Date */}
                <div>
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6c776f]">
                    날짜
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsFilterOpen(false); setIsCalendarOpen(true); }}
                    className="flex w-full items-center justify-between rounded-[1rem] bg-[#eef2ee] px-4 py-3 text-[14px] font-semibold text-[#112317] transition active:scale-[0.99]"
                  >
                    <span>{selectedDateLabel || "전체 날짜"}</span>
                    <CalendarDays className="h-4 w-4 text-[#88948c]" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="kinetic-gradient mt-5 flex h-12 w-full items-center justify-center rounded-[1rem] text-sm font-bold text-white transition active:scale-[0.98]"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Calendar modal */}
      {isCalendarOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="달력 닫기"
            onClick={() => setIsCalendarOpen(false)}
            className="absolute inset-0 bg-[#09110c]/48 backdrop-blur-[3px]"
          />

          <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[430px] -translate-y-1/2 px-5">
            <div className="rounded-[1.6rem] bg-white p-4 shadow-[0_28px_64px_rgba(6,21,12,0.22)]">
              <div className="grid grid-cols-2 gap-2.5">
                {quickOptions.map((option) => {
                  const selected = selectedQuickOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleQuickRangeSelect(option.from, option.to)}
                      className={`flex min-h-12 items-center justify-center rounded-[1rem] px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                        selected
                          ? "kinetic-gradient text-white"
                          : "bg-[#eef2ee] text-[#112317]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold tracking-[-0.03em] text-[#112317]">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((weekday, index) => (
                  <span
                    key={weekday}
                    className={cn(
                      "text-center text-[11px] font-bold",
                      index === 0
                        ? "text-[#ff6c62]"
                        : index === 6
                          ? "text-[#5a8dff]"
                          : "text-[#7b867f]",
                    )}
                  >
                    {weekday}
                  </span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="h-9" />;
                  }

                  const isPast = cell.key < todayKey;
                  const isSelectedStart = cell.key === rangeStart;
                  const isSelectedEnd = cell.key === rangeEnd;
                  const isInRange =
                    !!rangeStart && !!rangeEnd && cell.key >= rangeStart && cell.key <= rangeEnd;
                  const isToday = cell.key === todayKey;
                  const dayOfWeek = index % 7;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateSelect(cell.key)}
                      className={cn(
                        "relative flex h-9 items-center justify-center rounded-lg text-[13px] font-semibold transition active:scale-95",
                        isPast
                          ? "text-[#c8cec9]"
                          : isSelectedStart || isSelectedEnd
                            ? "kinetic-gradient text-white"
                            : isInRange
                              ? "bg-[#dff1d9] text-[#112317]"
                              : isToday
                                ? "border border-[#b8ff5a] bg-white font-bold text-[#112317]"
                                : dayOfWeek === 0
                                  ? "text-[#ff6c62] hover:bg-[#f5f6f4]"
                                  : dayOfWeek === 6
                                    ? "text-[#5a8dff] hover:bg-[#f5f6f4]"
                                    : "text-[#4c584f] hover:bg-[#f5f6f4]",
                      )}
                    >
                      {cell.day}
                      {isToday && !isSelectedStart && !isSelectedEnd ? (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b8ff5a]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-center text-xs font-semibold text-[#647068]">
                {selectedDateLabel || "날짜를 선택하세요"}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuickOptionId(null);
                    updateDateRange(undefined, undefined);
                  }}
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-[#eef2ee] text-sm font-bold text-[#112317] transition active:scale-95"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="kinetic-gradient flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-95"
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProfileCompletionSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profile={resolvedProfile}
        preferredMode={context.mode}
        regionLabel={context.regionLabel}
        refreshOnComplete
        onCompleted={(profile) => {
          setResolvedProfile(profile);
          setProfilePromptDismissed(true);
        }}
      />
    </div>
  );
}

function DemoFeedScreen(props: {
  initialContext: FeedContext;
  initialReferenceNow: number;
  currentProfile?: Profile | null;
}) {
  const { state } = useDemoApp();

  return (
    <FeedScreenView
      {...props}
      source={state}
      hydrateCurrentProfile={false}
      notificationCount={getUnreadNotificationCount(state)}
    />
  );
}

export function FeedScreen({
  source,
  currentProfile,
  hydrateCurrentProfile = false,
  notificationCount,
  ...props
}: {
  initialContext: FeedContext;
  initialReferenceNow: number;
  source?: FeedDataSource;
  currentProfile?: Profile | null;
  hydrateCurrentProfile?: boolean;
  notificationCount?: number;
}) {
  if (source) {
    return (
      <FeedScreenView
        {...props}
        source={source}
        currentProfile={currentProfile}
        hydrateCurrentProfile={hydrateCurrentProfile}
        notificationCount={notificationCount}
      />
    );
  }

  return <DemoFeedScreen {...props} currentProfile={currentProfile} />;
}
