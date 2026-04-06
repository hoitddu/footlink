"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const PROGRESS_STOPS = [
  { time: 0, value: 0 },
  { time: 420, value: 8 },
  { time: 980, value: 27 },
  { time: 1680, value: 52 },
  { time: 2460, value: 76 },
  { time: 3300, value: 90 },
  { time: 4700, value: 96 },
  { time: 6200, value: 99 },
] as const;

function getProgressAt(elapsedMs: number) {
  for (let index = 0; index < PROGRESS_STOPS.length - 1; index += 1) {
    const current = PROGRESS_STOPS[index];
    const next = PROGRESS_STOPS[index + 1];

    if (elapsedMs <= next.time) {
      const range = next.time - current.time;
      const ratio = range === 0 ? 1 : (elapsedMs - current.time) / range;
      return current.value + (next.value - current.value) * ratio;
    }
  }

  return PROGRESS_STOPS[PROGRESS_STOPS.length - 1].value;
}

function getRevealProgress(progress: number, start: number, spread = 18) {
  return clamp((progress - start) / spread, 0, 1);
}

function buildRevealStyle(progress: number, start: number, spread?: number) {
  const reveal = getRevealProgress(progress, start, spread);

  return {
    opacity: reveal,
    transform: `translate3d(0, ${Math.round((1 - reveal) * 18)}px, 0)`,
    filter: `blur(${(1 - reveal) * 10}px)`,
  } as const;
}

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [glowPhase, setGlowPhase] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      setProgress(getProgressAt(elapsed));
      setGlowPhase(elapsed / 1000);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const ringSize = 320;
  const center = ringSize / 2;
  const radius = 122;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);
  const angle = (progress / 100) * Math.PI * 2 - Math.PI / 2;
  const markerX = center + Math.cos(angle) * radius;
  const markerY = center + Math.sin(angle) * radius;
  const ringOpacity = 0.78 + Math.sin(glowPhase * 2.2) * 0.08;
  const fieldGlowOpacity = 0.18 + Math.sin(glowPhase * 1.4) * 0.05;
  const statusReveal = getRevealProgress(progress, 14, 20);
  const percentReveal = getRevealProgress(progress, 8, 14);

  const progressLabel = useMemo(() => `${Math.round(progress).toString().padStart(2, "0")}%`, [progress]);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#04070d] text-white">
      <Image
        src="/landing-bg.webp"
        alt=""
        fill
        priority
        sizes="430px"
        className="absolute inset-0 scale-[1.06] object-cover object-center brightness-[0.58] saturate-[0.72]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,17,0.86)_0%,rgba(6,11,19,0.52)_30%,rgba(5,10,15,0.2)_62%,rgba(1,4,6,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(140,178,226,0.2),transparent_24%),radial-gradient(circle_at_14%_44%,rgba(255,255,255,0.82),transparent_11%),radial-gradient(circle_at_86%_44%,rgba(255,255,255,0.82),transparent_11%),radial-gradient(circle_at_50%_78%,rgba(164,255,61,0.2),transparent_28%)] opacity-90" />
      <div className="absolute left-[-18%] top-[38%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.26)_18%,transparent_60%)] blur-2xl opacity-75" />
      <div className="absolute right-[-18%] top-[38%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.26)_18%,transparent_60%)] blur-2xl opacity-75" />
      <div className="absolute inset-x-0 bottom-[16%] h-[22rem] bg-[radial-gradient(circle_at_50%_0%,rgba(164,255,61,0.24),transparent_52%)] blur-3xl" style={{ opacity: fieldGlowOpacity }} />
      <div className="absolute inset-0 turf-texture opacity-[0.12]" />

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-[max(3.5rem,env(safe-area-inset-bottom))] pt-16">
        <div className="mt-[10vh] flex flex-1 flex-col items-center justify-center">
          <div className="relative flex h-[20rem] w-[20rem] items-center justify-center">
            <div className="absolute inset-[13%] rounded-full bg-[radial-gradient(circle,rgba(3,9,12,0.78)_0%,rgba(3,9,12,0.22)_68%,transparent_100%)] backdrop-blur-[1px]" />

            <svg
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="loading-ring-shell absolute inset-0 h-full w-full -rotate-90 overflow-visible"
              aria-hidden="true"
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="10"
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(164,255,61,0.2)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                style={{ filter: "blur(10px)", opacity: ringOpacity }}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#a4ff3d"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                style={{ opacity: clamp(ringOpacity + 0.1, 0, 1) }}
              />
            </svg>

            <div
              className="absolute h-4 w-4 rounded-full bg-[#c7ff70] blur-[1px]"
              style={{
                left: markerX,
                top: markerY,
                transform: "translate(-50%, -50%)",
                boxShadow: "0 0 24px rgba(164,255,61,0.9), 0 0 44px rgba(164,255,61,0.42)",
                opacity: clamp(progress / 16, 0, 1),
              }}
            />

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="font-display text-[3.8rem] font-medium tracking-[0.18em] text-white drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] sm:text-[4.2rem]">
                FOOTLINK
              </span>
              <span
                className="mt-3 font-display text-[0.9rem] font-medium tracking-[0.42em] text-white/62 tabular-nums"
                style={{
                  opacity: percentReveal,
                  transform: `translate3d(0, ${(1 - percentReveal) * 8}px, 0)`,
                }}
              >
                {progressLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-[6vh] flex flex-col items-center text-center">
          <p
            className="font-display text-[0.86rem] font-medium uppercase tracking-[0.34em] text-[#c7ee9a]"
            style={buildRevealStyle(progress, 10, 18)}
          >
            SUWON PILOT
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[2.1rem] font-medium leading-none tracking-[-0.05em] text-[#daf3b4] sm:text-[2.35rem]">
            <span style={buildRevealStyle(progress, 20, 16)}>Preparing</span>
            <span style={buildRevealStyle(progress, 32, 16)}>the</span>
            <span style={buildRevealStyle(progress, 46, 18)}>pitch...</span>
          </div>
          <p
            className="mt-4 max-w-[18rem] text-[0.95rem] leading-6 text-white/58"
            style={{
              opacity: statusReveal * 0.92,
              transform: `translate3d(0, ${(1 - statusReveal) * 12}px, 0)`,
            }}
          >
            Matching your route, checking the turf, and warming up the next screen.
          </p>
        </div>
      </main>
    </div>
  );
}
