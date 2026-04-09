"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronRight, Clock3, MapPin, MessageCircleMore, Phone } from "lucide-react";
import { useRouter } from "next/navigation";

import { ensureAnonymousSessionAction } from "@/app/actions/auth";
import { createMatchAction } from "@/app/actions/matches";
import type { PlaceSearchResult } from "@/components/create/kakao-place-picker";
import { KakaoPlacePicker } from "@/components/create/kakao-place-picker";
import { ScreenHeader } from "@/components/app/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AppDataSource } from "@/lib/app-config";
import {
  DIRECT_CONTACT_OPTIONS,
  getContactFieldLabel,
  getContactFieldPlaceholder,
  getProfileContactValue,
  getProfileDefaultContactType,
  normalizePhoneNumber,
} from "@/lib/contact";
import { getMatchPositionLabel, getMatchPositionOptions, SPORT_OPTIONS } from "@/lib/constants";
import { getUserFacingErrorMessage, requiresProfileSetup } from "@/lib/errors";
import { useDemoApp } from "@/lib/demo-state/provider";
import { formatMatchFormatLabel } from "@/lib/match-format";
import { isProfileComplete } from "@/lib/profiles";
import { formatDurationMinutes, formatTimeRange, haversineDistance, isPastKoreaDateTime } from "@/lib/utils";
import type {
  CreateMatchInput,
  DirectContactType,
  FutsalFormatOption,
  MatchPosition,
  Profile,
  SportType,
} from "@/lib/types";

const ProfileCompletionSheet = dynamic(
  () =>
    import("@/components/profile/profile-completion-sheet").then(
      (module) => module.ProfileCompletionSheet,
    ),
  { loading: () => null, ssr: false },
);

const SUWON_CENTER = { lat: 37.2636, lng: 127.0286 };
const QUICK_DURATION_OPTIONS = [60, 120, 180] as const;
const DURATION_HOUR_OPTIONS = [0, 1, 2, 3, 4, 5] as const;
const DURATION_MINUTE_OPTIONS = [0, 30] as const;
const FUTSAL_FORMAT_OPTIONS: FutsalFormatOption[] = ["4vs4", "5vs5", "6vs6"];
const WHEEL_ITEM_HEIGHT = 44;
const DEFAULT_START_BUFFER_MINUTES = 30;

function formatLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLocalTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getDefaultSchedule() {
  const next = new Date(Date.now() + DEFAULT_START_BUFFER_MINUTES * 60 * 1000);
  const roundedMinutes = Math.ceil(next.getMinutes() / 30) * 30;
  next.setMinutes(roundedMinutes, 0, 0);

  return {
    date: formatLocalDateInputValue(next),
    time: formatLocalTimeInputValue(next),
  };
}

function getMinimumSelectableDate() {
  return formatLocalDateInputValue(new Date());
}

function getMinimumSelectableTime(selectedDate: string) {
  const today = getMinimumSelectableDate();

  if (selectedDate !== today) {
    return undefined;
  }

  return formatLocalTimeInputValue(new Date(Date.now() + 60 * 1000));
}

function isPlaceInSuwon(place: PlaceSearchResult) {
  if (place.address.includes("수원")) {
    return true;
  }

  return haversineDistance(SUWON_CENTER.lat, SUWON_CENTER.lng, place.lat, place.lng) <= 18;
}

function splitDuration(durationMinutes: number) {
  return {
    hours: Math.floor(durationMinutes / 60),
    minutes: durationMinutes % 60,
  };
}

function snapDurationMinutes(minutes: number) {
  if (DURATION_MINUTE_OPTIONS.includes(minutes as (typeof DURATION_MINUTE_OPTIONS)[number])) {
    return minutes;
  }

  return DURATION_MINUTE_OPTIONS.reduce((closest, option) =>
    Math.abs(option - minutes) < Math.abs(closest - minutes) ? option : closest,
  );
}

