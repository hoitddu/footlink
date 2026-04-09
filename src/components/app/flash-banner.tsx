const flashMessages = {
  saved: {
    tone: "bg-[#edf2ea] text-[#112317] ring-1 ring-[#112317]/6",
    text: "저장되었습니다.",
  },
  created: {
    tone: "bg-[#edf2ea] text-[#112317] ring-1 ring-[#112317]/6",
    text: "용병 모집이 게시되었습니다. 들어오는 참여 요청을 빠르게 확인해 보세요.",
  },
  requested: {
    tone: "bg-[#efe4c5] text-[#7b6020] ring-1 ring-[#7b6020]/10",
    text: "참여 요청을 보냈습니다. 응답이 오면 상태가 업데이트됩니다.",
  },
  accepted: {
    tone: "bg-[#e6eee4] text-[#365341] ring-1 ring-[#365341]/10",
    text: "호스트가 요청을 수락했습니다. 연락 후 확정 여부를 정하면 됩니다.",
  },
  confirmed: {
    tone: "bg-[#dfede0] text-[#295d3a] ring-1 ring-[#295d3a]/10",
    text: "참여가 확정됐습니다. 이제 경기 준비만 하면 됩니다.",
  },
  confirmation_cancelled: {
    tone: "bg-[#efe4c5] text-[#7b6020] ring-1 ring-[#7b6020]/10",
    text: "확정 상태가 해제됐습니다. 다시 호스트와 연락을 확인해 주세요.",
  },
  rejected: {
    tone: "bg-[#f2ece8] text-[#69554f] ring-1 ring-[#69554f]/8",
    text: "요청이 마감됐거나 거절됐습니다. 다른 공석을 확인해 보세요.",
  },
  withdrawn: {
    tone: "bg-[#f2ece8] text-[#69554f] ring-1 ring-[#69554f]/8",
    text: "참여 요청을 취소했습니다.",
  },
  cleared: {
    tone: "bg-[#edf2ea] text-[#112317] ring-1 ring-[#112317]/6",
    text: "참여 요청 기록을 삭제했습니다.",
  },
  deleted: {
    tone: "bg-[#f2ece8] text-[#69554f] ring-1 ring-[#69554f]/8",
    text: "모집을 마감했습니다.",
  },
} as const;

export function FlashBanner({
  flash,
  placement = "top",
  durationMs = 2400,
}: {
  flash?: keyof typeof flashMessages;
  placement?: "top" | "bottom" | "cta";
  durationMs?: number;
}) {
  if (!flash) {
    return null;
  }

  const content = flashMessages[flash];

  if (!content) {
    return null;
  }

  return (
    <p
      className={`fixed left-1/2 z-[70] w-[calc(100%-2rem)] max-w-[24.9rem] -translate-x-1/2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold shadow-[0_18px_42px_rgba(8,18,12,0.12)] ${
        placement === "bottom"
          ? "bottom-[calc(var(--app-bottom-nav-visual-height)+env(safe-area-inset-bottom)+1rem)]"
          : placement === "cta"
            ? "bottom-[calc(env(safe-area-inset-bottom)+6.6rem)]"
            : "top-[calc(env(safe-area-inset-top)+1rem)]"
      } ${content.tone}`}
      style={{
        animation:
          placement === "top"
            ? `flash-toast ${durationMs}ms ease forwards`
            : `flash-toast-bottom ${durationMs}ms ease forwards`,
      }}
    >
      {content.text}
    </p>
  );
}
