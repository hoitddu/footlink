"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContactTypeLabel } from "@/lib/contact";
import { getRegionLabel } from "@/lib/constants";
import {
  getParticipationContactActions,
  getParticipationStatusLabel,
  getParticipationStatusTone,
  getParticipationSummary,
} from "@/lib/demo-state/selectors";
import type {
  DemoAppState,
  Match,
  ParticipationRequest,
  Profile,
} from "@/lib/types";

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

export function RequestStatusCard({
  state,
  match,
  request,
  host,
  highlighted = false,
  onWithdraw,
  withdrawPending = false,
}: {
  state: DemoAppState;
  match: Match;
  request: ParticipationRequest;
  host?: Profile;
  highlighted?: boolean;
  onWithdraw?: () => void;
  withdrawPending?: boolean;
}) {
  const contactActions = getParticipationContactActions(state, request);
  const canWithdraw = request.status === "pending";
  const contactFlowLabel =
    request.entry_channel === "request_only"
      ? "앱에서 조율"
      : `${getContactTypeLabel(request.entry_channel)} 연락`;

  return (
    <article
      className={`surface-card rounded-[1.5rem] p-5 transition ${
        highlighted ? "ring-2 ring-[#b8ff5a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {getParticipationSummary(request)} ·{" "}
            {formatCreatedAt(request.created_at)}
          </p>
        </div>
        <Badge variant={getParticipationStatusTone(request.status)}>
          {getParticipationStatusLabel(request.status)}
        </Badge>
      </div>

      {request.message ? (
        <p className="mt-3 whitespace-pre-line rounded-[1rem] bg-[#f7f9f7] px-4 py-3 text-sm leading-6 text-[#415047]">
          {request.message}
        </p>
      ) : null}

      <div className="mt-3 space-y-1 text-sm text-muted">
        <p>호스트 · {host?.nickname ?? "FootLink 호스트"}</p>
        <p>참여 흐름: 요청 후 수락, {contactFlowLabel}, 최종 확정</p>
        <p>지역 · {getRegionLabel(match.region_slug)}</p>
        {request.host_note ? <p>호스트 메모: {request.host_note}</p> : null}
      </div>

      {contactActions.length > 0 || canWithdraw ? (
        <div className="mt-4 flex gap-1.5">
          {contactActions.map((action) => (
            <Button
              key={action.kind}
              asChild
              className="h-9 flex-1 rounded-[0.95rem] px-3 text-[13px]"
              size="sm"
              variant="secondary"
            >
              <a
                href={action.href}
                rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                target={action.href.startsWith("http") ? "_blank" : undefined}
              >
                {action.label}
              </a>
            </Button>
          ))}
          {canWithdraw ? (
            <Button
              className="h-9 flex-1 rounded-[0.95rem] px-3 text-[13px]"
              size="sm"
              type="button"
              variant="secondary"
              onClick={onWithdraw}
              disabled={withdrawPending}
            >
              {withdrawPending ? "요청 취소 중..." : "요청 취소"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
