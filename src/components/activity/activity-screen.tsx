"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cancelMatchAction } from "@/app/actions/matches";
import {
  acceptParticipationAction,
  confirmParticipationAction,
  dismissParticipationRequestAction,
  rejectParticipationAction,
  withdrawParticipationAction,
} from "@/app/actions/requests";
import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { FlashBanner } from "@/components/app/flash-banner";
import { ScreenHeader } from "@/components/app/screen-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatAgeBand, formatFee, formatSkillLevel, formatSportType, formatStartAt, formatTimeRange } from "@/lib/utils";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getHostedMatches,
  getInboundRequestsForMatch,
  getMyParticipationRequests,
  getParticipationContactLink,
  getParticipationStatusLabel,
  getParticipationStatusTone,
  getParticipationSummary,
  getProfileById,
} from "@/lib/demo-state/selectors";
import { getUserFacingErrorMessage } from "@/lib/errors";
import type { DemoAppState, Match, ParticipationRequest } from "@/lib/types";

type ActivityTab = "requests" | "listings";
type ActivityFlash =
  | "created"
  | "requested"
  | "accepted"
  | "confirmed"
  | "rejected"
  | "withdrawn"
  | "cleared"
  | "deleted";
type PendingActivityAction =
  | { targetId: string; kind: "withdraw" | "accept" | "confirm" | "reject" | "delete" | "dismiss" }
  | null;

function isOpenRequest(request: ParticipationRequest) {
  return ["pending", "accepted", "confirmed"].includes(request.status);
}

function isDismissibleRequest(request: ParticipationRequest) {
  return ["rejected", "withdrawn", "expired"].includes(request.status);
}

function formatPrimaryMeta(match: Match) {
  return `${formatStartAt(match.start_at)} · ${formatFee(match.fee)}`;
}

function formatSecondaryMeta(match: Match) {
  return `${formatTimeRange(match.start_at, match.duration_minutes)} · ${match.address}`;
}

function ActivityTabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[3.25rem] items-center justify-between gap-3 rounded-[1.1rem] px-4 py-3 text-left transition",
        active ? "bg-[#112317] text-white shadow-[0_16px_30px_rgba(6,21,12,0.16)]" : "bg-[#eef2ee] text-[#112317]",
      )}
    >
      <span className="text-sm font-bold tracking-[-0.02em]">{label}</span>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-bold",
          active ? "bg-white/14 text-white" : "bg-white text-[#4f5e55]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function MyJoinCard({
  state,
  match,
  request,
  highlighted,
  onWithdraw,
  withdrawPending,
}: {
  state: DemoAppState;
  match: Match;
  request: ParticipationRequest;
  highlighted: boolean;
  onWithdraw: () => void;
  withdrawPending: boolean;
}) {
  const host = getProfileById(state, request.host_profile_id);
  const contactLink = getParticipationContactLink(state, request);
  const canWithdraw = request.status === "pending";

  return (
    <article
      className={cn(
        "surface-card rounded-[1.45rem] p-4 transition",
        highlighted && "ring-2 ring-[#b8ff5a]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getParticipationStatusTone(request.status)}>
              {getParticipationStatusLabel(request.status)}
            </Badge>
            <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#445149]">
              {formatSportType(match.sport_type ?? "futsal")}
            </span>
          </div>
          <h3 className="mt-2 truncate text-[1.02rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#66736a]">{formatPrimaryMeta(match)}</p>
          <p className="mt-1 truncate text-[13px] text-[#66736a]">{formatSecondaryMeta(match)}</p>
          <p className="mt-1 text-[12px] font-medium text-[#55625a]">
            {host?.nickname ?? "FootLink Host"} · {getParticipationSummary(request)}
          </p>
        </div>
      </div>

      {request.host_note ? (
        <p className="mt-3 rounded-[1rem] bg-[#f4f7f3] px-3.5 py-3 text-[13px] leading-6 text-[#445149]">
          {request.host_note}
        </p>
      ) : null}

      {contactLink || canWithdraw ? (
        <div className="mt-3 flex gap-2">
          {contactLink ? (
            <Button asChild className="flex-1" size="sm">
              <a
                href={contactLink.href}
                rel={contactLink.href.startsWith("http") ? "noreferrer" : undefined}
                target={contactLink.href.startsWith("http") ? "_blank" : undefined}
              >
                {contactLink.label}
              </a>
            </Button>
          ) : null}
          {canWithdraw ? (
            <Button
              className={cn(!contactLink && "flex-1")}
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

function ClosedRequestRow({
  match,
  request,
  highlighted,
  dismissPending,
  onDismiss,
}: {
  match: Match;
  request: ParticipationRequest;
  highlighted: boolean;
  dismissPending: boolean;
  onDismiss: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-[1rem] bg-[#f4f7f3] px-4 py-3.5 transition",
        highlighted && "ring-2 ring-[#b8ff5a]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getParticipationStatusTone(request.status)}>
              {getParticipationStatusLabel(request.status)}
            </Badge>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-[#112317]">{match.title}</p>
          <p className="mt-1 truncate text-[12px] text-[#66736a]">{formatPrimaryMeta(match)}</p>
          {request.host_note ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#55625a]">{request.host_note}</p>
          ) : null}
        </div>
        <Button size="sm" type="button" variant="secondary" onClick={onDismiss} disabled={dismissPending}>
          {dismissPending ? "삭제 중..." : "삭제"}
        </Button>
      </div>
    </article>
  );
}

function PendingRequestRow({
  request,
  requesterName,
  requesterMeta,
  pendingAction,
  disabled,
  onAccept,
  onReject,
}: {
  request: ParticipationRequest;
  requesterName: string;
  requesterMeta: string | null;
  pendingAction: PendingActivityAction;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-[1rem] bg-[#f4f7f3] px-3.5 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#112317]">
            {requesterName} · {getParticipationSummary(request)}
          </p>
          {requesterMeta ? <p className="mt-1 text-[12px] text-[#66736a]">{requesterMeta}</p> : null}
          {request.message ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#55625a]">{request.message}</p>
          ) : null}
        </div>
        <Badge variant="soon">요청됨</Badge>
      </div>

      <div className="mt-3 flex gap-2">
        <Button className="flex-1" size="sm" type="button" onClick={onAccept} disabled={disabled}>
          {pendingAction?.targetId === request.id && pendingAction.kind === "accept" ? "수락 중..." : "수락"}
        </Button>
        <Button
          className="flex-1"
          size="sm"
          type="button"
          variant="secondary"
          onClick={onReject}
          disabled={disabled}
        >
          {pendingAction?.targetId === request.id && pendingAction.kind === "reject" ? "거절 중..." : "거절"}
        </Button>
      </div>
    </div>
  );
}

function ConnectedRequestRow({
  request,
  requesterName,
  requesterMeta,
  pendingAction,
  onConfirm,
  onReject,
}: {
  request: ParticipationRequest;
  requesterName: string;
  requesterMeta: string | null;
  pendingAction: PendingActivityAction;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const statusLabel = request.status === "confirmed" ? "확정됨" : "수락됨";
  const confirmPending = pendingAction?.targetId === request.id && pendingAction.kind === "confirm";
  const rejectPending = pendingAction?.targetId === request.id && pendingAction.kind === "reject";
  const actionDisabled = Boolean(pendingAction);

  return (
    <div className="rounded-[1rem] bg-[#eef2ee] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#112317]">
            {requesterName} · {getParticipationSummary(request)}
          </p>
          {requesterMeta ? <p className="mt-1 text-[12px] text-[#66736a]">{requesterMeta}</p> : null}
        </div>
        <Badge variant={request.status === "confirmed" ? "calm" : "soon"}>{statusLabel}</Badge>
      </div>

      {request.status === "accepted" ? (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" size="sm" type="button" onClick={onConfirm} disabled={actionDisabled}>
            {confirmPending ? "확정 중..." : "확정"}
          </Button>
          <Button
            className="flex-1"
            size="sm"
            type="button"
            variant="secondary"
            onClick={onReject}
            disabled={actionDisabled}
          >
            {rejectPending ? "거절 중..." : "거절"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HostSpotCard({
  state,
  match,
  requests,
  highlighted,
  pendingAction,
  onAccept,
  onConfirm,
  onReject,
  onDelete,
}: {
  state: DemoAppState;
  match: Match;
  requests: ParticipationRequest[];
  highlighted: boolean;
  pendingAction: PendingActivityAction;
  onAccept: (requestId: string) => void;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDelete: () => void;
}) {
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const connectedRequests = requests.filter((request) => ["accepted", "confirmed"].includes(request.status));
  const closedRequests = requests.filter((request) =>
    ["rejected", "withdrawn", "expired"].includes(request.status),
  );
  const hasLockedRequest = connectedRequests.length > 0;
  const deletePending = pendingAction?.targetId === match.id && pendingAction.kind === "delete";
  const canDelete = !hasLockedRequest && match.status === "open";

  return (
    <article
      className={cn(
        "surface-card rounded-[1.45rem] p-4 transition",
        highlighted && "ring-2 ring-[#b8ff5a]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={match.remaining_slots <= 1 ? "urgent" : "soon"}>
              {match.remaining_slots <= 1 ? "1자리" : `${match.remaining_slots}자리`}
            </Badge>
            {pendingRequests.length > 0 ? (
              <span className="rounded-full bg-[#f4f7f3] px-2.5 py-1 text-[11px] font-bold text-[#55625a]">
                새 요청 {pendingRequests.length}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-[1.02rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#66736a]">{formatStartAt(match.start_at)}</p>
        </div>
        <Button
          className="h-9 rounded-[1rem] px-3.5 text-[13px] font-semibold"
          size="sm"
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={!canDelete || deletePending}
        >
          {deletePending ? "마감 중..." : "모집 마감"}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f4f7f3] px-3 py-1.5 text-[12px] font-semibold text-[#55625a]">
          요청 {pendingRequests.length}
        </span>
        <span className="rounded-full bg-[#f4f7f3] px-3 py-1.5 text-[12px] font-semibold text-[#55625a]">
          연락 {connectedRequests.length}
        </span>
        <span className="rounded-full bg-[#f4f7f3] px-3 py-1.5 text-[12px] font-semibold text-[#55625a]">
          종료 {closedRequests.length}
        </span>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {pendingRequests.map((request) => {
            const requester = getProfileById(state, request.requester_profile_id);
            const requesterMeta = requester
              ? `${formatSkillLevel(requester.skill_level)} · ${formatAgeBand(requester.age)}`
              : null;
            const requestActionPending =
              pendingAction?.targetId === request.id &&
              (pendingAction.kind === "accept" || pendingAction.kind === "reject");

            return (
              <PendingRequestRow
                key={request.id}
                request={request}
                requesterName={requester?.nickname ?? "참여자"}
                requesterMeta={requesterMeta}
                pendingAction={pendingAction}
                disabled={
                  requestActionPending ||
                  pendingAction?.kind === "delete" ||
                  match.remaining_slots < request.requested_count
                }
                onAccept={() => onAccept(request.id)}
                onReject={() => onReject(request.id)}
              />
            );
          })}
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-3 rounded-[1rem] bg-[#f4f7f3] px-4 py-3 text-sm text-[#66736a]">
          아직 들어온 요청이 없습니다.
        </div>
      ) : null}

      {connectedRequests.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">연락 및 확정</p>
          {connectedRequests.map((request) => {
            const requester = getProfileById(state, request.requester_profile_id);
            const requesterMeta = requester
              ? `${formatSkillLevel(requester.skill_level)} · ${formatAgeBand(requester.age)}`
              : null;

            return (
              <ConnectedRequestRow
                key={request.id}
                request={request}
                requesterName={requester?.nickname ?? "참여자"}
                requesterMeta={requesterMeta}
                pendingAction={pendingAction}
                onConfirm={() => onConfirm(request.id)}
                onReject={() => onReject(request.id)}
              />
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function ActivityScreenBody({
  flash,
  initialTab = "requests",
  highlight,
  state,
  onWithdraw,
  onAccept,
  onConfirm,
  onReject,
  onDismiss,
  onDelete,
  showDemoIdentitySwitcher,
}: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  state: DemoAppState;
  onWithdraw: (requestId: string) => Promise<void>;
  onAccept: (requestId: string) => Promise<void>;
  onConfirm: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onDismiss: (requestId: string) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  showDemoIdentitySwitcher: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingActivityAction>(null);
  const flashParam = searchParams.get("flash");
  const resolvedFlash = (
    flashParam &&
    ["created", "requested", "accepted", "confirmed", "rejected", "withdrawn", "cleared", "deleted"].includes(
      flashParam,
    )
      ? flashParam
      : flash
  ) as ActivityFlash | undefined;

  const myRequests = useMemo(() => getMyParticipationRequests(state), [state]);
  const hostedMatches = useMemo(() => getHostedMatches(state), [state]);
  const openRequests = useMemo(() => myRequests.filter(isOpenRequest), [myRequests]);
  const closedRequests = useMemo(() => myRequests.filter((request) => !isOpenRequest(request)), [myRequests]);
  const dismissibleClosedRequests = useMemo(
    () => closedRequests.filter(isDismissibleRequest),
    [closedRequests],
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function replaceActivityQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      params.set(key, value);
    });

    const query = params.toString();
    router.replace(query ? `/activity?${query}` : "/activity");
  }

  function handleTabChange(nextTab: ActivityTab) {
    setActiveTab(nextTab);
    replaceActivityQuery({ tab: nextTab });
  }

  async function handleWithdraw(requestId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "withdraw" });

    try {
      await onWithdraw(requestId);
      setActiveTab("requests");
      replaceActivityQuery({
        tab: "requests",
        highlight: requestId,
        flash: "withdrawn",
      });
    } catch (withdrawError) {
      setError(getUserFacingErrorMessage(withdrawError, "요청을 취소하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleAccept(requestId: string, matchId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "confirm" });

    try {
      await onAccept(requestId);
      setActiveTab("listings");
      replaceActivityQuery({
        tab: "listings",
        highlight: matchId,
        flash: "accepted",
      });
    } catch (acceptError) {
      setError(getUserFacingErrorMessage(acceptError, "참가 요청을 수락하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleConfirm(requestId: string, matchId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "accept" });

    try {
      await onConfirm(requestId);
      setActiveTab("listings");
      replaceActivityQuery({
        tab: "listings",
        highlight: matchId,
        flash: "confirmed",
      });
    } catch (confirmError) {
      setError(getUserFacingErrorMessage(confirmError, "최종 확정을 처리하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject(requestId: string, matchId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "reject" });

    try {
      await onReject(requestId);
      setActiveTab("listings");
      replaceActivityQuery({
        tab: "listings",
        highlight: matchId,
        flash: "rejected",
      });
    } catch (rejectError) {
      setError(getUserFacingErrorMessage(rejectError, "참가 요청을 거절하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(matchId: string) {
    if (!window.confirm("이 모집을 마감할까요? 대기 중인 요청도 함께 종료됩니다.")) {
      return;
    }

    setError("");
    setPendingAction({ targetId: matchId, kind: "delete" });

    try {
      await onDelete(matchId);
      setActiveTab("listings");
      replaceActivityQuery({
        tab: "listings",
        flash: "deleted",
      });
    } catch (deleteError) {
      setError(getUserFacingErrorMessage(deleteError, "모집을 마감하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDismiss(requestId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "dismiss" });

    try {
      await onDismiss(requestId);
      setActiveTab("requests");
      replaceActivityQuery({
        tab: "requests",
        flash: "cleared",
      });
    } catch (dismissError) {
      setError(getUserFacingErrorMessage(dismissError, "참여 요청 기록을 삭제하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <ScreenHeader href="/home" ariaLabel="홈으로 돌아가기" />

      {resolvedFlash || error ? (
        <div className="space-y-3">
          <FlashBanner flash={resolvedFlash} />
          {error ? (
            <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {showDemoIdentitySwitcher ? <DemoIdentitySwitcher /> : null}

      <section className="surface-card rounded-[1.5rem] p-3">
        <div className="grid grid-cols-2 gap-2">
          <ActivityTabButton
            active={activeTab === "requests"}
            count={myRequests.length}
            label="참여"
            onClick={() => handleTabChange("requests")}
          />
          <ActivityTabButton
            active={activeTab === "listings"}
            count={hostedMatches.length}
            label="모집"
            onClick={() => handleTabChange("listings")}
          />
        </div>
      </section>

      {activeTab === "requests" ? (
        <section className="space-y-3">
          {openRequests.length === 0 && dismissibleClosedRequests.length === 0 ? (
            <section className="surface-card rounded-[1.45rem] p-5">
              <p className="text-sm text-[#66736a]">참여 요청한 매치가 없습니다.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/home">매치 찾기</Link>
              </Button>
            </section>
          ) : (
            openRequests.map((request) => {
              const match = state.matches.find((item) => item.id === request.match_id);

              if (!match) {
                return null;
              }

              return (
                <MyJoinCard
                  key={request.id}
                  state={state}
                  match={match}
                  request={request}
                  highlighted={highlight === request.id || highlight === match.id}
                  onWithdraw={() => handleWithdraw(request.id)}
                  withdrawPending={
                    pendingAction?.targetId === request.id && pendingAction.kind === "withdraw"
                  }
                />
              );
            })
          )}

          {dismissibleClosedRequests.length > 0 ? (
            <section className="surface-card rounded-[1.45rem] p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#112317]">종료된 요청</h2>
                <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#55625a]">
                  {dismissibleClosedRequests.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {dismissibleClosedRequests.map((request) => {
                  const match = state.matches.find((item) => item.id === request.match_id);

                  if (!match) {
                    return null;
                  }

                  return (
                    <ClosedRequestRow
                      key={request.id}
                      match={match}
                      request={request}
                      highlighted={highlight === request.id || highlight === match.id}
                      dismissPending={
                        pendingAction?.targetId === request.id && pendingAction.kind === "dismiss"
                      }
                      onDismiss={() => handleDismiss(request.id)}
                    />
                  );
                })}
              </div>
            </section>
          ) : null}
        </section>
      ) : (
        <section className="space-y-3">
          {hostedMatches.length === 0 ? (
            <section className="surface-card rounded-[1.45rem] p-5">
              <p className="text-sm text-[#66736a]">진행 중인 모집이 없습니다.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/create">용병 모집하기</Link>
              </Button>
            </section>
          ) : (
            hostedMatches.map((match) => (
              <HostSpotCard
                key={match.id}
                state={state}
                match={match}
                requests={getInboundRequestsForMatch(state, match.id)}
                highlighted={highlight === match.id}
                pendingAction={pendingAction}
                onAccept={(requestId) => handleAccept(requestId, match.id)}
                onConfirm={(requestId) => handleConfirm(requestId, match.id)}
                onReject={(requestId) => handleReject(requestId, match.id)}
                onDelete={() => handleDelete(match.id)}
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}

function DemoActivityScreen(props: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
}) {
  const { state, actions } = useDemoApp();

  return (
    <ActivityScreenBody
      {...props}
      state={state}
      onWithdraw={async (requestId) => {
        actions.withdrawParticipation(requestId);
      }}
      onAccept={async (requestId) => {
        actions.acceptParticipation(requestId);
      }}
      onConfirm={async (requestId) => {
        actions.confirmParticipation(requestId);
      }}
      onReject={async (requestId) => {
        actions.rejectParticipation(requestId);
      }}
      onDismiss={async (requestId) => {
        actions.dismissParticipationRequest(requestId);
      }}
      onDelete={async (matchId) => {
        actions.cancelMatch(matchId);
      }}
      showDemoIdentitySwitcher
    />
  );
}

export function ActivityScreen({
  flash,
  initialTab = "requests",
  highlight,
  stateSnapshot,
}: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  stateSnapshot?: DemoAppState;
}) {
  if (stateSnapshot) {
    return (
      <ActivityScreenBody
        flash={flash}
        initialTab={initialTab}
        highlight={highlight}
        state={stateSnapshot}
        onWithdraw={async (requestId) => {
          await withdrawParticipationAction(requestId);
        }}
        onAccept={async (requestId) => {
          await acceptParticipationAction(requestId);
        }}
        onConfirm={async (requestId) => {
          await confirmParticipationAction(requestId);
        }}
        onReject={async (requestId) => {
          await rejectParticipationAction(requestId);
        }}
        onDismiss={async (requestId) => {
          await dismissParticipationRequestAction(requestId);
        }}
        onDelete={async (matchId) => {
          await cancelMatchAction(matchId);
        }}
        showDemoIdentitySwitcher={false}
      />
    );
  }

  return <DemoActivityScreen flash={flash} highlight={highlight} initialTab={initialTab} />;
}
