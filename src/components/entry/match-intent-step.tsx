"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

const QUICK_PLAYER_COUNTS = [1, 2, 3, 4, 5, 6];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}.${month}.${day}`;
}

function isSameDay(a: string, b: string) {
  return a === b;
}

function getUpcomingWeekday(baseDate: Date, targetDay: number) {
  const date = new Date(baseDate);
  const distance = (targetDay - baseDate.getDay() + 7) % 7;
  date.setDate(baseDate.getDate() + distance);
  return date;
}

function buildQuickOptions() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const saturday = getUpcomingWeekday(today, 6);
  const sunday = getUpcomingWeekday(today, 0);

  return [
    { id: "today", label: "오늘", key: getDateKey(today) },
    { id: "tomorrow", label: "내일", key: getDateKey(tomorrow) },
    { id: "saturday", label: "토요일", key: getDateKey(saturday) },
    { id: "sunday", label: "일요일", key: getDateKey(sunday) },
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

function getPlayerCountHint(playerCount: number) {
  if (playerCount === 1) {
    return "용병으로 바로 합류할 수 있는 매치를 보여드려요.";
  }

  if (playerCount >= 5) {
    return "팀 단위로 바로 맞붙을 수 있는 매치를 우선 보여드려요.";
  }

  return "함께 들어갈 수 있는 소규모 합류 매치를 먼저 보여드려요.";
}

export function MatchIntentStep({
  playerCount,
  onPlayerCountChange,
  startDate,
  onDateChange,
}: {
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  startDate: string | null;
  onDateChange: (date: string) => void;
}) {
  const todayKey = getDateKey(new Date());
  const quickOptions = useMemo(() => buildQuickOptions(), []);
  const quickOptionKeys = useMemo(() => new Set(quickOptions.map((option) => option.key)), [quickOptions]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const calendarDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewMonth, viewYear]);
  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const hasCustomDate = Boolean(startDate && !quickOptionKeys.has(startDate));

  function decrement() {
    onPlayerCountChange(Math.max(1, playerCount - 1));
  }

  function increment() {
    onPlayerCountChange(Math.min(20, playerCount + 1));
  }

  function handleQuickDateSelect(dateKey: string) {
    setShowCalendar(false);
    onDateChange(dateKey);
  }

  function handleCalendarDayClick(dateKey: string) {
    if (dateKey < todayKey) {
      return;
    }

    onDateChange(dateKey);
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
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">몇 명이서 언제 뛸까요?</h1>
        <p className="mt-2 text-sm leading-6 text-muted">이번에 보고 싶은 매치 조건만 빠르게 정하면 돼요.</p>
      </div>

      <div className="space-y-4 pb-4">
        <section className="surface-card rounded-[2rem] px-5 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">Players</p>
              <h2 className="mt-1 text-[1.4rem] font-bold tracking-[-0.04em] text-[#112317]">몇 명이서 갈까요?</h2>
            </div>
            <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[11px] font-bold text-[#516056]">
              {playerCount}명
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={decrement}
              disabled={playerCount <= 1}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317] transition active:scale-95 disabled:opacity-35"
            >
              <Minus className="h-5 w-5" strokeWidth={2.4} />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <div className="font-display tabular-nums text-[4.8rem] font-bold leading-none tracking-[-0.08em] text-[#112317]">
                {playerCount}
              </div>
              <p className="mt-2 text-sm font-semibold text-[#66736a]">{getPlayerCountHint(playerCount)}</p>
            </div>

            <button
              type="button"
              onClick={increment}
              className="kinetic-gradient lime-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {QUICK_PLAYER_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onPlayerCountChange(count)}
                className={`rounded-[1rem] px-3 py-3 text-sm font-bold transition active:scale-95 ${
                  playerCount === count ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#55625a]"
                }`}
              >
                {count}명
              </button>
            ))}
          </div>
        </section>

        <section className="surface-card rounded-[2rem] px-5 py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">Date</p>
              <h2 className="mt-1 text-[1.4rem] font-bold tracking-[-0.04em] text-[#112317]">언제 참여할까요?</h2>
            </div>
            <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[11px] font-bold text-[#516056]">
              {startDate ? formatDisplayDate(startDate) : "날짜 선택"}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {quickOptions.map((option) => {
              const selected = startDate ? isSameDay(startDate, option.key) : false;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleQuickDateSelect(option.key)}
                  className={`flex min-h-16 items-center justify-center rounded-[1.15rem] px-4 py-4 text-center transition active:scale-[0.98] ${
                    selected ? "kinetic-gradient lime-glow text-white" : "bg-[#eef2ee] text-[#112317]"
                  }`}
                >
                  <span className="text-[1rem] font-bold tracking-[-0.03em]">{option.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className={`mt-3 flex min-h-14 w-full items-center justify-between rounded-[1.15rem] px-4 py-4 text-left transition active:scale-[0.98] ${
              showCalendar || hasCustomDate ? "bg-white shadow-[0_18px_40px_rgba(6,21,12,0.08)]" : "bg-[#eef2ee]"
            }`}
          >
            <span className="flex items-center gap-2.5 text-sm font-bold text-[#112317]">
              <CalendarDays className="h-4.5 w-4.5" />
              날짜 직접 선택
            </span>
            <span className="text-sm font-semibold text-[#66736a]">
              {hasCustomDate && startDate ? formatDisplayDate(startDate) : "캘린더 열기"}
            </span>
          </button>
        </section>

        <Link
          href="/create"
          className="mx-auto inline-block border-b-2 border-[#b8ff5a]/50 pb-0.5 text-sm font-bold text-[#39443d] transition hover:text-[#112317]"
        >
          직접 매치 만들기
        </Link>
      </div>

      {showCalendar ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="달력 닫기"
            onClick={() => setShowCalendar(false)}
            className="absolute inset-0 bg-[#09110c]/48 backdrop-blur-[3px]"
          />

          <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[430px] -translate-y-1/2 px-5">
            <div className="rounded-[1.6rem] bg-white p-4 shadow-[0_28px_64px_rgba(6,21,12,0.22)]">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-base font-bold tracking-[-0.03em] text-[#112317]">{monthLabel}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ee] text-[#455149] transition active:scale-95"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((weekday, index) => (
                  <span
                    key={weekday}
                    className={`text-center text-[11px] font-bold ${
                      index === 0 ? "text-[#ff6c62]" : index === 6 ? "text-[#5a8dff]" : "text-[#7b867f]"
                    }`}
                  >
                    {weekday}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }

                  const isPast = cell.key < todayKey;
                  const isSelected = startDate ? isSameDay(cell.key, startDate) : false;
                  const isToday = isSameDay(cell.key, todayKey);
                  const dayOfWeek = index % 7;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleCalendarDayClick(cell.key)}
                      className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95 ${
                        isPast
                          ? "text-[#c8cec9]"
                          : isSelected
                            ? "kinetic-gradient lime-glow text-white"
                            : isToday
                              ? "bg-[#eef2ee] font-bold text-[#112317]"
                              : dayOfWeek === 0
                                ? "text-[#ff6c62] hover:bg-[#f5f6f4]"
                                : dayOfWeek === 6
                                  ? "text-[#5a8dff] hover:bg-[#f5f6f4]"
                                  : "text-[#4c584f] hover:bg-[#f5f6f4]"
                      }`}
                    >
                      {cell.day}
                      {isToday && !isSelected ? (
                        <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b8ff5a]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-center text-xs font-semibold text-[#647068]">
                {startDate ? formatDisplayDate(startDate) : "날짜를 선택해 주세요"}
              </div>

              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                disabled={!startDate}
                className="kinetic-gradient mt-4 flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:bg-[#d8ddd9] disabled:text-white/80"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
