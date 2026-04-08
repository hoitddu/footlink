"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { BackButton } from "@/components/app/back-button";
import { MatchIntentStep } from "@/components/entry/match-intent-step";
import { REGION_OPTIONS } from "@/lib/constants";
import type { EntryMode } from "@/lib/types";

type Step = "landing" | "location" | "intent";

const LOCATION_DECISION_KEY = "footlink-location-decision-v1";

function getModeFromGroupSize(groupSize: number): EntryMode {
  if (groupSize === 1) return "solo";
  if (groupSize >= 5) return "team";
  return "small_group";
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#04070d]">
      <Image
        src="/landing-bg.webp"
        alt=""
        fill
        priority
        sizes="430px"
        className="absolute inset-0 scale-[1.06] object-cover object-center brightness-[0.6] saturate-[0.76]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,18,0.74)_0%,rgba(8,14,25,0.34)_34%,rgba(7,12,18,0.18)_58%,rgba(2,5,8,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(180,203,240,0.18),transparent_28%),radial-gradient(circle_at_14%_44%,rgba(255,255,255,0.82),transparent_11%),radial-gradient(circle_at_86%_44%,rgba(255,255,255,0.82),transparent_11%),radial-gradient(circle_at_50%_82%,rgba(145,214,88,0.18),transparent_28%)] opacity-90" />
      <div className="absolute left-[-20%] top-[35%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.22)_18%,transparent_58%)] blur-2xl opacity-78" />
      <div className="absolute right-[-20%] top-[35%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.22)_18%,transparent_58%)] blur-2xl opacity-78" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0.12)_0%,transparent_24%,transparent_72%,rgba(2,4,6,0.54)_100%)]" />
      <div className="absolute inset-0 turf-texture opacity-[0.11]" />

      <main className="relative z-10 flex min-h-[100dvh] flex-col px-8 pb-[calc(3.9rem+env(safe-area-inset-bottom))] pt-[calc(1.2rem+env(safe-area-inset-top))] text-white">
        <div className="flex items-center justify-center">
          <span className="font-display text-[clamp(1.12rem,3.8vw,1.28rem)] font-semibold tracking-[0.34em] text-white/96">
            FOOTLINK
          </span>
        </div>

        <div className="mx-auto mt-[clamp(4rem,10vh,5.2rem)] flex w-full max-w-[21.5rem] flex-1 flex-col items-center text-center">
          <div className="space-y-4">
            <p className="font-display text-[clamp(0.96rem,3.5vw,1.06rem)] font-semibold uppercase tracking-[0.22em] text-[#c8e7a7]">
              SUWON PILOT
            </p>
            <h1 className="mx-auto max-w-[18.75rem] font-display text-[clamp(4rem,16vw,4.85rem)] font-[780] leading-[0.92] tracking-[-0.048em] text-white [text-wrap:balance]">
              Connect.
              <br />
              Play.
              <br />
              Repeat.
            </h1>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-[clamp(2.5rem,6vh,3.2rem)] flex h-[clamp(4.25rem,10vw,4.6rem)] w-[min(86%,19rem)] items-center justify-center rounded-[1.45rem] bg-[#c7ff57] px-6 text-[#071009] shadow-[0_18px_34px_rgba(0,0,0,0.24),0_0_0_1px_rgba(255,255,255,0.12)_inset] transition duration-200 active:scale-[0.988]"
          >
            <span className="block text-center text-[clamp(1.22rem,4.7vw,1.45rem)] font-bold leading-none tracking-[-0.03em]">
              Get Started
            </span>
          </button>

          <div className="flex-1" />
        </div>
      </main>
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
    granted: "현재 위치를 기준으로 가까운 경기부터 보여드릴게요.",
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
            <h2 className="text-[1.5rem] font-bold tracking-[-0.04em] text-[#112317]">지금 서비스 지역은 수원입니다</h2>
            <p className="text-sm leading-6 text-muted">
              위치를 허용하면 더 가까운 경기부터 보여주고, 허용하지 않아도 수원 경기 목록으로 바로 이동합니다.
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

export function EntryFlow() {
  const router = useRouter();
  const shouldPrefetchHome = process.env.NODE_ENV === "production";
  const [step, setStep] = useState<Step>("landing");
  const [playerCount, setPlayerCount] = useState(1);
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
        intent: { index: 2, label: "조건" },
      }) as const,
    [],
  );

  const homeHref = useMemo(() => {
    const params = new URLSearchParams();

    params.set("mode", getModeFromGroupSize(playerCount));
    params.set("groupSize", String(playerCount));
    params.set("region", locationState.regionSlug);

    if (startDate) {
      params.set("date", startDate);
    }

    if (typeof locationState.lat === "number" && typeof locationState.lng === "number") {
      params.set("lat", locationState.lat.toFixed(6));
      params.set("lng", locationState.lng.toFixed(6));
    }

    return `/home?${params.toString()}`;
  }, [locationState.lat, locationState.lng, locationState.regionSlug, playerCount, startDate]);

  function saveLocationDecision(value: "granted") {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCATION_DECISION_KEY, value);
  }

  function goToIntentStepWithFallback() {
    setLocationStatus("fallback");
    setLocationState({
      regionSlug: "suwon",
      regionLabel: REGION_OPTIONS[0].label,
    });
    setStep("intent");
  }

  function handleLocationRequest() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      goToIntentStepWithFallback();
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
        setStep("intent");
      },
      () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCATION_DECISION_KEY);
        }
        goToIntentStepWithFallback();
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  function handleLocationSkip() {
    goToIntentStepWithFallback();
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
          goToIntentStepWithFallback();
          return;
        }
      } catch {
        // Fall through to the explicit location prompt screen on unsupported browsers.
      }
    }

    setStep("location");
  }

  useEffect(() => {
    if (!shouldPrefetchHome || step !== "intent" || !startDate) {
      return;
    }

    router.prefetch(homeHref);
  }, [homeHref, router, shouldPrefetchHome, startDate, step]);

  function handleIntentConfirm() {
    if (!startDate) {
      return;
    }

    router.push(homeHref);
  }

  function handleBack() {
    if (step === "location") {
      setStep("landing");
      return;
    }

    setStep("location");
  }

  if (step === "landing") {
    return <LandingScreen onStart={handleStart} />;
  }

  const currentMeta = stepMeta[step];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col">
      <header className="px-5 pb-4 pt-4">
        <div className="flex min-h-11 items-center justify-between">
          <BackButton onClick={handleBack} />
          <span className="font-display text-[1.08rem] font-bold tracking-[0.16em] text-[#112317]">FOOTLINK</span>
          <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736a] shadow-[0_12px_30px_rgba(6,21,12,0.04)]">
            Step {currentMeta.index}/2
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {Object.values(stepMeta).map((item) => (
            <div key={item.label} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition ${item.index <= currentMeta.index ? "bg-[#112317]" : "bg-[#dde3dc]"}`}
              />
              <p
                className={`text-center text-[10px] font-bold ${
                  item.index === currentMeta.index ? "text-[#112317]" : "text-[#a0a8a2]"
                }`}
              >
                {item.label}
              </p>
            </div>
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
        ) : (
          <MatchIntentStep
            playerCount={playerCount}
            onPlayerCountChange={setPlayerCount}
            startDate={startDate}
            onDateChange={setStartDate}
          />
        )}
      </div>

      {step === "intent" ? (
        <footer className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] rounded-t-[2rem] px-5 pb-8 pt-4 shadow-[0_-18px_50px_rgba(10,18,13,0.06)]">
          <button
            type="button"
            onClick={handleIntentConfirm}
            disabled={!startDate}
            className="kinetic-gradient lime-glow group flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] text-lg font-bold tracking-[-0.02em] text-white transition active:scale-95 disabled:opacity-35"
          >
            <span>이 조건으로 매치 보기</span>
            <ChevronRight className="h-5 w-5 transition-transform group-active:translate-x-0.5" />
          </button>
        </footer>
      ) : null}
    </div>
  );
}
