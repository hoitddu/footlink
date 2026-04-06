"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { DateQuickSelector } from "@/components/entry/date-quick-selector";
import { PlayerCountSelector } from "@/components/entry/player-count-selector";
import { REGION_OPTIONS } from "@/lib/constants";
import type { EntryMode, Profile, SkillLevel } from "@/lib/types";

type Step = "landing" | "location" | "count" | "date";

const LOCATION_DECISION_KEY = "footlink-location-decision-v1";

function getModeFromGroupSize(groupSize: number): EntryMode {
  if (groupSize === 1) return "solo";
  if (groupSize >= 5) return "team";
  return "small_group";
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#08110b]">
      <Image
        src="/landing-bg.jpg"
        alt=""
        fill
        priority
        sizes="430px"
        className="absolute inset-0 object-cover opacity-55"
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
    idle: "수원에서 가까운 매치를 먼저 보여드릴게요. 위치를 허용하면 더 정확한 추천이 가능합니다.",
    loading: "현재 위치를 확인하고 있어요.",
    granted: "수원 기준으로 가까운 경기부터 보여드릴게요.",
    fallback: "위치 없이도 수원 경기부터 바로 볼 수 있어요.",
  } as const;

  return (
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">
          수원 매치를 더 빠르게 보여드릴게요
        </h1>
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
            수원 경기만 먼저 볼게요
          </button>
        </div>
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

  const stepMeta = useMemo(
    () =>
      ({
        location: { index: 1, label: "위치" },
        count: { index: 2, label: "인원" },
        date: { index: 3, label: "일정" },
      }) as const,
    [],
  );

  const homeHref = useMemo(() => {
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
  }, [locationState.lat, locationState.lng, playerCount, skillLevel, startDate]);

  function saveLocationDecision(value: "granted") {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCATION_DECISION_KEY, value);
  }

  function goToCountStepWithFallback() {
    setLocationStatus("fallback");
    setLocationState({
      regionSlug: "suwon",
      regionLabel: REGION_OPTIONS[0].label,
    });
    setStep("count");
  }

  function handleLocationRequest() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      goToCountStepWithFallback();
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
        saveLocationDecision("granted");
        setLocationStatus("granted");
        setStep("count");
      },
      () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCATION_DECISION_KEY);
        }
        goToCountStepWithFallback();
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  function handleLocationSkip() {
    goToCountStepWithFallback();
  }

  async function handleStart() {
    if (typeof window === "undefined") {
      setStep("location");
      return;
    }

    const savedDecision = window.localStorage.getItem(LOCATION_DECISION_KEY);

    if (savedDecision === "granted") {
      setStep("location");
      handleLocationRequest();
      return;
    }

    if (typeof navigator !== "undefined" && "permissions" in navigator && navigator.permissions?.query) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });

        if (permissionStatus.state === "granted") {
          saveLocationDecision("granted");
          setStep("location");
          handleLocationRequest();
          return;
        }

        if (permissionStatus.state === "denied") {
          goToCountStepWithFallback();
          return;
        }
      } catch {
        // Fall through to the explicit location prompt screen on unsupported browsers.
      }
    }

    setStep("location");
  }

  useEffect(() => {
    if (step !== "date" || !startDate) {
      return;
    }

    router.prefetch(homeHref);
  }, [homeHref, router, startDate, step]);

  function handleDateConfirm() {
    if (!startDate) return;
    startTransition(() => router.push(homeHref));
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

    setStep("count");
  }

  if (step === "landing") {
    return <LandingScreen onStart={handleStart} />;
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
            {currentMeta.index}/3
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
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
        ) : (
          <DateQuickSelector startDate={startDate} endDate={null} onSelect={(start) => setStartDate(start)} />
        )}
      </div>

      {step !== "location" ? (
        <footer className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-[2rem] px-5 pb-8 pt-4 shadow-[0_-18px_50px_rgba(10,18,13,0.06)]">
          <button
            type="button"
            onClick={step === "count" ? () => setStep("date") : handleDateConfirm}
            disabled={step === "date" && !startDate}
            className="kinetic-gradient lime-glow group flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] text-lg font-bold tracking-[-0.02em] text-white transition active:scale-95 disabled:opacity-35"
          >
            <span>{step === "count" ? "다음" : "매치 보기"}</span>
            <ChevronRight className="h-5 w-5 transition-transform group-active:translate-x-0.5" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}
