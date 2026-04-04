"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getParticipationStatusLabel,
  getParticipationStatusTone,
  getParticipationSummary,
  getProfileById,
} from "@/lib/demo-state/selectors";
import type { DemoAppState, Match, ParticipationRequest } from "@/lib/types";
import { formatAgeBand, formatSkillLevel } from "@/lib/utils";

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

type PendingRequestAction = {
  requestId: string;
  kind: "accept" | "reject" | "confirm";
} | null;

export function HostListingCard({
  state,
  match,
  requests,
  highlighted = false,
  onAccept,
  onConfirm,
  onDelete,
  onReject,
  pendingRequestAction = null,
  deletePending = false,
}: {
  state: DemoAppState;
  match: Match;
  requests: ParticipationRequest[];
  highlighted?: boolean;
  onAccept: (requestId: string) => void;
  onConfirm: (requestId: string) => void;
  onDelete: () => void;
  onReject: (requestId: string) => void;
  pendingRequestAction?: PendingRequestAction;
  deletePending?: boolean;
}) {
  const hasLockedRequest = requests.some((request) =>
    ["accepted", "confirmed"].includes(request.status),
  );

  function isRequestPending(requestId: string, kind: "accept" | "reject" | "confirm") {
    return pendingRequestAction?.requestId === requestId && pendingRequestAction.kind === kind;
  }

  return (
    <article
      className={`surface-card rounded-[1.5rem] p-5 transition ${
        highlighted ? "ring-2 ring-[#b8ff5a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-[-0.03em] text-[#112317]">{match.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {match.mode === "team" ? "상대 팀 1팀 모집" : `남은 자리 ${match.remaining_slots}명`}
          </p>
        </div>
        <Badge variant={match.status === "matched" ? "success" : match.mode === "team" ? "team" : "soon"}>
          {match.status === "matched"
            ? "모집 완료"
            : match.mode === "team"
              ? "팀 매치"
              : `${match.remaining_slots}명 모집`}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={hasLockedRequest || deletePending || pendingRequestAction !== null}
        >
          {deletePending ? "삭제 중..." : "삭제"}
        </Button>
      </div>

      {hasLockedRequest ? (
        <p className="mt-2 text-sm text-muted">
          조율 중이거나 최종 확정된 참가자가 있으면 모집을 삭제할 수 없습니다.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-[1rem] bg-[#f7f9f7] px-4 py-4 text-sm text-muted">
            아직 들어온 참가 요청이 없습니다.
          </div>
        ) : (
          requests.map((request) => {
            const requester = getProfileById(state, request.requester_profile_id);
            const canAccept = request.status === "pending";
            const canConfirm = request.status === "accepted";
            const acceptPending = isRequestPending(request.id, "accept");
            const rejectPending = isRequestPending(request.id, "reject");
            const confirmPending = isRequestPending(request.id, "confirm");
            const isActionPending =
              acceptPending || rejectPending || confirmPending || deletePending;

            return (
              <div key={request.id} className="rounded-[1.2rem] bg-[#f7f9f7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#112317]">
                      {requester?.nickname ?? "알 수 없는 유저"} · {getParticipationSummary(request, match)}
                    </p>
                    <p className="mt-1 text-sm text-muted">{formatCreatedAt(request.created_at)}</p>
                    {requester ? (
                      <p className="mt-2 text-sm font-medium text-[#536157]">
                        실력 {formatSkillLevel(requester.skill_level)} · {formatAgeBand(requester.age)}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={getParticipationStatusTone(request.status)}>
                    {getParticipationStatusLabel(request.status)}
                  </Badge>
                </div>

                {request.message ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#415047]">
                    {request.message}
                  </p>
                ) : null}

                {request.host_note ? (
                  <p className="mt-2 text-sm font-medium text-[#536157]">
                    메모: {request.host_note}
                  </p>
                ) : null}

                {canAccept ? (
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      type="button"
                      onClick={() => onAccept(request.id)}
                      disabled={
                        isActionPending ||
                        match.remaining_slots < request.requested_count ||
                        match.status !== "open"
                      }
                    >
                      {acceptPending ? "수락 중..." : "수락"}
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={() => onReject(request.id)}
                      disabled={isActionPending}
                    >
                      {rejectPending ? "거절 중..." : "거절"}
                    </Button>
                  </div>
                ) : null}

                {canConfirm ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted">
                      오픈채팅에서 이야기한 뒤 최종 참가가 맞으면 확정하세요.
                    </p>
                    <Button
                      className="w-full"
                      size="sm"
                      type="button"
                      onClick={() => onConfirm(request.id)}
                      disabled={isActionPending}
                    >
                      {confirmPending ? "최종 확정 중..." : "최종 확정"}
                    </Button>
                  </div>
                ) : null}

                {request.status === "confirmed" ? (
                  <p className="mt-4 text-sm font-medium text-[#1f7a38]">
                    최종 확정된 참가자입니다.
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
