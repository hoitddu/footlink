"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PlaceSearchResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

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

const SUWON_CENTER = { lat: 37.2636, lng: 127.0286 };
const KAKAO_SCRIPT_ID = "kakao-map-sdk";
const KAKAO_MAP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
const MAP_READY_TIMEOUT_MS = 2000;

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

export function KakaoPlacePicker({
  initialQuery = "",
  onOpenChange,
  onSelectPlace,
}: {
  initialQuery?: string;
  onOpenChange: (open: boolean) => void;
  onSelectPlace: (place: PlaceSearchResult) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const placesRef = useRef<KakaoPlaces | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  const [placeQuery, setPlaceQuery] = useState(initialQuery);
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState("");
  const [manualEntryEnabled, setManualEntryEnabled] = useState(!KAKAO_MAP_KEY);
  const [manualPlaceName, setManualPlaceName] = useState(initialQuery);
  const [manualAddress, setManualAddress] = useState("");
  const missingKakaoKeyError = !KAKAO_MAP_KEY ? "카카오 지도 키가 설정되지 않았습니다." : "";
  const showMapCanvas = isMapReady || !manualEntryEnabled;

  useEffect(() => {
    if (!KAKAO_MAP_KEY) {
      return;
    }

    if (window.kakao?.maps?.services) {
      window.kakao.maps.load(() => setIsMapReady(true));
      return;
    }

    const existingScript = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => {
      window.kakao?.maps.load(() => setIsMapReady(true));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.onload = handleLoad;
    script.onerror = () => {
      setManualEntryEnabled(true);
      setPlaceSearchError("카카오 지도를 불러오지 못했습니다. 직접 입력으로 계속해 주세요.");
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!KAKAO_MAP_KEY || isMapReady || manualEntryEnabled) {
      return;
    }

    const timer = window.setTimeout(() => {
      setManualEntryEnabled(true);
      setPlaceSearchError("카카오 지도가 아직 준비되지 않았습니다. 직접 입력으로 계속해 주세요.");
    }, MAP_READY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isMapReady, manualEntryEnabled]);

  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current || !window.kakao?.maps) {
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
  }, [isMapReady]);

  function clearMarkers() {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }

  function handleSelectPlace(place: PlaceSearchResult) {
    setSelectedPlaceId(place.id);
    setPlaceResults([]);
    setPlaceSearchError("");
    onSelectPlace(place);
    onOpenChange(false);
  }

  function handleManualPlaceSubmit() {
    const name = manualPlaceName.trim();
    const address = manualAddress.trim();

    if (!name || !address) {
      setPlaceSearchError("경기장 이름과 수원 주소를 모두 입력해 주세요.");
      return;
    }

    if (!address.includes("수원")) {
      setPlaceSearchError("수원 주소만 직접 입력할 수 있습니다.");
      return;
    }

    handleSelectPlace({
      id: `manual-${Date.now()}`,
      name,
      address,
      lat: SUWON_CENTER.lat,
      lng: SUWON_CENTER.lng,
    });
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
      setPlaceSearchError("장소 이름을 먼저 입력해 주세요.");
      return;
    }

    if (!window.kakao?.maps?.services || !placesRef.current) {
      setManualEntryEnabled(true);
      setPlaceSearchError("카카오 지도가 아직 준비되지 않았습니다. 직접 입력으로 계속해 주세요.");
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
          setPlaceSearchError("검색 결과가 없습니다. 다른 키워드로 다시 시도해 주세요.");
          return;
        }

        const results = data.map(normalizeKakaoPlace).slice(0, 8);

        if (results.length === 0) {
          setPlaceResults([]);
          clearMarkers();
          setPlaceSearchError("검색 결과가 없습니다. 다른 키워드로 다시 시도해 주세요.");
          return;
        }

        setPlaceResults(results);
        displayMarkers(results);
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="장소 검색 닫기"
        className="absolute inset-0 bg-[#09110c]/56 backdrop-blur-[3px]"
        onClick={() => onOpenChange(false)}
      />

      <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[430px] -translate-y-1/2 px-4">
        <div className="surface-card max-h-[calc(100vh-2rem)] overflow-hidden rounded-[1.8rem]">
          <div className="soft-scrollbar overflow-y-auto px-4 pb-4 pt-4">
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
                onClick={() => onOpenChange(false)}
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
                  onChange={(event) => {
                    setPlaceQuery(event.target.value);
                    setManualPlaceName(event.target.value);
                  }}
                  className="pl-11"
                  placeholder="경기장 이름 또는 주소 검색"
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
                disabled={isSearchingPlaces || !placeQuery.trim() || !KAKAO_MAP_KEY || !isMapReady}
              >
                {isSearchingPlaces ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "검색"}
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-[#66736a]">
                지도가 늦어지면 직접 입력으로 바로 계속할 수 있습니다.
              </p>
              {manualEntryEnabled ? (
                isMapReady ? (
                  <button
                    type="button"
                    onClick={() => setManualEntryEnabled(false)}
                    className="shrink-0 text-[12px] font-bold text-[#112317]"
                  >
                    지도로 찾기
                  </button>
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => setManualEntryEnabled(true)}
                  className="shrink-0 text-[12px] font-bold text-[#112317]"
                >
                  직접 입력
                </button>
              )}
            </div>

            {showMapCanvas ? (
              <div
                ref={mapContainerRef}
                className="mt-4 h-[15.5rem] rounded-[1.4rem] bg-[#dde6de]"
              />
            ) : (
              <div className="mt-4 rounded-[1.2rem] bg-[#f4f7f3] px-4 py-3 text-sm font-medium text-[#526058]">
                지도 연결을 기다리는 동안에도 장소를 직접 입력해 모집을 계속할 수 있습니다.
              </div>
            )}

            {missingKakaoKeyError || placeSearchError ? (
              <p className="mt-3 text-sm font-medium text-[#c3342b]">
                {missingKakaoKeyError || placeSearchError}
              </p>
            ) : null}

            {manualEntryEnabled ? (
              <div className="mt-4 rounded-[1.2rem] bg-[#f4f7f3] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">
                  Manual Entry
                </p>
                <div className="mt-3 space-y-3">
                  <Input
                    value={manualPlaceName}
                    onChange={(event) => setManualPlaceName(event.target.value)}
                    placeholder="경기장 이름"
                  />
                  <Input
                    value={manualAddress}
                    onChange={(event) => setManualAddress(event.target.value)}
                    placeholder="수원시 영통구..."
                  />
                  <p className="text-xs leading-5 text-[#66736a]">
                    지도 로드가 실패해도 수원 주소를 직접 입력하면 모집 등록을 계속할 수 있습니다.
                  </p>
                  <Button type="button" className="w-full" onClick={handleManualPlaceSubmit}>
                    직접 입력한 장소 선택
                  </Button>
                </div>
              </div>
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
    </div>
  );
}
