const flashMessages = {
  created: {
    tone: "bg-[#eef2ee] text-[#112317]",
    text: "매치를 올렸습니다. 들어온 참가 요청을 활동에서 바로 확인해 보세요.",
  },
  requested: {
    tone: "bg-[#fff0d7] text-[#9a6111]",
    text: "참가 요청을 보냈습니다. 호스트가 확인하면 상태가 업데이트됩니다.",
  },
  accepted: {
    tone: "bg-[#dce8ff] text-[#2455a6]",
    text: "호스트가 요청을 수락했습니다. 오픈채팅에서 자세한 내용을 조율해 보세요.",
  },
  confirmed: {
    tone: "bg-[#e4f6e8] text-[#1f7a38]",
    text: "참가가 최종 확정됐습니다. 활동에서 오픈채팅방으로 바로 이동할 수 있습니다.",
  },
  confirmation_cancelled: {
    tone: "bg-[#fff0d7] text-[#9a6111]",
    text: "최종 확정이 해제되었습니다. 오픈채팅에서 조율을 이어가세요.",
  },
  rejected: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "요청이 거절되었습니다. 다른 매치를 찾아보세요.",
  },
  withdrawn: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "참가 요청을 취소했습니다.",
  },
  deleted: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "모집을 삭제했습니다.",
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
