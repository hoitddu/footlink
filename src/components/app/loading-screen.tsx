"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRevealProgress(elapsedMs: number, startMs: number, durationMs: number) {
  return clamp((elapsedMs - startMs) / durationMs, 0, 1);
}

function buildRevealStyle(elapsedMs: number, startMs: number, durationMs: number) {
  const reveal = getRevealProgress(elapsedMs, startMs, durationMs);

  return {
    opacity: reveal,
    transform: `translate3d(0, ${Math.round((1 - reveal) * 18)}px, 0)`,
    filter: `blur(${(1 - reveal) * 10}px)`,
  } as const;
}

export function LoadingScreen() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [glowPhase, setGlowPhase] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      setElapsedMs(elapsed);
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
  const ringOpacity = 0.78 + Math.sin(glowPhase * 2.2) * 0.08;
  const fieldGlowOpacity = 0.18 + Math.sin(glowPhase * 1.4) * 0.05;
  const pilotReveal = getRevealProgress(elapsedMs, 220, 560);
  const brandReveal = getRevealProgress(elapsedMs, 360, 720);
  const preparingReveal = getRevealProgress(elapsedMs, 780, 760);
  const supportingReveal = getRevealProgress(elapsedMs, 1080, 680);

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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,17,0.88)_0%,rgba(6,11,19,0.56)_28%,rgba(5,10,15,0.22)_60%,rgba(1,4,6,0.94)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(140,178,226,0.16),transparent_24%),radial-gradient(circle_at_14%_44%,rgba(255,255,255,0.78),transparent_10%),radial-gradient(circle_at_86%_44%,rgba(255,255,255,0.78),transparent_10%),radial-gradient(circle_at_50%_78%,rgba(164,255,61,0.16),transparent_28%)] opacity-90" />
      <div className="absolute left-[-18%] top-[38%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.26)_18%,transparent_60%)] blur-2xl opacity-75" />
      <div className="absolute right-[-18%] top-[38%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.26)_18%,transparent_60%)] blur-2xl opacity-75" />
      <div className="absolute inset-x-0 bottom-[16%] h-[22rem] bg-[radial-gradient(circle_at_50%_0%,rgba(164,255,61,0.24),transparent_52%)] blur-3xl" style={{ opacity: fieldGlowOpacity }} />
      <div className="loading-screen-vignette absolute inset-0" />
      <div className="absolute inset-0 turf-texture opacity-[0.12]" />

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-[max(3.75rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))]">
        <div className="mt-[9vh] flex flex-1 flex-col items-center justify-center">
          <div
            className="relative flex h-[20rem] w-[20rem] items-center justify-center"
            style={buildRevealStyle(elapsedMs, 320, 760)}
          >
            <div className="absolute inset-[13%] rounded-full bg-[radial-gradient(circle,rgba(3,9,12,0.8)_0%,rgba(3,9,12,0.28)_64%,transparent_100%)] backdrop-blur-[2px]" />
            <div className="loading-ring-core absolute inset-[19%] rounded-full" />

            <svg
              viewBox={`0 0 ${ringSize} ${ringSize}`}
              className="loading-ring-shell absolute inset-0 h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="10"
                className="loading-ring-track"
              />
              <g
                className="loading-ring-arc"
                transform={`rotate(-90 ${center} ${center})`}
                style={{ opacity: clamp(ringOpacity + 0.06, 0, 1) }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(164,255,61,0.18)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="402 364"
                  strokeDashoffset="34"
                  className="loading-ring-halo"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="#a4ff3d"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="402 364"
                  strokeDashoffset="34"
                />
              </g>
            </svg>

            <div
              className="relative z-10 flex flex-col items-center justify-center text-center"
              style={{
                opacity: brandReveal,
                transform: `translate3d(0, ${(1 - brandReveal) * 14}px, 0) scale(${0.985 + brandReveal * 0.015})`,
              }}
            >
              <span className="font-display text-[3.55rem] font-medium tracking-[0.16em] text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.34)] sm:text-[3.95rem]">
                FOOTLINK
              </span>
              <span className="mt-4 h-px w-20 bg-[linear-gradient(90deg,transparent,rgba(199,255,112,0.72),transparent)] opacity-80" />
            </div>
          </div>
        </div>

        <div className="mb-[6vh] flex flex-col items-center text-center">
          <p
            className="rounded-full border border-white/8 bg-white/6 px-4 py-2 font-display text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[#c7ee9a] backdrop-blur-md"
            style={buildRevealStyle(elapsedMs, 240, 600)}
          >
            SUWON PILOT
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[1.72rem] font-medium leading-none tracking-[-0.045em] text-[#e4f2cf] sm:text-[1.96rem]">
            <span style={buildRevealStyle(elapsedMs, 760, 480)}>Preparing</span>
            <span style={buildRevealStyle(elapsedMs, 920, 480)}>the</span>
            <span style={buildRevealStyle(elapsedMs, 1080, 520)}>pitch</span>
          </div>
          <p
            className="mt-4 max-w-[18.5rem] text-[0.92rem] leading-6 text-white/52"
            style={{
              opacity: Math.max(supportingReveal, pilotReveal, preparingReveal) * 0.92,
              transform: `translate3d(0, ${(1 - supportingReveal) * 12}px, 0)`,
            }}
          >
            Curating nearby matches, syncing the venue, and warming up your next screen.
          </p>
        </div>
      </main>
    </div>
  );
}