function formatFeeLabel(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDisplayDate(value: string) {
  return value || "날짜 선택";
}

function formatDisplayTime(value: string) {
  if (!value) {
    return "시간 선택";
  }

  const [hour, minute] = value.split(":").map((part) => Number(part));

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function StepperField({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 pl-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d786f]">
        {label}
      </p>
      <div className="rounded-[1.1rem] bg-[#f4f7f3] px-3.5 py-2.5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5">
          <button
            type="button"
            onClick={onDecrease}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#112317] shadow-[0_10px_20px_rgba(6,21,12,0.06)] transition active:scale-95"
          >
            -
          </button>
          <div className="flex items-center justify-center text-center">
            <span className="truncate text-[1.32rem] font-bold tracking-[-0.05em] text-[#112317]">{value}</span>
          </div>
          <button
            type="button"
            onClick={onIncrease}
            className="kinetic-gradient flex h-9 w-9 items-center justify-center rounded-full text-white transition active:scale-95"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function DurationWheelColumn({
  label,
  options,
  value,
  onChange,
  formatValue,
}: {
  label: string;
  options: readonly number[];
  value: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const selectedIndex = options.indexOf(value);

    if (selectedIndex === -1) {
      return;
    }

    container.scrollTo({
      top: selectedIndex * WHEEL_ITEM_HEIGHT,
      behavior: "auto",
    });
  }, [options, value]);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  function commitScrollSelection() {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const index = Math.max(0, Math.min(options.length - 1, Math.round(container.scrollTop / WHEEL_ITEM_HEIGHT)));
    const nextValue = options[index];

    container.scrollTo({
      top: index * WHEEL_ITEM_HEIGHT,
      behavior: "smooth",
    });

    if (nextValue !== value) {
      onChange(nextValue);
    }
  }

  return (
    <div className="relative flex-1">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">{label}</p>
      <div className="pointer-events-none absolute inset-x-2 top-[4.15rem] h-11 rounded-[0.95rem] bg-[#eef2ee] ring-1 ring-[#dfe5df]" />
      <div
        ref={containerRef}
        className="no-scrollbar h-[13.2rem] overflow-y-auto py-[4.4rem] [scroll-snap-type:y_mandatory]"
        onScroll={() => {
          if (scrollTimerRef.current) {
            window.clearTimeout(scrollTimerRef.current);
          }

          scrollTimerRef.current = window.setTimeout(commitScrollSelection, 90);
        }}
      >
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex h-11 w-full snap-center items-center justify-center text-center text-[1rem] font-bold transition ${
                active ? "text-[#112317]" : "text-[#9aa39c]"
              }`}
            >
              {formatValue(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CreateListingFormBody({
  currentProfile,
  onCreateListing,
  profileCompletionEnabled = false,
  shouldLoadCurrentProfile = false,
}: {
  currentProfile?: Profile | null;
  onCreateListing: (input: CreateMatchInput) => Promise<{ id: string }>;
  profileCompletionEnabled?: boolean;
  shouldLoadCurrentProfile?: boolean;
}) {
  const router = useRouter();
  const [defaultSchedule] = useState(getDefaultSchedule);
  const [resolvedProfile, setResolvedProfile] = useState(currentProfile ?? null);
  const [sport, setSport] = useState<SportType>("futsal");
  const [neededCount, setNeededCount] = useState(1);
  const [date, setDate] = useState(defaultSchedule.date);
  const [time, setTime] = useState(defaultSchedule.time);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [durationPickerOpen, setDurationPickerOpen] = useState(false);
  const [durationPickerHours, setDurationPickerHours] = useState(2);
  const [durationPickerMinutes, setDurationPickerMinutes] = useState(0);
  const [futsalFormat, setFutsalFormat] = useState<FutsalFormatOption>("5vs5");
  const [positionTargets, setPositionTargets] = useState<MatchPosition[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState(false);
  const [fee, setFee] = useState(10000);
  const [contactType, setContactType] = useState<DirectContactType>("openchat");
  const [contactValue, setContactValue] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [submitAfterProfile, setSubmitAfterProfile] = useState(false);
  const minimumDate = getMinimumSelectableDate();
  const minimumTime = getMinimumSelectableTime(date);

  useEffect(() => {
    if (!shouldLoadCurrentProfile || currentProfile) {
      return;
    }

    let cancelled = false;

    void import("@/lib/supabase/browser")
      .then(({ getBrowserCurrentProfile }) => getBrowserCurrentProfile())
      .then((profile) => {
        if (!cancelled && profile) {
          setResolvedProfile(profile);
        }
      })
      .catch(() => {
        // Keep the create flow interactive even if profile bootstrap fails.
      });

    return () => {
      cancelled = true;
    };
  }, [currentProfile, shouldLoadCurrentProfile]);

  useEffect(() => {
    if (!durationPickerOpen) {
      return;
    }

    const { hours, minutes } = splitDuration(durationMinutes);
    setDurationPickerHours(hours);
    setDurationPickerMinutes(snapDurationMinutes(minutes));
  }, [durationMinutes, durationPickerOpen]);

  useEffect(() => {
    const nextType = getProfileDefaultContactType(resolvedProfile);
    setContactType(nextType);
    setContactValue(getProfileContactValue(resolvedProfile, nextType));
  }, [resolvedProfile]);

  useEffect(() => {
    if (sport !== "futsal") {
      return;
    }

    setPositionTargets((current) => current.filter((position) => position === "goalkeeper"));
  }, [sport]);

  useEffect(() => {
    if (minimumTime && time < minimumTime) {
      setTime(minimumTime);
    }
  }, [minimumTime, time]);

  function applyQuickDuration(duration: (typeof QUICK_DURATION_OPTIONS)[number]) {
    setDurationMinutes(duration);
    setIsCustomDuration(false);
  }

  function applyCustomDuration() {
    const nextDuration = durationPickerHours * 60 + durationPickerMinutes;

    if (nextDuration <= 0) {
      return;
    }

    setDurationMinutes(nextDuration);
    setIsCustomDuration(!QUICK_DURATION_OPTIONS.includes(nextDuration as (typeof QUICK_DURATION_OPTIONS)[number]));
    setDurationPickerOpen(false);
  }

  function adjustFee(delta: number) {
    setFee((currentFee) => Math.max(0, currentFee + delta));
  }

  function handleContactTypeChange(nextType: DirectContactType) {
    setContactType(nextType);
    setContactValue(getProfileContactValue(resolvedProfile, nextType));
  }

  function togglePositionTarget(position: MatchPosition) {
    setPositionTargets((current) => {
      if (sport === "futsal") {
        return current.includes("goalkeeper") ? [] : ["goalkeeper"];
      }

      return current.includes(position)
        ? current.filter((item) => item !== position)
        : [...current, position];
    });
  }

  async function submitListing() {
    setError("");
    const startAt = `${date}T${time}:00`;

    if (isPastKoreaDateTime(startAt)) {
      setError("현재 시각보다 지난 경기 시간으로는 모집할 수 없습니다.");
      return;
    }

    if (!selectedPlace) {
      setError("경기장을 먼저 선택해 주세요.");
      return;
    }

    if (!isPlaceInSuwon(selectedPlace)) {
      setError("현재는 수원 지역 경기만 등록할 수 있어요.");
      return;
    }

    const normalizedContactValue =
      contactType === "phone" ? normalizePhoneNumber(contactValue) : contactValue.trim();

    if (!normalizedContactValue) {
      setError("연락 정보를 입력해 주세요.");
      return;
    }

    if (profileCompletionEnabled && !isProfileComplete(resolvedProfile)) {
      setSubmitAfterProfile(true);
      setProfileSheetOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const createdMatch = await onCreateListing({
        sport_type: sport,
        futsal_format: sport === "futsal" ? futsalFormat : null,
        mode: "solo",
        listing_type: "mercenary",
        title: selectedPlace.name,
        region_slug: "suwon",
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        start_at: startAt,
        duration_minutes: durationMinutes,
        fee,
        total_slots: neededCount,
        remaining_slots: neededCount,
        min_group_size: 1,
        max_group_size: 1,
        skill_level: resolvedProfile?.skill_level ?? "mid",
        position_targets: positionTargets,
        contact_type: contactType,
        contact_link: normalizedContactValue,
        note: note.trim(),
      });

      router.push(`/activity?highlight=${createdMatch.id}&flash=created`);
    } catch (createError) {
      if (requiresProfileSetup(createError)) {
        setSubmitAfterProfile(true);
        setProfileSheetOpen(true);
      } else {
        setError(
          getUserFacingErrorMessage(createError, "공석을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
      }
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-3.5 pb-28">
      <ScreenHeader href="/home" ariaLabel="홈으로 돌아가기" />

      <section className="surface-card rounded-[1.55rem] p-3.5">
        <div className="grid grid-cols-2 gap-2">
          {SPORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSport(option.value)}
              className={`min-h-11 rounded-[0.95rem] px-4 py-2.5 text-[15px] font-bold transition active:scale-[0.98] ${
                sport === option.value ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#223128]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {sport === "futsal" ? (
          <div className="mt-2.5 rounded-[1.1rem] bg-[#f4f7f3] px-2.5 py-2.5">
            <div className="flex items-center justify-center gap-2.5">
              {FUTSAL_FORMAT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFutsalFormat(option)}
                  className={`min-w-[4.7rem] rounded-full px-3 py-2.5 text-[14px] font-bold transition active:scale-95 ${
                    futsalFormat === option
                      ? "kinetic-gradient text-white"
                      : "bg-white text-[#112317] shadow-[0_10px_20px_rgba(6,21,12,0.06)]"
                  }`}
                >
                  {formatMatchFormatLabel(option)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <StepperField
            label="모집 인원"
            value={`${neededCount}명`}
            onDecrease={() => setNeededCount((count) => Math.max(1, count - 1))}
            onIncrease={() => setNeededCount((count) => Math.min(9, count + 1))}
          />
          <StepperField
            label="1인 참가비"
            value={formatFeeLabel(fee)}
            onDecrease={() => adjustFee(-1000)}
            onIncrease={() => adjustFee(1000)}
          />
        </div>

        <div className="mt-2.5">
          <p className="mb-1.5 pl-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6d786f]">모집 포지션</p>
          <div className="rounded-[1.1rem] bg-[#f4f7f3] px-2.5 py-2.5">
            {sport === "futsal" ? (
              <div className="flex items-center justify-between gap-3 rounded-[0.9rem] px-1 py-0.5">
                <p className="text-[12px] font-medium text-[#66736a]">골키퍼를 모집할 경우에 선택해 주세요.</p>
                <button
                  type="button"
                  onClick={() => togglePositionTarget("goalkeeper")}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                    positionTargets.includes("goalkeeper")
                      ? "kinetic-gradient text-white"
                      : "bg-white text-[#112317] shadow-[0_10px_20px_rgba(6,21,12,0.06)]"
                  }`}
                >
                  골키퍼
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                {getMatchPositionOptions(sport).map((option) => {
                  const active = positionTargets.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePositionTarget(option.value)}
                      className={`min-w-[4.65rem] rounded-full px-3 py-2 text-[13px] font-bold transition active:scale-95 ${
                        active
                          ? "kinetic-gradient text-white"
                          : "bg-white text-[#112317] shadow-[0_10px_20px_rgba(6,21,12,0.06)]"
                      }`}
                    >
                      {getMatchPositionLabel(option.value)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.55rem] p-3.5">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="group relative flex h-11 min-w-0 cursor-pointer items-center rounded-[1rem] bg-[#eef2ee] pl-10 pr-10 text-[13px] font-medium text-[#112317] transition focus-within:bg-white focus-within:ring-4 focus-within:ring-[#b8ff5a]/25">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
                <span className="truncate">{formatDisplayDate(date)}</span>
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={minimumDate}
                  aria-label="경기 날짜 선택"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <label className="group relative flex h-11 min-w-0 cursor-pointer items-center rounded-[1rem] bg-[#eef2ee] px-4 pr-10 text-[13px] font-medium text-[#112317] transition focus-within:bg-white focus-within:ring-4 focus-within:ring-[#b8ff5a]/25">
                <span className="truncate">{formatDisplayTime(time)}</span>
                <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  min={minimumTime}
                  aria-label="경기 시작 시간 선택"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">경기시간</span>
              <p className="text-[11px] font-semibold text-[#66736a]">
                {formatTimeRange(`${date}T${time}:00`, durationMinutes)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_DURATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => applyQuickDuration(option)}
                  className={`rounded-full px-3.5 py-2 text-[12px] font-bold transition active:scale-95 ${
                    durationMinutes === option && !isCustomDuration
                      ? "kinetic-gradient text-white"
                      : "bg-[#eef2ee] text-[#223128]"
                  }`}
                >
                  {formatDurationMinutes(option)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationPickerOpen(true)}
                className={`rounded-full px-3.5 py-2 text-[12px] font-bold transition active:scale-95 ${
                  isCustomDuration
                    ? "kinetic-gradient text-white"
                    : "bg-[#eef2ee] text-[#223128]"
                }`}
              >
                {isCustomDuration ? formatDurationMinutes(durationMinutes) : "직접입력"}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">경기장</span>
            <button
              type="button"
              onClick={() => setIsPlacePickerOpen(true)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[1rem] bg-[#eef2ee] px-4 py-2.5 text-left transition active:scale-[0.985]"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate ${
                    selectedPlace
                      ? "text-[13px] font-semibold text-[#112317]"
                      : "text-[12.5px] font-medium text-[#526058]"
                  }`}
                >
                  {selectedPlace?.name ?? "지도에서 경기장 찾기"}
                </p>
              </div>
              <MapPin className={`h-4 w-4 shrink-0 ${selectedPlace ? "text-[#112317]" : "text-[#66736a]"}`} />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">연락 방식</span>
            <div className="grid grid-cols-2 gap-2">
              {DIRECT_CONTACT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleContactTypeChange(option.value)}
                  className={`rounded-[1rem] px-4 py-2.5 text-[13px] font-bold transition ${
                    contactType === option.value
                      ? "kinetic-gradient text-white"
                      : "bg-[#eef2ee] text-[#223128]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="relative">
              {contactType === "phone" ? (
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
              ) : (
                <MessageCircleMore className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
              )}
              <Input
                value={contactType === "phone" ? normalizePhoneNumber(contactValue) : contactValue}
                onChange={(event) =>
                  setContactValue(
                    contactType === "phone"
                      ? normalizePhoneNumber(event.target.value)
                      : event.target.value,
                  )
                }
                placeholder={getContactFieldPlaceholder(contactType)}
                inputMode={contactType === "phone" ? "tel" : "url"}
                className="h-11 rounded-[1rem] pl-10"
              />
            </div>

            <p className="text-[11px] leading-5 text-[#66736a]">
              {getContactFieldLabel(contactType)}는 프로필에 저장한 기본값을 불러와 바로 쓸 수 있습니다.
            </p>
          </div>

          <label className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">메모</span>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="예: 검정 상의 착용 / 10분 전 도착 부탁"
              className="min-h-24 rounded-[1rem]"
            />
          </label>
        </div>
      </section>

      {error ? (
        <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
          {error}
        </p>
      ) : null}

      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] rounded-t-[1.75rem] px-4 pb-5 pt-3 shadow-[0_-18px_42px_rgba(10,18,13,0.06)]">
        <Button className="w-full gap-2" size="lg" type="button" disabled={isSubmitting} onClick={submitListing}>
          <span>{isSubmitting ? "등록 중..." : "용병 모집하기"}</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isPlacePickerOpen ? (
        <KakaoPlacePicker
          initialQuery={placeQuery}
          onOpenChange={setIsPlacePickerOpen}
          onSelectPlace={(place) => {
            setSelectedPlace(place);
            setPlaceQuery(place.name);
            setError("");
          }}
        />
      ) : null}

      <Sheet open={durationPickerOpen} onOpenChange={setDurationPickerOpen}>
        <SheetContent>
          <div className="space-y-5">
            <div>
              <SheetTitle className="text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">
                경기 시간을 직접 고르세요
              </SheetTitle>
              <SheetDescription className="mt-2 text-sm leading-6 text-[#66736a]">
                시간과 분을 스크롤해서 선택하면 종료 예정 시각까지 바로 계산됩니다.
              </SheetDescription>
            </div>

            <div className="rounded-[1.35rem] bg-[#f4f7f3] px-4 py-4">
              <div className="flex gap-3">
                <DurationWheelColumn
                  label="시간"
                  options={DURATION_HOUR_OPTIONS}
                  value={durationPickerHours}
                  onChange={setDurationPickerHours}
                  formatValue={(value) => `${value}시간`}
                />
                <DurationWheelColumn
                  label="분"
                  options={DURATION_MINUTE_OPTIONS}
                  value={durationPickerMinutes}
                  onChange={setDurationPickerMinutes}
                  formatValue={(value) => `${String(value).padStart(2, "0")}분`}
                />
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-[#eef2ee] px-4 py-4">
              <p className="text-[13px] font-bold text-[#112317]">
                총 {formatDurationMinutes(durationPickerHours * 60 + durationPickerMinutes)}
              </p>
              <p className="mt-1 text-[13px] text-[#66736a]">
                {formatTimeRange(`${date}T${time}:00`, durationPickerHours * 60 + durationPickerMinutes)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => setDurationPickerOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1"
                disabled={durationPickerHours === 0 && durationPickerMinutes === 0}
                onClick={applyCustomDuration}
              >
                적용
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ProfileCompletionSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profile={resolvedProfile}
        title="공석을 올리려면 기본 정보가 필요해요"
        description="닉네임과 연령대, 실력만 입력하면 바로 등록을 이어서 진행합니다."
        confirmLabel="저장하고 등록 계속하기"
        onCompleted={(profile) => {
          setResolvedProfile(profile);
          if (submitAfterProfile) {
            setSubmitAfterProfile(false);
            void submitListing();
          }
        }}
      />
    </div>
  );
}

function DemoCreateListingForm() {
  const { actions, currentProfile } = useDemoApp();

  return (
    <CreateListingFormBody
      currentProfile={currentProfile}
      onCreateListing={async (input) => {
        const match = actions.createMatch(input);
        return { id: match.id };
      }}
    />
  );
}

export function CreateListingForm({
  currentProfile,
  shouldLoadCurrentProfile = false,
  dataSource = currentProfile !== undefined ? "supabase" : "demo",
}: {
  currentProfile?: Profile | null;
  shouldLoadCurrentProfile?: boolean;
  dataSource?: AppDataSource;
}) {
  if (dataSource === "supabase") {
    return (
      <CreateListingFormBody
        currentProfile={currentProfile ?? null}
        profileCompletionEnabled
        shouldLoadCurrentProfile={shouldLoadCurrentProfile}
        onCreateListing={async (input) => {
          await ensureAnonymousSessionAction();
          return createMatchAction(input);
        }}
      />
    );
  }

  return <DemoCreateListingForm />;
}
