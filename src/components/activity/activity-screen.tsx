"use client";

import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { Clock3, MapPin, MessageCircleMore, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { cancelMatchAction } from "@/app/actions/matches";
import {
  acceptParticipationAction,
  rejectParticipationAction,
  withdrawParticipationAction,
} from "@/app/actions/requests";
import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { FlashBanner } from "@/components/app/flash-banner";
import { SectionHeading } from "@/components/app/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  formatFee,
  formatSkillLevel,
  formatSportType,
  formatStartAt,
} from "@/lib/utils";
import type { DemoAppState, Match, ParticipationRequest } from "@/lib/types";

type ActivityTab = "requests" | "listings";
type ActivityFlash =
  | "created"
  | "requested"
  | "accepted"
  | "confirmed"
  | "rejected"
  | "withdrawn"
  | "deleted";
type PendingActivityAction =
  | { targetId: string; kind: "withdraw" | "accept" | "reject" | "delete" }
  | null;

function isOpenRequest(request: ParticipationRequest) {
  return ["pending", "accepted", "confirmed"].includes(request.status);
}

function formatRequestMeta(match: Match) {
  return `${formatStartAt(match.start_at)} · ${formatFee(match.fee)}`;
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
      className={`surface-card rounded-[1.45rem] p-4 transition ${
        highlighted ? "ring-2 ring-[#b8ff5a]" : ""
      }`}
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
          <h3 className="mt-3 text-[1.15rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-sm text-[#66736a]">{formatRequestMeta(match)}</p>
        </div>
        <span className="rounded-full bg-[#f4f7f3] px-3 py-1 text-[11px] font-bold text-[#55625a]">
          {getParticipationSummary(request)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-[13px] text-[#536157]">
        <div className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5" />
          <span>{formatStartAt(match.start_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{match.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5" />
          <span>{host?.nickname ?? "FootLink Host"}</span>
        </div>
      </div>

      {request.host_note ? (
        <p className="mt-4 rounded-[1rem] bg-[#f4f7f3] px-4 py-3 text-sm leading-6 text-[#445149]">
          {request.host_note}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        {contactLink ? (
          <Button asChild className="flex-1" size="sm">
            <Link href={contactLink.href} rel="noreferrer" target="_blank">
              <MessageCircleMore className="mr-1.5 h-4 w-4" />
              {contactLink.label}
            </Link>
          </Button>
        ) : null}
        {canWithdraw ? (
          <Button
            className="flex-1"
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
    </article>
  );
}

function HostSpotCard({
  state,
  match,
  requests,
  highlighted,
  pendingAction,
  onAccept,
  onReject,
  onDelete,
}: {
  state: DemoAppState;
  match: Match;
  requests: ParticipationRequest[];
  highlighted: boolean;
  pendingAction: PendingActivityAction;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onDelete: () => void;
}) {
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const connectedRequests = requests.filter((request) => ["accepted", "confirmed"].includes(request.status));
  const hasLockedRequest = connectedRequests.length > 0;
  const canDelete = !hasLockedRequest && match.status === "open";

  return (
    <article
      className={`surface-card rounded-[1.45rem] p-4 transition ${
        highlighted ? "ring-2 ring-[#b8ff5a]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={match.remaining_slots <= 1 ? "urgent" : "soon"}>
              {match.remaining_slots <= 1 ? "1자리 남음" : `${match.remaining_slots}자리 남음`}
            </Badge>
            <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#445149]">
              {formatSportType(match.sport_type ?? "futsal")}
            </span>
          </div>
          <h3 className="mt-3 text-[1.15rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-sm text-[#66736a]">{formatRequestMeta(match)}</p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={!canDelete || pendingAction?.kind === "delete"}
        >
          {pendingAction?.kind === "delete" ? "닫는 중..." : "공석 닫기"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">요청</p>
          <p className="mt-1 text-base font-bold text-[#112317]">{requests.length}</p>
        </div>
        <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">대기</p>
          <p className="mt-1 text-base font-bold text-[#112317]">{pendingRequests.length}</p>
        </div>
        <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">연락</p>
          <p className="mt-1 text-base font-bold text-[#112317]">{connectedRequests.length}</p>
        </div>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="mt-4 space-y-3">
          {pendingRequests.map((request) => {
            const requester = getProfileById(state, request.requester_profile_id);
            const requestActionPending =
              pendingAction?.targetId === request.id &&
              (pendingAction.kind === "accept" || pendingAction.kind === "reject");

            return (
              <div key={request.id} className="rounded-[1rem] bg-[#f4f7f3] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#112317]">
                      {requester?.nickname ?? "참가자"} · {getParticipationSummary(request)}
                    </p>
                    <p className="mt-1 text-sm text-[#66736a]">
                      실력 {requester ? formatSkillLevel(requester.skill_level) : "중급"} · 나이{" "}
                      {requester?.age ?? "-"}
                    </p>
                  </div>
                  <Badge variant="soon">요청됨</Badge>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    type="button"
                    onClick={() => onAccept(request.id)}
                    disabled={requestActionPending || match.remaining_slots < request.requested_count}
                  >
                    {pendingAction?.targetId === request.id && pendingAction.kind === "accept"
                      ? "승인 중..."
                      : "연락 허용"}
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={() => onReject(request.id)}
                    disabled={requestActionPending}
                  >
                    {pendingAction?.targetId === request.id && pendingAction.kind === "reject"
                      ? "거절 중..."
                      : "거절"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[1rem] bg-[#f4f7f3] px-4 py-4 text-sm text-[#66736a]">
          아직 새 요청이 없습니다.
        </div>
      )}

      {connectedRequests.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">
            연락 중인 참가자
          </p>
          {connectedRequests.map((request) => {
            const requester = getProfileById(state, request.requester_profile_id);
            const contactLink = getParticipationContactLink(state, request);

            return (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-[1rem] bg-[#eef2ee] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-[#112317]">{requester?.nickname ?? "참가자"}</p>
                  <p className="mt-1 text-xs text-[#66736a]">연락 가능 상태로 전달됐습니다.</p>
                </div>
                {contactLink ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={contactLink.href} rel="noreferrer" target="_blank">
                      연락 열기
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="success">연락 가능</Badge>
                )}
              </div>
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
  onReject,
  onDelete,
  showDemoIdentitySwitcher,
}: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  state: DemoAppState;
  onWithdraw: (requestId: string) => Promise<void>;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  showDemoIdentitySwitcher: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingActivityAction>(null);

  const myRequests = useMemo(() => getMyParticipationRequests(state), [state]);
  const hostedMatches = useMemo(() => getHostedMatches(state), [state]);

  const openRequests = myRequests.filter(isOpenRequest);
  const closedRequests = myRequests.filter((request) => !isOpenRequest(request));
  const sectionOrder: ActivityTab[] =
    initialTab === "listings" ? ["listings", "requests"] : ["requests", "listings"];

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

  async function handleWithdraw(requestId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "withdraw" });

    try {
      await onWithdraw(requestId);
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
    setPendingAction({ targetId: requestId, kind: "accept" });

    try {
      await onAccept(requestId);
      replaceActivityQuery({
        tab: "listings",
        highlight: matchId,
        flash: "accepted",
      });
    } catch (acceptError) {
      setError(getUserFacingErrorMessage(acceptError, "참여 요청을 승인하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject(requestId: string, matchId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "reject" });

    try {
      await onReject(requestId);
      replaceActivityQuery({
        tab: "listings",
        highlight: matchId,
        flash: "rejected",
      });
    } catch (rejectError) {
      setError(getUserFacingErrorMessage(rejectError, "참여 요청을 거절하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(matchId: string) {
    if (!window.confirm("이 공석을 닫을까요? 대기 중인 요청도 함께 마감 처리됩니다.")) {
      return;
    }

    setError("");
    setPendingAction({ targetId: matchId, kind: "delete" });

    try {
      await onDelete(matchId);
      replaceActivityQuery({
        tab: "listings",
        flash: "deleted",
      });
    } catch (deleteError) {
      setError(getUserFacingErrorMessage(deleteError, "공석을 닫지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  const sectionMap = {
    requests: (
      <section key="requests" className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">My Joins</p>
            <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">내 참여</h2>
          </div>
          <span className="rounded-full bg-[#eef2ee] px-3 py-1 text-[11px] font-bold text-[#55625a]">
            {openRequests.length}
          </span>
        </div>

        {openRequests.length === 0 ? (
          <section className="surface-card rounded-[1.45rem] p-5">
            <p className="text-sm text-[#66736a]">아직 진행 중인 참여가 없습니다.</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/home">지금 공석 보러가기</Link>
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

        {closedRequests.length > 0 ? (
          <section className="surface-card rounded-[1.45rem] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">History</p>
            <div className="mt-3 space-y-2">
              {closedRequests.map((request) => {
                const match = state.matches.find((item) => item.id === request.match_id);

                if (!match) {
                  return null;
                }

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-[1rem] bg-[#f4f7f3] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#112317]">{match.title}</p>
                      <p className="mt-1 text-xs text-[#66736a]">{formatStartAt(match.start_at)}</p>
                    </div>
                    <Badge variant={getParticipationStatusTone(request.status)}>
                      {getParticipationStatusLabel(request.status)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    ),
    listings: (
      <section key="listings" className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Host Spots</p>
            <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">내 공석</h2>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/create">
              <Plus className="mr-1.5 h-4 w-4" />
              공석 올리기
            </Link>
          </Button>
        </div>

        {hostedMatches.length === 0 ? (
          <section className="surface-card rounded-[1.45rem] p-5">
            <p className="text-sm text-[#66736a]">올려둔 공석이 없습니다.</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/create">첫 공석 올리기</Link>
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
              onReject={(requestId) => handleReject(requestId, match.id)}
              onDelete={() => handleDelete(match.id)}
            />
          ))
        )}
      </section>
    ),
  } satisfies Record<ActivityTab, ReactNode>;

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Activity"
          title="내 참여와 공석"
          description="요청 상태 확인, 빠른 연락, 공석 승인만 남긴 간단한 화면입니다."
        />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">진행 중</p>
            <p className="mt-1 text-base font-bold text-[#112317]">{openRequests.length}</p>
          </div>
          <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">내 공석</p>
            <p className="mt-1 text-base font-bold text-[#112317]">{hostedMatches.length}</p>
          </div>
          <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">남은 자리</p>
            <p className="mt-1 text-base font-bold text-[#112317]">
              {hostedMatches.reduce((sum, match) => sum + match.remaining_slots, 0)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <FlashBanner flash={flash} />
          {error ? (
            <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      {showDemoIdentitySwitcher ? <DemoIdentitySwitcher /> : null}

      {sectionOrder.map((section) => sectionMap[section])}
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
      onReject={async (requestId) => {
        actions.rejectParticipation(requestId);
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
        onReject={async (requestId) => {
          await rejectParticipationAction(requestId);
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
