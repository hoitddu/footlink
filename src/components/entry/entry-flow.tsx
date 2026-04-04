"use client";

import { startTransition, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { DateQuickSelector } from "@/components/entry/date-quick-selector";
import { PlayerCountSelector } from "@/components/entry/player-count-selector";
import { Input } from "@/components/ui/input";
import { AGE_BANDS, REGION_OPTIONS } from "@/lib/constants";
import { getAppDataSource } from "@/lib/app-config";
import { createBrowserSupabaseClient, ensureAnonymousSession } from "@/lib/supabase/client";
import type { EntryMode, Profile, SkillLevel } from "@/lib/types";

type Step = "landing" | "location" | "count" | "date" | "profile";

function getModeFromGroupSize(groupSize: number): EntryMode {
  if (groupSize === 1) return "solo";
  if (groupSize >= 5) return "team";
  return "small_group";
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#08110b]">
      <img
        src="/landing-bg.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,11,0.45)_0%,rgba(6,16,11,0.9)_100%)]" />
      <div className="absolute inset-0 turf-texture opacity-35" />

      <main className="relative z-10 flex flex-1 flex-col justify-between px-6 pb-10 pt-8 text-white">
        <div className="flex items-center">
          <span className="font-display text-lg font-bold tracking-[0.18em]">FOOTLINK</span>
        </div>

        <div className="pb-14">
          <div className="space-y-3">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-[#b8ff5a]">
              SUWON PILOT
            </p>
            <h1 className="font-display text-[3.8rem] font-bold leading-[0.92] tracking-[-0.08em]">
              Connect.
              <br />
              Play.
              <br />
              Repeat.
            </h1>
          </div>
        </div>
      </main>

      <div className="relative z-10 px-6 pb-12">
        <button
          type="button"
          onClick={onStart}
          className="kinetic-gradient lime-glow flex min-h-[6.6rem] w-full items-center justify-center rounded-[1.2rem] px-6 py-5 text-white transition active:scale-95"
        >
          <span className="block whitespace-nowrap text-center font-display text-[1.95rem] font-black leading-none tracking-[-0.03em] [transform:skewX(-12deg)]">
            Let&apos;s hit the pitch!
          </span>
        </button>
      </div>
    </div>
  );
}

function LocationPermissionStep({
  status,
  onRequest,
  onSkip,
}: {
  status: "idle" | "loading" | "granted" | "fallback";
  onRequest: () => void;
  onSkip: () => void;
}) {
  const statusCopy = {
    idle: "수원 안에서 가까운 매치를 먼저 보여드릴게요. 위치를 허용하면 더 정확해집니다.",
    loading: "현재 위치를 확인하고 있어요.",
    granted: "수원 기준으로 가까운 경기부터 보여드릴게요.",
    fallback: "위치 없이도 수원 경기부터 바로 볼 수 있어요.",
  } as const;

  return (
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">수원 매치부터 볼게요</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{statusCopy[status]}</p>
      </div>

      <div className="surface-card flex flex-1 flex-col justify-between rounded-[2rem] p-5">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#112317] text-[#b8ff5a]">
            <MapPin className="h-6 w-6" />
          </div>

          <div className="mt-5 space-y-3">
            <h2 className="text-[1.5rem] font-bold tracking-[-0.04em] text-[#112317]">
              지금 서비스 지역은 수원입니다
            </h2>
            <p className="text-sm leading-6 text-muted">
              위치를 허용하면 더 가까운 경기부터 보여주고, 허용하지 않아도 수원 경기 탐색은 바로 가능합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {["수원 경기 우선 노출", "가까운 구장 우선 정렬", "초기 추천 정확도 향상"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[1.15rem] bg-[#eef2ee] px-4 py-3">
                <ShieldCheck className="h-4 w-4 text-[#112317]" />
                <span className="text-sm font-medium text-[#39443d]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={onRequest}
            disabled={status === "loading"}
            className="kinetic-gradient lime-glow flex h-14 w-full items-center justify-center rounded-[1.25rem] text-base font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {status === "loading" ? "위치 확인 중..." : "위치 허용"}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex h-12 w-full items-center justify-center rounded-[1.25rem] bg-[#eef2ee] text-sm font-bold text-[#112317] transition active:scale-95"
          >
            수원 경기만 볼게요
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSetupStep({
  nickname,
  onNicknameChange,
  age,
  onAgeChange,
  regionLabel,
  skillLevel,
  error,
}: {
  nickname: string;
  onNicknameChange: (value: string) => void;
  age: number;
  onAgeChange: (value: number) => void;
  regionLabel: string;
  skillLevel: SkillLevel;
  error: string;
}) {
  return (
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">최소 프로필만 마치면 끝입니다</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          홈 진입 전에 닉네임과 연령대만 설정하면 이후 요청과 생성이 바로 됩니다.
        </p>
      </div>

      <div className="surface-card rounded-[2rem] p-5">
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">닉네임</span>
          <Input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder="풋링크에서 보일 이름" />
        </label>

        <div className="mt-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">나이</span>
          <div className="grid grid-cols-3 gap-2">
            {AGE_BANDS.map((band) => (
              <button
                key={band.value}
                type="button"
                onClick={() => onAgeChange(band.value)}
                className={`rounded-[1rem] px-3 py-3 text-sm font-bold transition ${
                  age === band.value ? "bg-[#112317] text-white" : "bg-[#eef2ee] text-[#55625a]"
                }`}
              >
                {band.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-[#eef2ee] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">지역</p>
            <p className="mt-1 text-sm font-semibold text-[#112317]">{regionLabel}</p>
          </div>
          <div className="rounded-[1.2rem] bg-[#eef2ee] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">실력</p>
            <p className="mt-1 text-sm font-semibold text-[#112317]">{skillLevel}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.2rem] bg-[#f5f7f5] px-4 py-3 text-sm text-[#536157]">
          오픈채팅 링크는 매치 생성할 때만 입력하면 됩니다.
        </div>

        {error ? (
          <p className="mt-4 rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function EntryFlow({ initialProfile }: { initialProfile?: Profile | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("landing");
  const [playerCount, setPlayerCount] = useState(1);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(initialProfile?.skill_level ?? "mid");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "fallback">("idle");
  const [locationState, setLocationState] = useState<{
    lat?: number;
    lng?: number;
    regionSlug: string;
    regionLabel: string;
  }>({
    regionSlug: "suwon",
    regionLabel: REGION_OPTIONS[0].label,
  });
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [age, setAge] = useState<number>(initialProfile?.age ?? 20);
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const stepMeta = useMemo(
    () =>
      ({
        location: { index: 1, label: "위치" },
        count: { index: 2, label: "인원" },
        date: { index: 3, label: "일정" },
        profile: { index: 4, label: "프로필" },
      }) as const,
    [],
  );

  function handleLocationRequest() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("fallback");
      setStep("count");
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          regionSlug: "suwon",
          regionLabel: REGION_OPTIONS[0].label,
        });
        setLocationStatus("granted");
        setStep("count");
      },
      () => {
        setLocationStatus("fallback");
        setStep("count");
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  function handleLocationSkip() {
    setLocationStatus("fallback");
    setLocationState({
      regionSlug: "suwon",
      regionLabel: REGION_OPTIONS[0].label,
    });
    setStep("count");
  }

  function buildHomeUrl() {
    const mode = getModeFromGroupSize(playerCount);
    const params = new URLSearchParams({
      mode,
      groupSize: String(playerCount),
      region: "suwon",
      date: startDate ?? "",
      skill: skillLevel,
    });

    if (typeof locationState.lat === "number" && typeof locationState.lng === "number") {
      params.set("lat", locationState.lat.toFixed(6));
      params.set("lng", locationState.lng.toFixed(6));
    }

    return `/home?${params.toString()}`;
  }

  async function handleFinish() {
    if (!startDate) return;

    if (getAppDataSource() !== "supabase" || initialProfile) {
      startTransition(() => router.push(buildHomeUrl()));
      return;
    }

    setProfileError("");
    setIsSavingProfile(true);

    try {
      const user = await ensureAnonymousSession();

      if (!user) {
        throw new Error("익명 세션을 만들지 못했습니다.");
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("profiles").upsert(
        {
          auth_user_id: user.id,
          nickname: nickname.trim() || "플레이어",
          age,
          preferred_mode: getModeFromGroupSize(playerCount),
          preferred_regions: [locationState.regionLabel],
          skill_level: skillLevel,
          open_chat_link: null,
        },
        { onConflict: "auth_user_id" },
      );

      if (error) {
        throw error;
      }

      startTransition(() => router.push(buildHomeUrl()));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "프로필을 저장하지 못했습니다.");
      setIsSavingProfile(false);
    }
  }

  function handleDateConfirm() {
    if (!startDate) return;

    if (getAppDataSource() === "supabase" && !initialProfile) {
      setStep("profile");
      return;
    }

    startTransition(() => router.push(buildHomeUrl()));
  }

  function handleBack() {
    if (step === "location") {
      setStep("landing");
      return;
    }
    if (step === "count") {
      setStep("location");
      return;
    }
    if (step === "date") {
      setStep("count");
      return;
    }
    setStep("date");
  }

  if (step === "landing") {
    return <LandingScreen onStart={() => setStep("location")} />;
  }

  const currentMeta = stepMeta[step];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col">
      <header className="px-5 pb-3 pt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[#112317] shadow-[0_12px_30px_rgba(6,21,12,0.05)] transition active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-bold tracking-[0.16em] text-[#112317]">FOOTLINK</span>
          <div className="flex items-center gap-1 rounded-full bg-white/72 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#607066] shadow-[0_12px_30px_rgba(6,21,12,0.04)]">
            <Sparkles className="h-3.5 w-3.5" />
            {currentMeta.index}/4
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.values(stepMeta).map((item) => (
            <div
              key={item.label}
              className={`h-1.5 rounded-full transition ${item.index <= currentMeta.index ? "bg-[#112317]" : "bg-[#dde3dc]"}`}
            />
          ))}
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-28">
        {step === "location" ? (
          <LocationPermissionStep
            status={locationStatus}
            onRequest={handleLocationRequest}
            onSkip={handleLocationSkip}
          />
        ) : step === "count" ? (
          <PlayerCountSelector
            value={playerCount}
            onChange={setPlayerCount}
            skillLevel={skillLevel}
            onSkillChange={setSkillLevel}
          />
        ) : step === "date" ? (
          <DateQuickSelector startDate={startDate} endDate={null} onSelect={(start) => setStartDate(start)} />
        ) : (
          <ProfileSetupStep
            nickname={nickname}
            onNicknameChange={setNickname}
            age={age}
            onAgeChange={setAge}
            regionLabel={locationState.regionLabel}
            skillLevel={skillLevel}
            error={profileError}
          />
        )}
      </div>

      {step !== "location" ? (
        <footer className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-[2rem] px-5 pb-8 pt-4 shadow-[0_-18px_50px_rgba(10,18,13,0.06)]">
          <button
            type="button"
            onClick={step === "count" ? () => setStep("date") : step === "date" ? handleDateConfirm : handleFinish}
            disabled={(step === "date" && !startDate) || (step === "profile" && isSavingProfile)}
            className="kinetic-gradient lime-glow group flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] text-lg font-bold tracking-[-0.02em] text-white transition active:scale-95 disabled:opacity-35"
          >
            <span>{step === "count" ? "다음" : step === "date" ? "프로필 입력" : isSavingProfile ? "저장 중..." : "매치 보기"}</span>
            <ChevronRight className="h-5 w-5 transition-transform group-active:translate-x-0.5" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}
