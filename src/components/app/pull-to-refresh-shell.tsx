"use client";

import { ArrowDown, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type TouchEvent } from "react";

import { cn } from "@/lib/utils";

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 96;

function shouldIgnorePullTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-no-pull-refresh]"));
}

export function PullToRefreshShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRefreshing || isPending) {
      return;
    }

    finishTimerRef.current = setTimeout(() => {
      setPullDistance(0);
      setIsArmed(false);
      setIsRefreshing(false);
    }, 260);
  }, [isPending, isRefreshing]);

  function resetPullState() {
    startYRef.current = null;
    startXRef.current = null;
    draggingRef.current = false;
    setPullDistance(0);
    setIsArmed(false);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1 || isRefreshing || window.scrollY > 0 || shouldIgnorePullTarget(event.target)) {
      return;
    }

    startYRef.current = event.touches[0]?.clientY ?? null;
    startXRef.current = event.touches[0]?.clientX ?? null;
    draggingRef.current = false;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (isRefreshing || startYRef.current === null || startXRef.current === null) {
      return;
    }

    if (window.scrollY > 0) {
      resetPullState();
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    const deltaY = touch.clientY - startYRef.current;
    const deltaX = touch.clientX - startXRef.current;

    if (deltaY <= 0) {
      resetPullState();
      return;
    }

    if (!draggingRef.current) {
      if (Math.abs(deltaX) > deltaY) {
        return;
      }

      draggingRef.current = true;
    }

    event.preventDefault();

    const nextPullDistance = Math.min(MAX_PULL_DISTANCE, Math.round(deltaY * 0.52));
    setPullDistance(nextPullDistance);
    setIsArmed(nextPullDistance >= REFRESH_THRESHOLD);
  }

  function handleTouchEnd() {
    if (!draggingRef.current) {
      startYRef.current = null;
      startXRef.current = null;
      return;
    }

    startYRef.current = null;
    startXRef.current = null;
    draggingRef.current = false;

    if (pullDistance < REFRESH_THRESHOLD || isRefreshing) {
      setPullDistance(0);
      setIsArmed(false);
      return;
    }

    setPullDistance(REFRESH_THRESHOLD - 8);
    setIsRefreshing(true);
    setIsArmed(false);

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
    }

    finishTimerRef.current = setTimeout(() => {
      setPullDistance(0);
      setIsRefreshing(false);
      setIsArmed(false);
    }, 1600);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="relative overscroll-y-contain"
      onTouchCancel={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center justify-center transition-all duration-200",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0",
        )}
        style={{
          transform: `translate(-50%, ${Math.max(10, pullDistance * 0.24)}px)`,
        }}
      >
        <div className="surface-panel flex min-w-[8.6rem] items-center justify-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold text-[#445149] shadow-[0_10px_24px_rgba(8,18,12,0.08)]">
          {isRefreshing ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-[#112317]" />
          ) : (
            <ArrowDown className={cn("h-4 w-4 text-[#112317] transition-transform", isArmed && "rotate-180")} />
          )}
          <span>{isRefreshing ? "새로고침 중..." : isArmed ? "놓으면 새로고침" : "아래로 당겨 새로고침"}</span>
        </div>
      </div>

      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 || isRefreshing ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
