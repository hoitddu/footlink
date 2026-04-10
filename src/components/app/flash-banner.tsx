"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type FlashTone = "success" | "warning" | "neutral";

const flashMessages = {
  saved: {
    tone: "success" as FlashTone,
    text: "저장되었습니다.",
  },
  created: {
    tone: "success" as FlashTone,
    text: "용병 모집이 게시되었습니다.",
  },
  requested: {
    tone: "warning" as FlashTone,
    text: "참여 요청을 보냈습니다. 응답이 오면 상태가 업데이트됩니다.",
  },
  accepted: {
    tone: "success" as FlashTone,
    text: "호스트가 요청을 수락했습니다. 연락 후 확정 여부를 정하면 됩니다.",
  },
  confirmed: {
    tone: "success" as FlashTone,
    text: "참여가 확정됐습니다. 이제 경기 준비만 하면 됩니다.",
  },
  confirmation_cancelled: {
    tone: "warning" as FlashTone,
    text: "확정 상태가 해제됐습니다. 다시 호스트와 연락을 확인해 주세요.",
  },
  rejected: {
    tone: "neutral" as FlashTone,
    text: "요청이 마감됐거나 거절됐습니다. 다른 공석을 확인해 보세요.",
  },
  withdrawn: {
    tone: "neutral" as FlashTone,
    text: "참여 요청을 취소했습니다.",
  },
  cleared: {
    tone: "success" as FlashTone,
    text: "참여 요청 기록을 삭제했습니다.",
  },
  deleted: {
    tone: "neutral" as FlashTone,
    text: "모집을 마감했습니다.",
  },
} as const;

const toneStyles: Record<
  FlashTone,
  { container: string; icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    container: "bg-[#112317] text-[#e0f0d8]",
    icon: Check,
  },
  warning: {
    container: "bg-[#3d2e0a] text-[#f0dfa6]",
    icon: AlertCircle,
  },
  neutral: {
    container: "bg-[#2a2520] text-[#d8cfc8]",
    icon: Info,
  },
};

export function FlashBanner({
  flash,
  placement = "top",
  durationMs = 2400,
}: {
  flash?: keyof typeof flashMessages;
  placement?: "top" | "bottom" | "cta";
  durationMs?: number;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!flash) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [durationMs, flash]);

  if (!flash) {
    return null;
  }

  const content = flashMessages[flash];

  if (!content || !isVisible) {
    return null;
  }

  const isFloating = placement === "top" || placement === "bottom";
  const style = toneStyles[content.tone];
  const Icon = style.icon;

  return (
    <div
      aria-live="polite"
      role="status"
      className={cn(
        "flex items-center gap-2.5 rounded-[1.05rem] px-3.5 py-3 text-[13px] font-semibold leading-5 shadow-[0_18px_42px_rgba(8,18,12,0.18)]",
        isFloating
          ? "fixed left-1/2 z-[70] w-[calc(100%-2rem)] max-w-[24.9rem] -translate-x-1/2"
          : "z-10 w-full",
        placement === "bottom"
          ? "bottom-[calc(var(--app-bottom-nav-visual-height)+env(safe-area-inset-bottom)+1rem)]"
          : placement === "top"
            ? "top-[calc(env(safe-area-inset-top)+1rem)]"
            : "",
        style.container,
      )}
      style={{
        animation: isFloating
          ? placement === "top"
            ? `flash-toast ${durationMs}ms ease forwards`
            : `flash-toast-bottom ${durationMs}ms ease forwards`
          : `flash-cta ${durationMs}ms ease forwards`,
      }}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-3 w-3" />
      </span>
      <span className="min-w-0">{content.text}</span>
    </div>
  );
}
