"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
} from "lucide-react";

import { MatchCard } from "@/components/feed/match-card";
import { Button } from "@/components/ui/button";
import { buildContextQuery } from "@/lib/context";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getFeedMatches } from "@/lib/feed";
import { regions, skillLabels } from "@/lib/mock-data";
import type { EntryMode, FeedContext, FeedPreset, SkillLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  { value: "team:6", mode: "team", label: "6명 이상", groupSize: 6 },
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
    return "날짜 선택";
  }

  if (!selectedDateTo || selectedDateFrom === selectedDateTo) {
    return formatDate(selectedDateFrom);
  }

  return `${formatDate(selectedDateFrom)} - ${formatDate(selectedDateTo)}`;
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

export function FeedScreen({
  initialContext,
  initialReferenceNow,
}: {
  initialContext: FeedContext;
  initialReferenceNow: number;
}) {
  const { state } = useDemoApp();
  const [context, setContext] = useState(initialContext);
  const [referenceNow] = useState(initialReferenceNow);
  const [preset, setPreset] = useState<FeedPreset>("recommended");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date(initialReferenceNow).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(initialReferenceNow).getMonth());
  const [selectedQuickOptionId, setSelectedQuickOptionId] = useState<string | null>(null);

  const feedItems = useMemo(
    () => getFeedMatches(state, context, preset, referenceNow),
    [context, preset, referenceNow, state],
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
    <div className="space-y-4">
      <section className="surface-panel rounded-[1.7rem] p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#112317] text-[#b8ff5a]">
            <MapPin className="h-[17px] w-[17px] stroke-[2.2]" />
          </div>
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#6c776f]">
              SUWON
            </p>
            <p className="font-display text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">
              FOOTLINK
            </p>
          </div>
        </div>
      </section>

      <div className="sticky top-4 z-20 space-y-2.5">
        <section className="surface-panel rounded-[1.45rem] p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-[1rem] bg-white/80 px-3 py-2.5">
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.08em] text-muted">
                지역
              </span>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-transparent pr-5 text-[15px] font-semibold outline-none"
                  value="suwon"
                  disabled
                >
                  {regions.map((region) => (
                    <option key={region.slug} value={region.slug}>
                      {region.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <label className="rounded-[1rem] bg-white/80 px-3 py-2.5">
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.08em] text-muted">
                참여 인원
              </span>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-transparent pr-5 text-[15px] font-semibold outline-none"
                  value={getParticipantValue(context)}
                  onChange={(event) => handleParticipantChange(event.target.value)}
                >
                  {participantOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <label className="rounded-[1rem] bg-white/80 px-3 py-2.5">
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.14em] text-muted">
                SKILL LEVEL
              </span>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-transparent pr-5 text-[15px] font-semibold outline-none"
                  value={context.skillLevel ?? "all"}
                  onChange={(event) => handleSkillChange(event.target.value)}
                >
                  <option value="all">전체</option>
                  {skillLabels.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              </div>
            </label>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="rounded-[1rem] bg-white/80 px-3 py-2.5 text-left transition active:scale-[0.98]"
            >
              <span className="mb-1.5 block text-[10px] font-bold tracking-[0.08em] text-muted">
                날짜
              </span>
              <span className="flex items-center justify-between gap-2 text-[15px] font-semibold text-[#112317]">
                <span className="truncate">{selectedDateLabel}</span>
                <CalendarDays className="h-4 w-4 shrink-0 text-[#5b675f]" />
              </span>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-5 gap-1.5 pb-1">
          {presets.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPreset(item.value)}
              className={cn(
                "min-w-0 whitespace-nowrap rounded-full px-1.5 py-1.5 text-[10px] font-bold tracking-[-0.04em] leading-none transition",
                preset === item.value
                  ? "kinetic-gradient text-white shadow-[0_12px_24px_rgba(6,21,12,0.14)]"
                  : "bg-white/76 text-[#55625a] shadow-[0_10px_24px_rgba(6,21,12,0.04)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {feedItems.length > 0 ? (
        <div className="space-y-3">
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
        <section className="surface-card rounded-[1.75rem] p-5">
          <Button asChild className="w-full" size="lg">
            <Link href="/create">매치 생성</Link>
          </Button>
        </section>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 mx-auto flex max-w-[430px] justify-end px-4">
        <Button asChild className="pointer-events-auto rounded-full px-5" size="lg">
          <Link href="/create">
            <Plus className="mr-2 h-5 w-5" />
            매치 생성
          </Link>
        </Button>
      </div>

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
                      className={`flex min-h-14 items-center justify-center rounded-[1rem] px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-base font-bold tracking-[-0.03em] text-[#112317]">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
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
                    return <div key={`empty-${index}`} className="h-10" />;
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
                        "relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95",
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
                        <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b8ff5a]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-center text-xs font-semibold text-[#647068]">
                {selectedDateLabel}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuickOptionId(null);
                    updateDateRange(undefined, undefined);
                  }}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#eef2ee] text-sm font-bold text-[#112317] transition active:scale-95"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className="kinetic-gradient flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-95"
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
