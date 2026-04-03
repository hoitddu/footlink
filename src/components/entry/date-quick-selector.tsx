"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(a: string, b: string) {
  return a === b;
}

function formatDisplayDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}.${month}.${day}`;
}

interface QuickOption {
  id: string;
  label: string;
  key: string;
}

function getUpcomingWeekday(baseDate: Date, targetDay: number) {
  const date = new Date(baseDate);
  const distance = (targetDay - baseDate.getDay() + 7) % 7;
  date.setDate(baseDate.getDate() + distance);
  return date;
}

function buildQuickOptions(): QuickOption[] {
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

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ day: number; key: string } | null> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ day: d, key: getDateKey(date) });
  }

  return cells;
}

export function DateQuickSelector({
  startDate,
  onSelect,
}: {
  startDate: string | null;
  endDate: string | null;
  onSelect: (start: string, end: string | null) => void;
}) {
  const todayKey = getDateKey(new Date());
  const quickOptions = useMemo(() => buildQuickOptions(), []);
  const [selectionSource, setSelectionSource] = useState<"quick" | "calendar" | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const cells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const customSelected = Boolean(startDate) && selectionSource === "calendar";
  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;

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

  function handleQuickSelect(key: string) {
    setSelectionSource("quick");
    setShowCalendar(false);
    onSelect(key, null);
  }

  function handleCalendarToggle() {
    setShowCalendar((current) => !current);
  }

  function handleCalendarClose() {
    setShowCalendar(false);
  }

  function handleCalendarConfirm() {
    if (!startDate) return;
    setShowCalendar(false);
  }

  function handleDayClick(key: string) {
    if (key < todayKey) return;
    setSelectionSource("calendar");
    onSelect(key, null);
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">
          언제 참여할까요?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          가장 뛰기 쉬운 날부터 골라보세요. 빠른 추천은 위에서, 세부 날짜는 달력에서 선택할 수 있어요.
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="grid flex-1 grid-cols-2 auto-rows-fr gap-2.5">
          {quickOptions.map((option) => {
            const selected =
              selectionSource === "quick" && startDate && isSameDay(startDate, option.key);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleQuickSelect(option.key)}
                className={`flex min-h-24 items-center justify-center rounded-[1.25rem] px-4 py-5 text-center transition active:scale-[0.98] ${
                  selected
                    ? "kinetic-gradient lime-glow text-white"
                    : "surface-card text-[#112317]"
                }`}
              >
                <span className="block text-[1.55rem] font-bold tracking-[-0.04em]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCalendarToggle}
          className={`mt-2.5 flex min-h-16 w-full items-center justify-center rounded-[1.25rem] px-4 py-4 text-center transition active:scale-[0.98] ${
            showCalendar || customSelected ? "bg-white shadow-[0_18px_40px_rgba(6,21,12,0.08)]" : "surface-card"
          }`}
        >
          <span className="flex items-center gap-2.5 text-[1.15rem] font-bold tracking-[-0.02em] text-[#112317]">
            <CalendarDays className="h-5 w-5" />
            날짜 선택
          </span>
        </button>
      </div>

      {showCalendar && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="달력 닫기"
            onClick={handleCalendarClose}
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
                {cells.map((cell, index) => {
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
                      onClick={() => handleDayClick(cell.key)}
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
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b8ff5a]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 text-center text-xs font-semibold text-[#647068]">
                {startDate ? formatDisplayDate(startDate) : "날짜를 선택해 주세요"}
              </div>

              <button
                type="button"
                onClick={handleCalendarConfirm}
                disabled={!startDate}
                className="kinetic-gradient mt-4 flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:bg-[#d8ddd9] disabled:text-white/80"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
