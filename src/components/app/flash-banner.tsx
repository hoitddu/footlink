const flashMessages = {
  created: {
    tone: "bg-[#eef2ee] text-[#112317]",
    text: "매치를 올렸습니다. 들어온 요청을 바로 확인해보세요.",
  },
  requested: {
    tone: "bg-[#fff0d7] text-[#9a6111]",
    text: "참가 요청을 보냈습니다. 호스트가 확인하면 상태가 업데이트됩니다.",
  },
  chat_entered: {
    tone: "bg-[#eef6ff] text-[#2455a6]",
    text: "오픈채팅에 입장했습니다. 앱에서는 아직 호스트 승인 대기 상태예요.",
  },
  accepted: {
    tone: "bg-[#e4f6e8] text-[#1f7a38]",
    text: "요청이 수락됐습니다. 내 요청에서 오픈채팅방 접속 버튼을 눌러 대화를 시작하세요.",
  },
  rejected: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "요청이 거절되었습니다. 다른 매치를 찾아보세요.",
  },
  withdrawn: {
    tone: "bg-[#f6f1f0] text-[#6b5852]",
    text: "참가 요청을 취소했습니다.",
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
