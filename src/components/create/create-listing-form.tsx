"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, LoaderCircle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createMatchAction } from "@/app/actions/matches";
import type { PlaceSearchResult } from "@/components/create/kakao-place-picker";
import { MatchCard } from "@/components/feed/match-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AppDataSource } from "@/lib/app-config";
import { SKILL_LEVELS, getSkillLevelLabel } from "@/lib/constants";
import { getUserFacingErrorMessage, requiresProfileSetup } from "@/lib/errors";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  buildMatchNote,
  formatMatchFormatLabel,
  type MatchFormatOption,
} from "@/lib/match-format";
import { isProfileComplete } from "@/lib/profiles";
import { formatFee, haversineDistance } from "@/lib/utils";
import type {
  CreateMatchInput,
  ListingType,
  MatchWithMeta,
  Profile,
} from "@/lib/types";

const ProfileCompletionSheet = dynamic(
  () =>
    import("@/components/profile/profile-completion-sheet").then(
      (module) => module.ProfileCompletionSheet,
    ),
  { loading: () => null, ssr: false },
);

type MatchType = "mercenary" | "team_match";

type KakaoPlace = {
  id: string | number;
  place_name: string;
  address_name?: string;
  road_address_name?: string;
  x: string | number;
  y: string | number;
};

type KakaoSearchStatus = string;

type KakaoLatLng = object;

type KakaoMap = {
  setBounds(bounds: KakaoLatLngBounds): void;
};

type KakaoMarker = {
  setMap(map: KakaoMap | null): void;
};

type KakaoLatLngBounds = {
  extend(position: KakaoLatLng): void;
};

type KakaoInfoWindow = {
  setContent(content: string): void;
  open(map: KakaoMap, marker: KakaoMarker): void;
  close(): void;
};

type KakaoPlaces = {
  keywordSearch(
    query: string,
    callback: (data: KakaoPlace[], status: KakaoSearchStatus) => void,
  ): void;
};

