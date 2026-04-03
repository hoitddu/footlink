"use client";

import { useEffect, useRef } from "react";

interface LocationState {
  lat?: number;
  lng?: number;
  regionSlug: string;
}

const DEFAULT_LOCATION: LocationState = {
  regionSlug: "suwon",
};

export function useLocationPermission(
  onResolved: (location: LocationState) => void,
) {
  const resolved = useRef(false);

  useEffect(() => {
    if (resolved.current) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolved.current = true;
      onResolved(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved.current) return;
        resolved.current = true;
        onResolved({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          regionSlug: "suwon",
        });
      },
      () => {
        if (resolved.current) return;
        resolved.current = true;
        onResolved(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [onResolved]);
}
