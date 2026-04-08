"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, MapPin, MessageCircleMore, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import type { PlaceSearchResult } from "@/components/create/kakao-place-picker";
import { KakaoPlacePicker } from "@/components/create/kakao-place-picker";
import { BackButton } from "@/components/app/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AppDataSource } from "@/lib/app-config";
import { SPORT_OPTIONS } from "@/lib/constants";
import { getUserFacingErrorMessage, requiresProfileSetup } from "@/lib/errors";
import { useDemoApp } from "@/lib/demo-state/provider";
import { isProfileComplete } from "@/lib/profiles";
import { haversineDistance } from "@/lib/utils";
import type { CreateMatchInput, Profile, SportType } from "@/lib/types";
import { createMatchAction } from "@/app/actions/matches";

const ProfileCompletionSheet = dynamic(
  () =>
    import("@/components/profile/profile-completion-sheet").then(
      (module) => module.ProfileCompletionSheet,
    ),
  { loading: () => null, ssr: false },
);

const SUWON_CENTER = { lat: 37.2636, lng: 127.0286 };

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function isPlaceInSuwon(place: PlaceSearchResult) {
  if (place.address.includes("수원")) {
    return true;
  }

  return haversineDistance(SUWON_CENTER.lat, SUWON_CENTER.lng, place.lat, place.lng) <= 18;
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
  const [resolvedProfile, setResolvedProfile] = useState(currentProfile ?? null);
  const [sport, setSport] = useState<SportType>("futsal");
  const [neededCount, setNeededCount] = useState(1);
  const [date, setDate] = useState(getDefaultDate);
  const [time, setTime] = useState("20:00");
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState(false);
  const [fee, setFee] = useState("10000");
  const [contactLink, setContactLink] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [submitAfterProfile, setSubmitAfterProfile] = useState(false);

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

  async function submitListing() {
    setError("");

    if (!selectedPlace) {
      setError("경기장을 먼저 선택해 주세요.");
      return;
    }

    if (!isPlaceInSuwon(selectedPlace)) {
      setError("현재는 수원 지역 경기만 등록할 수 있어요.");
      return;
    }

    if (!contactLink.trim()) {
      setError("오픈채팅 또는 연락 링크를 입력해 주세요.");
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
        mode: "solo",
        listing_type: "mercenary",
        title: selectedPlace.name,
        region_slug: "suwon",
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        start_at: `${date}T${time}:00`,
        fee: Number(fee || 0),
        total_slots: neededCount,
        remaining_slots: neededCount,
        min_group_size: 1,
        max_group_size: 1,
        skill_level: resolvedProfile?.skill_level ?? "mid",
        contact_type: "openchat",
        contact_link: contactLink.trim(),
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
    <div className="space-y-4 pb-28">
      <section className="surface-card rounded-[1.7rem] p-4">
        <div className="flex items-center justify-between">
          <BackButton href="/home" ariaLabel="홈으로 돌아가기" />
          <span className="font-display text-[1.04rem] font-bold tracking-[0.16em] text-[#112317]">FOOTLINK</span>
          <span className="rounded-full bg-[#eef2ee] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736a]">
            Host
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Open Spot</p>
          <h1 className="mt-2 text-[1.8rem] font-bold tracking-[-0.05em] text-[#112317]">부족 인원 바로 채우기</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#66736a]">
            지금 비는 자리를 빠르게 채우기 위한 최소 정보만 입력하세요.
          </p>
        </div>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Sport</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SPORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSport(option.value)}
              className={`min-h-12 rounded-[1rem] px-4 py-3 text-[15px] font-bold transition active:scale-[0.98] ${
                sport === option.value ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#223128]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[1.2rem] bg-[#f4f7f3] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#445149]">
              <Users className="h-4 w-4 text-[#112317]" />
              <span>부족 인원</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNeededCount((count) => Math.max(1, count - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#112317] shadow-[0_10px_20px_rgba(6,21,12,0.06)] transition active:scale-95"
              >
                -
              </button>
              <div className="min-w-[4rem] text-center text-[1.75rem] font-bold tracking-[-0.06em] text-[#112317]">
                {neededCount}
              </div>
              <button
                type="button"
                onClick={() => setNeededCount((count) => Math.min(9, count + 1))}
                className="kinetic-gradient flex h-10 w-10 items-center justify-center rounded-full text-white transition active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4">
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">시간</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="pl-10" />
              </div>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </label>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">경기장</span>
            <button
              type="button"
              onClick={() => setIsPlacePickerOpen(true)}
              className="flex min-h-14 w-full items-center justify-between rounded-[1rem] bg-[#eef2ee] px-4 py-3 text-left transition active:scale-[0.985]"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold text-[#112317]">
                  {selectedPlace?.name ?? "카카오 지도에서 경기장 찾기"}
                </p>
                <p className="mt-1 truncate text-[12px] text-[#66736a]">
                  {(selectedPlace?.address ?? placeQuery) || "수원 내 경기장을 검색해 선택해 주세요."}
                </p>
              </div>
              <MapPin className="h-4 w-4 shrink-0 text-[#112317]" />
            </button>
          </div>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">참가비</span>
            <Input value={fee} onChange={(event) => setFee(event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">연락 링크</span>
            <div className="relative">
              <MessageCircleMore className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
              <Input
                value={contactLink}
                onChange={(event) => setContactLink(event.target.value)}
                placeholder="오픈채팅 링크"
                className="pl-10"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">메모</span>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="예: 검정 상의 착용 / 10분 전 도착 부탁"
            />
          </label>
        </div>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Preview</p>
        <div className="mt-3 rounded-[1.25rem] bg-[#f4f7f3] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[15px] font-bold text-[#112317]">{selectedPlace?.name ?? "경기장 선택 전"}</p>
              <p className="mt-1 text-[13px] font-semibold text-[#4f5d55]">{neededCount}자리 남음</p>
            </div>
            <span className="rounded-full bg-[#e7f4da] px-2.5 py-1 text-[11px] font-bold text-[#254712]">
              {sport === "futsal" ? "풋살" : "축구"}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-6 text-[#66736a]">
            {date} {time} · 수원 · {Number(fee || 0).toLocaleString("ko-KR")}원
          </p>
        </div>
      </section>

      <section className="surface-card rounded-[1.35rem] px-4 py-4">
        <p className="text-[13px] font-medium leading-6 text-[#66736a]">
          참가자 화면을 먼저 보고 싶다면
          <Link href="/home" className="ml-2 inline-block border-b border-[#112317]/25 font-bold text-[#112317]">
            홈으로 이동
          </Link>
        </p>
      </section>

      {error ? (
        <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
          {error}
        </p>
      ) : null}

      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] rounded-t-[1.75rem] px-4 pb-5 pt-3 shadow-[0_-18px_42px_rgba(10,18,13,0.06)]">
        <Button className="w-full gap-2" size="lg" type="button" disabled={isSubmitting} onClick={submitListing}>
          <span>{isSubmitting ? "등록 중..." : "공석 등록하기"}</span>
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
          const { ensureAnonymousSession } = await import("@/lib/supabase/client");
          await ensureAnonymousSession();

          return createMatchAction(input);
        }}
      />
    );
  }

  return <DemoCreateListingForm />;
}
