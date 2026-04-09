const flashMessages = {
  created: {
    tone: "bg-[#eef2ee] text-[#112317]",
    text: "공석을 올렸습니다. 들어오는 참여 요청을 빠르게 확인해 보세요.",
  },
  requested: {
    tone: "bg-[#fff0d7] text-[#9a6111]",
    text: "참여 요청을 보냈습니다. 응답이 오면 상태가 업데이트됩니다.",
  },
  accepted: {
    tone: "bg-[#dce8ff] text-[#2455a6]",
    text: "호스트가 요청을 확인했습니다. 오픈채팅이나 연락 링크를 확인해 보세요.",
  },
  confirmed: {
    tone: "bg-[#e4f6e8] text-[#1f7a38]",
    text: "참여가 확정됐습니다. 이제 경기 준비만 하면 됩니다.",
  },
  confirmation_cancelled: {
    tone: "bg-[#fff0d7] text-[#9a6111]",
    text: "확정 상태가 해제됐습니다. 다시 호스트와 연락을 확인해 주세요.",
  },
  rejected: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "요청이 마감됐거나 거절됐습니다. 다른 공석을 확인해 보세요.",
  },
  withdrawn: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "참여 요청을 취소했습니다.",
  },
  deleted: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "모집을 마감했습니다.",
  },
} as const;

export function FlashBanner({
  flash,
}: {
  flash?: keyof typeof flashMessages;
}) {
  if (!flash) {
    return null;
  }

  const content = flashMessages[flash];

  if (!content) {
    return null;
  }

  return (
    <p className={`rounded-[1.2rem] px-4 py-3 text-sm font-semibold ${content.tone}`}>
      {content.text}
    </p>
  );
}
