"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRegionLabel } from "@/lib/constants";
import {
  getParticipationContactLink,
  getParticipationStatusLabel,
  getParticipationStatusTone,
  getParticipationSummary,
} from "@/lib/demo-state/selectors";
import type { DemoAppState, Match, ParticipationRequest, Profile } from "@/lib/types";

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
}: {
  state: DemoAppState;
  match: Match;
  request: ParticipationRequest;
  host?: Profile;
  highlighted?: boolean;
  onWithdraw?: () => void;
}) {
  const contactLink = getParticipationContactLink(state, request);
  const canWithdraw = request.status === "pending";

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
            {getParticipationSummary(request, match)} · {formatCreatedAt(request.created_at)}
          </p>
        </div>
        <Badge variant={getParticipationStatusTone(request.status)}>
          {getParticipationStatusLabel(request.status)}
        </Badge>
      </div>

      {request.message ? (
        <p className="mt-3 rounded-[1rem] bg-[#f7f9f7] px-4 py-3 text-sm leading-6 text-[#415047]">
          {request.message}
        </p>
      ) : null}

      <div className="mt-3 space-y-1 text-sm text-muted">
        <p>호스트: {host?.nickname ?? "FootLink 호스트"}</p>
        <p>참여 방식: {request.entry_channel === "openchat" ? "오픈채팅" : "참가 요청"}</p>
        <p>지역: {getRegionLabel(match.region_slug)}</p>
        {request.host_note ? <p>호스트 메모: {request.host_note}</p> : null}
      </div>

      {contactLink || canWithdraw ? (
        <div className="mt-4 flex gap-2">
          {contactLink ? (
            <Button asChild className="flex-1" size="sm">
              <Link href={contactLink.href} rel="noreferrer" target="_blank">
                {contactLink.label}
              </Link>
            </Button>
          ) : null}
          {canWithdraw ? (
            <Button className="flex-1" size="sm" type="button" variant="secondary" onClick={onWithdraw}>
              요청 취소
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