type KakaoApi = {
  maps: {
    load(callback: () => void): void;
    LatLng: new (lat: number, lng: number) => KakaoLatLng;
    Map: new (
      container: HTMLDivElement,
      options: { center: KakaoLatLng; level: number },
    ) => KakaoMap;
    Marker: new (options: { map: KakaoMap; position: KakaoLatLng }) => KakaoMarker;
    LatLngBounds: new () => KakaoLatLngBounds;
    InfoWindow: new (options: { zIndex: number }) => KakaoInfoWindow;
    event: {
      addListener(
        target: KakaoMarker,
        eventName: "click" | "mouseover" | "mouseout",
        handler: () => void,
      ): void;
    };
    services: {
      Places: new () => KakaoPlaces;
      Status: {
        OK: string;
      };
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoApi;
  }
}

const SUWON_LABEL = "수원";

const SUWON_CENTER = { lat: 37.2636, lng: 127.0286 };
const KAKAO_SCRIPT_ID = "kakao-map-sdk";
const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

const teamFormats = ["4vs4", "5vs5", "6vs6"] as const;
type TeamFormat = (typeof teamFormats)[number];

const teamFormatPlayers: Record<TeamFormat, number> = {
  "4vs4": 4,
  "5vs5": 5,
  "6vs6": 6,
};

const feeConfig = {
  mercenary: { default: 10000, step: 1000, min: 0, unit: "인당" },
  team_match: { default: 50000, step: 10000, min: 0, unit: "팀당" },
} as const;

const steps = [
  { num: 1, label: "유형 · 인원" },
  { num: 2, label: "시간 · 장소" },
  { num: 3, label: "상세 · 확인" },
];

const compactSummaryCardClass = "rounded-[1.4rem] bg-[#eef2ee] p-3.5";

function getPreviewStatus(type: MatchType, count: number) {
  if (type === "team_match") {
    return { label: "팀 매치 모집 중", variant: "team" as const };
  }

  if (count <= 2) {
    return { label: `${count}자리 부족`, variant: "urgent" as const };
  }

  return { label: `${count}명 모집 중`, variant: "soon" as const };
}

function getDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeKakaoPlace(place: KakaoPlace): PlaceSearchResult {
  const address = place.road_address_name || place.address_name || place.place_name;

  return {
    id: String(place.id),
    name: place.place_name,
    address,
    lat: Number(place.y),
    lng: Number(place.x),
  };
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
  const formRef = useRef<HTMLFormElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const placesRef = useRef<KakaoPlaces | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  const [step, setStep] = useState(1);

  const [matchType, setMatchType] = useState<MatchType>("mercenary");
  const [neededCount, setNeededCount] = useState(2);
  const [teamFormat, setTeamFormat] = useState<TeamFormat>("5vs5");
  const [mercenaryFormat, setMercenaryFormat] = useState<TeamFormat>("5vs5");
  const [level, setLevel] = useState<CreateMatchInput["skill_level"]>("mid");
  const [fee, setFee] = useState<number>(feeConfig.mercenary.default);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState("");

  const [date, setDate] = useState(getDefaultDate);
  const [time, setTime] = useState("20:30");
  const [placeQuery, setPlaceQuery] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [placeLat, setPlaceLat] = useState<number | undefined>(undefined);
  const [placeLng, setPlaceLng] = useState<number | undefined>(undefined);
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isPlacePickerOpen, setIsPlacePickerOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState("");

  const [contactValue, setContactValue] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewReferenceNow, setPreviewReferenceNow] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [resolvedProfile, setResolvedProfile] = useState(currentProfile ?? null);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const pendingSubmitAfterProfileRef = useRef(false);

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
        // Keep creation fast even if profile bootstrap fails.
      });

    return () => {
      cancelled = true;
    };
  }, [currentProfile, shouldLoadCurrentProfile]);

  const listingType: ListingType = matchType === "team_match" ? "team_match" : "mercenary";
  const preview = getPreviewStatus(matchType, neededCount);
  const feePreset = feeConfig[matchType];
  const previewStartAt = `${date}T${time}:00`;
  const resolvedMatchFormat = (matchType === "team_match" ? teamFormat : mercenaryFormat) as MatchFormatOption;
  const storedNote = buildMatchNote(note, resolvedMatchFormat);
  const missingKakaoKeyError =
    isPlacePickerOpen && !KAKAO_MAP_KEY ? "카카오 지도 키가 아직 설정되지 않았습니다." : "";

  useEffect(() => {
    if (!isPlacePickerOpen) {
      return;
    }

    if (!KAKAO_MAP_KEY) {
      return;
    }

    if (window.kakao?.maps?.services) {
      window.kakao.maps.load(() => setIsMapReady(true));
      return;
    }

    const existingScript = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao?.maps.load(() => setIsMapReady(true));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.onload = () => {
      window.kakao?.maps.load(() => setIsMapReady(true));
    };
    script.onerror = () => {
      setPlaceSearchError("카카오 지도를 불러오지 못했습니다.");
    };

    document.head.appendChild(script);
  }, [isPlacePickerOpen]);

  useEffect(() => {
    if (!isPlacePickerOpen || !isMapReady || !mapContainerRef.current || !window.kakao?.maps) {
      return;
    }

    if (!mapRef.current) {
      const kakao = window.kakao;
      const center = new kakao.maps.LatLng(SUWON_CENTER.lat, SUWON_CENTER.lng);

      mapRef.current = new kakao.maps.Map(mapContainerRef.current, {
        center,
        level: 5,
      });
      placesRef.current = new kakao.maps.services.Places();
      infoWindowRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
    }
  }, [isPlacePickerOpen, isMapReady]);

  function clearMarkers() {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }

  function displayMarkers(results: PlaceSearchResult[]) {
    if (!window.kakao?.maps || !mapRef.current) {
      return;
    }

    clearMarkers();

    const kakao = window.kakao;
    const map = mapRef.current;
    const bounds = new kakao.maps.LatLngBounds();

    results.forEach((result) => {
      const position = new kakao.maps.LatLng(result.lat, result.lng);
      const marker = new kakao.maps.Marker({
        map,
        position,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        handleSelectPlace(result);
      });

      kakao.maps.event.addListener(marker, "mouseover", () => {
        infoWindowRef.current?.setContent(
          `<div style="padding:6px 10px;font-size:12px;">${result.name}</div>`,
        );
        infoWindowRef.current?.open(map, marker);
      });

      kakao.maps.event.addListener(marker, "mouseout", () => {
        infoWindowRef.current?.close();
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (results.length > 0) {
      map.setBounds(bounds);
    }
  }

  function runPlaceSearch() {
    const query = placeQuery.trim();

    if (!query) {
      setPlaceSearchError("장소 이름을 먼저 입력해주세요.");
      return;
    }

    if (!window.kakao?.maps?.services || !placesRef.current) {
      setPlaceSearchError("카카오 지도가 아직 준비되지 않았습니다.");
      return;
    }

    setIsSearchingPlaces(true);
    setPlaceSearchError("");

    const kakao = window.kakao;

    placesRef.current.keywordSearch(
      query,
      (data: KakaoPlace[], status: KakaoSearchStatus) => {
        setIsSearchingPlaces(false);

        if (status !== kakao.maps.services.Status.OK) {
          setPlaceResults([]);
          clearMarkers();
          setPlaceSearchError("검색 결과가 없습니다. 다른 키워드로 다시 시도해주세요.");
          return;
        }

        const results = data.map(normalizeKakaoPlace).slice(0, 8);

        if (results.length === 0) {
          setPlaceResults([]);
          clearMarkers();
          setPlaceSearchError("검색 결과가 없습니다. 다른 키워드로 다시 시도해주세요.");
          return;
        }

        setPlaceResults(results);
        displayMarkers(results);
      }
    );
  }

  function handleTypeChange(type: MatchType) {
    setMatchType(type);

    if (type === "team_match") {
      setNeededCount(1);
      setFee(feeConfig.team_match.default);
    } else {
      setNeededCount(2);
      setFee(feeConfig.mercenary.default);
    }

    setEditingFee(false);
  }

  function handleSelectPlace(place: PlaceSearchResult) {
    setSelectedPlaceId(place.id);
    setPlaceQuery(place.name);
    setVenueName(place.name);
    setAddress(place.address);
    setPlaceLat(place.lat);
    setPlaceLng(place.lng);
    setPlaceResults([]);
    setIsPlacePickerOpen(false);
    setPlaceSearchError("");
  }

  function handleNext() {
    if (step === 2) {
      setPreviewReferenceNow(Date.now());
    }

    setStep((current) => Math.min(3, current + 1));
  }

  function handleBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function handleNavigateBack() {
    if (step > 1) {
      handleBack();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/home");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (profileCompletionEnabled && !isProfileComplete(resolvedProfile)) {
      pendingSubmitAfterProfileRef.current = true;
      setProfileSheetOpen(true);
      return;
    }

    const resolvedContactValue = contactValue.trim();

    if (!resolvedContactValue) {
      setSubmitError("연결용 오픈채팅 링크를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdMatch = await onCreateListing({
        mode: matchType === "team_match" ? "team" : "solo",
        listing_type: listingType,
        title: venueName.trim(),
        region_slug: "suwon",
        address: address.trim(),
        lat: placeLat ?? SUWON_CENTER.lat,
        lng: placeLng ?? SUWON_CENTER.lng,
        start_at: `${date}T${time}:00`,
        fee: Number(fee),
        total_slots: neededCount,
        remaining_slots: neededCount,
        min_group_size: matchType === "team_match" ? teamFormatPlayers[teamFormat] : 1,
        max_group_size: matchType === "team_match" ? teamFormatPlayers[teamFormat] : 1,
        skill_level: level,
        contact_type: "request_only",
        contact_link: resolvedContactValue,
        note: storedNote,
      });

      startTransition(() => {
        router.push(`/activity?tab=listings&highlight=${createdMatch.id}&flash=created`);
      });
    } catch (createError) {
      if (requiresProfileSetup(createError)) {
        setSubmitError("프로필을 먼저 저장한 뒤 다시 매치를 올려주세요.");
        setProfileSheetOpen(true);
        setIsSubmitting(false);
        return;
      }

      setSubmitError(
        getUserFacingErrorMessage(createError, "매치를 올리지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
      setIsSubmitting(false);
    }
  }

  const ctaConfig: Record<number, { label: string; disabled: boolean }> = {
    1: { label: "시간, 장소 선택하기", disabled: false },
    2: {
      label: "상세 정보 입력하기",
      disabled: !date || !time || !venueName.trim() || !address.trim(),
    },
    3: {
      label: isSubmitting ? "게시 중..." : "매치 올리기",
      disabled: isSubmitting || !contactValue.trim(),
    },
  };
  const cta = ctaConfig[step];
  const previewDistanceKm =
    placeLat !== undefined && placeLng !== undefined
      ? haversineDistance(SUWON_CENTER.lat, SUWON_CENTER.lng, placeLat, placeLng)
      : 0.4;
  const previewMinutesUntilStart = Math.max(
    0,
    Math.round(
      (new Date(previewStartAt).getTime() - (previewReferenceNow ?? new Date(previewStartAt).getTime())) /
        60000,
    ),
  );
  const previewSelectedGroupSize = matchType === "team_match" ? teamFormatPlayers[teamFormat] : 1;
  const previewMatch = useMemo(
    () =>
      ({
        id: "preview-match",
        creator_profile_id: resolvedProfile?.id ?? "preview-user",
        mode: (matchType === "team_match" ? "team" : "solo") as MatchWithMeta["mode"],
        listing_type: listingType,
        title: venueName || "풋살장명",
        region_slug: "suwon",
        address: address || SUWON_LABEL,
        lat: placeLat ?? SUWON_CENTER.lat,
        lng: placeLng ?? SUWON_CENTER.lng,
        start_at: previewStartAt,
        fee,
        total_slots: neededCount,
        remaining_slots: neededCount,
        min_group_size: matchType === "team_match" ? teamFormatPlayers[teamFormat] : 1,
        max_group_size: matchType === "team_match" ? teamFormatPlayers[teamFormat] : 1,
        skill_level: level,
        contact_type: "request_only",
        contact_link: contactValue,
        note: storedNote,
        status: "open",
        region_label: SUWON_LABEL,
        distanceKm: previewDistanceKm,
        minutesUntilStart: previewMinutesUntilStart,
        statusLabel: preview.label,
        statusTone: preview.variant,
        compatibilityScore: 100,
      }) satisfies MatchWithMeta,
    [
      address,
      contactValue,
      resolvedProfile?.id,
      fee,
      level,
      listingType,
      matchType,
      neededCount,
      storedNote,
      placeLat,
      placeLng,
      preview.label,
      preview.variant,
      previewDistanceKm,
      previewMinutesUntilStart,
      previewStartAt,
      teamFormat,
      venueName,
    ],
  );

  return (
    <div className="space-y-2.5 pb-[6.8rem]">
      <section className="surface-card rounded-[2rem] px-5 pb-5 pt-4">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleNavigateBack}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/78 text-[#112317] shadow-[0_12px_30px_rgba(6,21,12,0.05)] transition active:scale-95"
            aria-label="이전 화면으로 돌아가기"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-display text-[1.08rem] font-bold tracking-[0.16em] text-[#112317]">FOOTLINK</span>
          <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736a]">
            Step {step}/3
          </div>
        </div>

        <p className="mt-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
          CREATE MATCH
        </p>
        <h1 className="mt-1.5 text-[1.28rem] font-bold tracking-[-0.04em] text-[#112317]">
          {steps[step - 1].label}
        </h1>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {steps.map((item) => (
            <div key={item.num} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  item.num <= step ? "bg-[#112317]" : "bg-[#dce3dc]"
                }`}
              />
              <p
                className={`text-center text-[10px] font-bold ${
                  item.num === step ? "text-[#112317]" : "text-[#a0a8a2]"
                }`}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <form ref={formRef} className="space-y-2.5" onSubmit={handleSubmit}>
        {step === 1 ? (
          <section
            className={`surface-card rounded-[2rem] px-5 ${
              matchType === "team_match" ? "space-y-3.5 py-5" : "space-y-4.5 py-5"
            }`}
          >
            <div className="rounded-[1.35rem] bg-[#eef2ee] p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: "mercenary" as MatchType, label: "용병 구함" },
                  { value: "team_match" as MatchType, label: "팀 매치" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`rounded-[1.1rem] px-3 py-3.5 text-[14px] font-bold transition ${
                      matchType === type.value
                        ? "bg-[#112317] text-white shadow-[0_14px_28px_rgba(6,21,12,0.14)]"
                        : "text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {matchType === "mercenary" ? (
              <div className="flex flex-col items-center gap-3 py-1">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setNeededCount((count) => Math.max(1, count - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#dce3dc] text-[24px] font-bold text-[#112317] transition active:scale-95"
                  >
                    -
                  </button>
                  <span className="font-display tabular-nums text-[3.1rem] font-bold leading-none tracking-[-0.07em] text-[#112317]">
                    {neededCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNeededCount((count) => Math.min(10, count + 1))}
                    className="kinetic-gradient flex h-12 w-12 items-center justify-center rounded-full text-[24px] font-bold text-white transition active:scale-95"
                  >
                    +
                  </button>
                </div>
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
                  PLAYER
                </p>
              </div>
            ) : null}

            {matchType === "team_match" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {teamFormats.map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setTeamFormat(format)}
                      className={`rounded-[1.1rem] py-2.5 text-center font-display text-[1rem] font-bold tracking-tight transition ${
                        teamFormat === format
                          ? "bg-[#112317] text-white shadow-[0_14px_28px_rgba(6,21,12,0.14)]"
                          : "bg-[#eef2ee] text-foreground"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-2 py-1">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setNeededCount((count) => Math.max(1, count - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#dce3dc] text-[24px] font-bold text-[#112317] transition active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-display tabular-nums text-[3rem] font-bold leading-none tracking-[-0.07em] text-[#112317]">
                      {neededCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNeededCount((count) => Math.min(5, count + 1))}
                    className="kinetic-gradient flex h-12 w-12 items-center justify-center rounded-full text-[24px] font-bold text-white transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
                    TEAM
                  </p>
                </div>
              </div>
            ) : null}

            <div>
              <p className="font-display mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                실력
              </p>
              <div className="grid grid-cols-4 gap-2">
                {SKILL_LEVELS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setLevel(skill)}
                    className={`rounded-full px-3 py-2.5 text-[13px] font-bold transition ${
                      level === skill ? "bg-[#112317] text-white" : "bg-[#eef2ee] text-foreground"
                    }`}
                  >
                    {getSkillLevelLabel(skill)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                {feePreset.unit} 참가비
              </p>
              {!editingFee ? (
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFee((currentFee) => Math.max(feePreset.min, currentFee - feePreset.step))
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#dce3dc] text-[22px] font-bold text-[#112317] transition active:scale-95"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFee(true);
                      setFeeInput(String(fee));
                    }}
                    className="min-w-[108px] text-center text-[1.45rem] font-bold tracking-tight text-[#112317]"
                  >
                    {formatFee(fee)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFee((currentFee) => currentFee + feePreset.step)}
                    className="kinetic-gradient flex h-12 w-12 items-center justify-center rounded-full text-[22px] font-bold text-white transition active:scale-95"
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={feeInput}
                    onChange={(event) => setFeeInput(event.target.value)}
                    placeholder="금액 입력"
                    className="h-11 flex-1 text-center tabular-nums text-base font-bold"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setFee(Number(feeInput) || feePreset.default);
                        setEditingFee(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFee(Number(feeInput) || feePreset.default);
                      setEditingFee(false);
                    }}
                    className="shrink-0 rounded-full bg-[#112317] px-5 py-3 text-sm font-bold text-white"
                  >
                    확인
                  </button>
                </div>
              )}
              {!editingFee ? (
                <p className="mt-2 text-center text-[12px] text-[#a0a8a2]">
                  금액을 누르면 직접 입력할 수 있어요
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="surface-card space-y-3 rounded-[2rem] p-5">
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <label className="min-w-0 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  날짜
                </span>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12 min-w-0 rounded-[1.1rem] px-3 text-[14px]"
                />
              </label>
              <label className="min-w-0 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  시간
                </span>
                <Input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="h-12 min-w-0 rounded-[1.1rem] px-3 text-[14px]"
                />
              </label>
            </div>

            <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  지역
                </span>
                <Input value={SUWON_LABEL} readOnly className="h-12 rounded-[1.1rem] bg-[#e7ece7] text-[#112317]" />
              </label>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  장소 검색
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 w-full rounded-[1.1rem] px-3"
                  onClick={() => {
                    setIsPlacePickerOpen(true);
                    setPlaceSearchError("");
                  }}
                >
                  카카오맵에서 찾기
                </Button>
              </div>
            </div>

            {missingKakaoKeyError || placeSearchError ? (
              <p className="text-sm font-medium text-[#c3342b]">
                {missingKakaoKeyError || placeSearchError}
              </p>
            ) : null}

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                구장 이름
              </span>
              <Input
                value={venueName}
                onChange={(event) => setVenueName(event.target.value)}
                placeholder="검색 결과에서 자동 입력됩니다"
                className="h-12 rounded-[1.1rem]"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                주소
              </span>
              <div className="rounded-[1.2rem] bg-[#eef2ee] px-3.5 py-3">
                <p className={address ? "text-sm leading-5 text-[#112317]" : "text-sm leading-5 text-[#88948c]"}>
                  {address || "장소를 검색하면 주소가 자동으로 채워집니다."}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <>
            <section className="surface-card space-y-3 rounded-[2rem] p-5">              {matchType === "mercenary" ? (
                <div className={`${compactSummaryCardClass} space-y-2.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
                      매치 형식
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {teamFormats.map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setMercenaryFormat(format)}
                        className={`rounded-[0.95rem] px-2 py-2 text-[13px] font-bold transition ${
                          mercenaryFormat === format ? "bg-[#112317] text-white" : "bg-white text-[#112317]"
                        }`}
                      >
                        {formatMatchFormatLabel(format)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <label className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  오픈채팅 링크
                </span>
                <Input
                  type="url"
                  value={contactValue}
                  onChange={(event) => setContactValue(event.target.value)}
                  placeholder="https://open.kakao.com/o/..."
                  className="h-12 rounded-[1.1rem]"
                />
                <p className="text-[11px] leading-4 text-[#6f7c73]">
                  카카오톡 오픈채팅방 공유 링크를 붙여 넣으면 됩니다.
                </p>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  한 줄 메모
                </span>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="예: 밝은 분위기, 정시 시작, 주차 가능"
                  className="min-h-[88px] rounded-[1.2rem] px-3.5 py-3"
                />
              </label>

              {submitError ? (
                <p className="text-sm font-medium text-[#c3342b]">{submitError}</p>
              ) : null}
            </section>

            <section className="space-y-1.5">
              <div className="px-1">
                <p className="text-sm font-semibold text-[#55625a]">미리보기</p>
              </div>
              <div className="origin-top scale-[0.94]">
                <MatchCard
                  match={previewMatch}
                  detailHref="/home"
                  selectedGroupSize={previewSelectedGroupSize}
                  preview
                />
              </div>
            </section>
          </>
        ) : null}
      </form>

      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] px-4 pb-3 pt-2 shadow-[0_-18px_48px_rgba(10,18,13,0.06)]">
        <div className="flex gap-2">
          {step > 1 && step !== 2 ? (
            <Button
              className="h-11 flex-[0.9] rounded-[1rem]"
              size="default"
              type="button"
              variant="secondary"
              onClick={handleBack}
            >
              이전
            </Button>
          ) : null}

          {step < 3 ? (
            <Button
              className={`h-11 rounded-[1rem] disabled:shadow-none disabled:brightness-95 ${
                step === 2 ? "flex-1" : "flex-[1.55]"
              }`}
              size="default"
              type="button"
              disabled={cta.disabled}
              onClick={handleNext}
            >
              {cta.label}
            </Button>
          ) : (
            <Button
              className={`h-11 rounded-[1rem] disabled:shadow-none disabled:brightness-95 ${
                step === 2 ? "flex-1" : "flex-[1.55]"
              }`}
              size="default"
              type="button"
              disabled={cta.disabled}
              onClick={() => formRef.current?.requestSubmit()}
            >
              {cta.label}
            </Button>
          )}
        </div>
      </div>      <ProfileCompletionSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profile={resolvedProfile}
        preferredMode={matchType === "team_match" ? "team" : "solo"}
        regionLabel={SUWON_LABEL}
        confirmLabel="저장하고 매치 올리기"
        onCompleted={(profile) => {
          setResolvedProfile(profile);
          setSubmitError("");

          if (pendingSubmitAfterProfileRef.current) {
            pendingSubmitAfterProfileRef.current = false;
            window.requestAnimationFrame(() => formRef.current?.requestSubmit());
          }
        }}
      />

      {isPlacePickerOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="지도 검색 닫기"
            className="absolute inset-0 bg-[#09110c]/56 backdrop-blur-[3px]"
            onClick={() => setIsPlacePickerOpen(false)}
          />

          <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[430px] -translate-y-1/2 px-4">
            <div className="surface-card rounded-[1.8rem] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                    Kakao Map
                  </p>
                  <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">
                    장소 찾기
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlacePickerOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317] transition active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736a]" />
                  <Input
                    value={placeQuery}
                    onChange={(event) => setPlaceQuery(event.target.value)}
                    className="pl-11"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        runPlaceSearch();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  className="shrink-0 rounded-[1rem] px-4"
                  onClick={runPlaceSearch}
                  disabled={isSearchingPlaces || !placeQuery.trim()}
                >
                  {isSearchingPlaces ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "검색"}
                </Button>
              </div>

              <div
                ref={mapContainerRef}
                className="mt-4 h-[15.5rem] rounded-[1.4rem] bg-[#dde6de]"
              />

              {missingKakaoKeyError || placeSearchError ? (
                <p className="mt-3 text-sm font-medium text-[#c3342b]">
                  {missingKakaoKeyError || placeSearchError}
                </p>
              ) : null}

              <div className="mt-3 max-h-[13rem] space-y-2 overflow-y-auto pr-1 soft-scrollbar">
                {placeResults.map((place) => {
                  const selected = selectedPlaceId === place.id;

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className={`flex w-full flex-col rounded-[1.1rem] px-4 py-3 text-left transition ${
                        selected
                          ? "bg-[#112317] text-white"
                          : "bg-[#eef2ee] text-[#112317] hover:bg-[#e6ece5]"
                      }`}
                    >
                      <span className="text-sm font-bold">{place.name}</span>
                      <span className={`mt-1 text-xs leading-5 ${selected ? "text-white/75" : "text-[#66736a]"}`}>
                        {place.address}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
