"use client";

import { useEffect, useState } from "react";

import { LoadingScreen } from "@/components/app/loading-screen";
import { EntryFlow } from "@/components/entry/entry-flow";

const MIN_SPLASH_MS = 850;

export function EntrySplashGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReady(true);
    }, MIN_SPLASH_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <EntryFlow />;
}
