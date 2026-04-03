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

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function HostListingCard({
  state,
  match,
  requests,
  highlighted = false,
  onAccept,
  onReject,
}: {
  state: DemoAppState;
  match: Match;
  requests: ParticipationRequest[];
  highlighted?: boolean;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}) {
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
            {match.mode === "team" ? "상대 팀 1팀 모집" : `남은 자리 ${match.needed_count}명`}
          </p>
        </div>
        <Badge variant={match.status === "matched" ? "success" : match.mode === "team" ? "team" : "soon"}>
          {match.status === "matched" ? "모집 완료" : match.mode === "team" ? "팀 매치" : `${match.needed_count}명 모집`}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-[1rem] bg-[#f7f9f7] px-4 py-4 text-sm text-muted">
            아직 들어온 요청이 없습니다.
          </div>
        ) : (
          requests.map((request) => {
            const requester = getProfileById(state, request.requester_id);
            const actionable = request.status === "pending" || request.status === "chat_entered";

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
                        실력 {requester.skill_level} · {requester.age}세
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={getParticipationStatusTone(request.status)}>
                    {getParticipationStatusLabel(request.status)}
                  </Badge>
                </div>

                {request.message ? (
                  <p className="mt-3 text-sm leading-6 text-[#415047]">{request.message}</p>
                ) : null}

                {request.host_note ? (
                  <p className="mt-2 text-sm font-medium text-[#536157]">메모: {request.host_note}</p>
                ) : null}

                {actionable ? (
                  <div className="mt-4 flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      type="button"
                      onClick={() => onAccept(request.id)}
                      disabled={match.needed_count < request.requested_count || match.status !== "open"}
                    >
                      수락
                    </Button>
                    <Button
                      className="flex-1"
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={() => onReject(request.id)}
                    >
                      거절
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
