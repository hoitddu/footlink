"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { REGION_OPTIONS } from "@/lib/constants";

type LocationStatus = "idle" | "loading" | "granted" | "fallback";

const LOCATION_DECISION_KEY = "footlink-location-decision-v1";

function LandingScreen({
  onStart,
  locationPromptOpen,
  locationStatus,
  onLocationAllow,
  onLocationSkip,
  onLocationPromptOpenChange,
}: {
  onStart: () => void;
  locationPromptOpen: boolean;
  locationStatus: LocationStatus;
  onLocationAllow: () => void;
  onLocationSkip: () => void;
  onLocationPromptOpenChange: (open: boolean) => void;
}) {
  const statusCopy = {
    idle: "위치를 허용하면 더 가까운 경기부터 정렬됩니다.",
    loading: "현재 위치를 확인하고 있어요.",
    granted: "현재 위치 기준으로 더 가까운 경기부터 정렬해드릴게요.",
    fallback: "위치 없이도 수원 전체 공석을 바로 볼 수 있어요.",
  } as const;

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
            <h1 className="mx-auto max-w-[18.75rem] font-display text-[clamp(3.4rem,14vw,4.6rem)] font-[780] leading-[0.92] tracking-[-0.048em] text-white [text-wrap:balance]">
              Fill the
              <br />
              last spot
              <br />
              fast.
            </h1>
            <p className="mx-auto max-w-[18rem] text-[14px] leading-6 text-white/78">
              수원에서 경기 직전 비는 한 자리를 가장 빠르게 찾고 바로 합류하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-[clamp(2.5rem,6vh,3.2rem)] flex h-[clamp(4.25rem,10vw,4.6rem)] w-[min(86%,19rem)] items-center justify-center rounded-[1.45rem] bg-[#c7ff57] px-6 text-[#071009] shadow-[0_18px_34px_rgba(0,0,0,0.24),0_0_0_1px_rgba(255,255,255,0.12)_inset] transition duration-200 active:scale-[0.988]"
          >
            <span className="block text-center text-[clamp(1.22rem,4.7vw,1.45rem)] font-bold leading-none tracking-[-0.03em]">
              시작하기
            </span>
          </button>

          <div className="flex-1" />
        </div>
      </main>

      {locationPromptOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="위치 안내 닫기"
            className="absolute inset-0 bg-[#09110c]/52 backdrop-blur-[2px]"
            onClick={() => onLocationPromptOpenChange(false)}
          />
          <div className="surface-card relative w-full max-w-[22rem] rounded-[1.7rem] p-5 shadow-[0_20px_50px_rgba(6,21,12,0.16)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#112317] text-[#b8ff5a]">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-[1.3rem] font-bold tracking-[-0.04em] text-[#112317]">
              위치를 허용할까요?
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[#66736a]">{statusCopy[locationStatus]}</p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={onLocationAllow}
                disabled={locationStatus === "loading"}
                className="kinetic-gradient lime-glow flex h-12 w-full items-center justify-center rounded-[1.1rem] text-[15px] font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                {locationStatus === "loading" ? "위치 확인 중..." : "위치 허용"}
              </button>
              <button
                type="button"
                onClick={onLocationSkip}
                className="flex h-11 w-full items-center justify-center rounded-[1.1rem] bg-[#eef2ee] text-[13px] font-bold text-[#112317] transition active:scale-95"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function EntryFlow() {
  const router = useRouter();
  const shouldPrefetchHome = process.env.NODE_ENV === "production";
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationState, setLocationState] = useState<{
    lat?: number;
    lng?: number;
    regionSlug: string;
  }>({
    regionSlug: "suwon",
  });

  const homeHref = useMemo(() => {
    const params = new URLSearchParams({
      sport: "futsal",
      sort: "recommended",
      region: locationState.regionSlug,
    });

    if (typeof locationState.lat === "number" && typeof locationState.lng === "number") {
      params.set("lat", locationState.lat.toFixed(6));
      params.set("lng", locationState.lng.toFixed(6));
    }

    return `/home?${params.toString()}`;
  }, [locationState.lat, locationState.lng, locationState.regionSlug]);

  function saveLocationDecision(value: "granted") {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCATION_DECISION_KEY, value);
  }

  function moveToHomeWithFallback() {
    setLocationStatus("fallback");
    setLocationState({ regionSlug: REGION_OPTIONS[0].slug });
    setLocationPromptOpen(false);
    router.push("/home?sport=futsal&sort=recommended&region=suwon");
  }

  function handleLocationRequest() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      moveToHomeWithFallback();
      return;
    }

    setLocationStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          regionSlug: REGION_OPTIONS[0].slug,
        });
        saveLocationDecision("granted");
        setLocationStatus("granted");
        setLocationPromptOpen(false);
        router.push(
          `/home?sport=futsal&sort=recommended&region=suwon&lat=${position.coords.latitude.toFixed(6)}&lng=${position.coords.longitude.toFixed(6)}`,
        );
      },
      () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LOCATION_DECISION_KEY);
        }
        moveToHomeWithFallback();
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }

  function handleLocationSkip() {
    moveToHomeWithFallback();
  }

  async function handleStart() {
    if (typeof window === "undefined") {
      setLocationPromptOpen(true);
      return;
    }

    const savedDecision = window.localStorage.getItem(LOCATION_DECISION_KEY);

    if (savedDecision === "granted") {
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
          handleLocationRequest();
          return;
        }

        if (permissionStatus.state === "denied") {
          moveToHomeWithFallback();
          return;
        }
      } catch {
        // Fall through to the custom overlay when permission query is unavailable.
      }
    }

    setLocationPromptOpen(true);
  }

  useEffect(() => {
    if (!shouldPrefetchHome) {
      return;
    }

    router.prefetch(homeHref);
  }, [homeHref, router, shouldPrefetchHome]);

  return (
    <LandingScreen
      onStart={handleStart}
      locationPromptOpen={locationPromptOpen}
      locationStatus={locationStatus}
      onLocationAllow={handleLocationRequest}
      onLocationSkip={handleLocationSkip}
      onLocationPromptOpenChange={setLocationPromptOpen}
    />
  );
}
