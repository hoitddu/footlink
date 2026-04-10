"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
import type { AppDataSource } from "@/lib/app-config";
import {
  fetchActivitySnapshot,
  getCachedActivitySnapshot,
  primeActivitySnapshot,
} from "@/lib/activity-snapshot-client";
import {
  cn,
  formatAgeBand,
  formatFee,
  formatSkillLevel,
  formatSportType,
  formatStartAt,
  formatTimeRange,
} from "@/lib/utils";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getHostedMatches,
  getInboundRequestsForMatch,
  getParticipationContactActions,
  getMyParticipationRequests,
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
type PendingActivityAction = {
  targetId: string;
  kind: "withdraw" | "accept" | "confirm" | "reject" | "delete" | "dismiss";
} | null;

function isOpenRequest(request: ParticipationRequest) {
  return ["pending", "accepted", "confirmed"].includes(request.status);
}

function isDismissibleRequest(request: ParticipationRequest) {
  return ["rejected", "withdrawn", "expired"].includes(request.status);
}

function formatPrimaryMeta(match: Match) {
  return `${formatStartAt(match.start_at)} / ${formatFee(match.fee)}`;
}

function formatSecondaryMeta(match: Match) {
  return `${formatTimeRange(match.start_at, match.duration_minutes)} / ${match.address}`;
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
        "flex min-h-[3.25rem] items-center justify-between gap-2.5 rounded-[1.1rem] px-4 py-3 text-left transition",
        active
          ? "bg-[#112317] text-white shadow-[0_18px_32px_rgba(6,21,12,0.18)]"
          : "surface-subcard text-[#112317]",
      )}
    >
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.01em]">
        {label}
      </span>
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

function ActivityLoadingState({
  flash,
  initialTab,
  loadError,
}: {
  flash?: ActivityFlash;
  initialTab: ActivityTab;
  loadError: string;
}) {
  return (
    <div className="space-y-4">
      <ScreenHeader href="/home" ariaLabel="Go home" />

      {loadError ? (
        <p className="rounded-[1.2rem] bg-[#f7ddd2] px-4 py-3 text-sm font-semibold text-[#8e3e32]">
          {loadError}
        </p>
      ) : null}

      <section className="surface-card space-y-2 rounded-[1.5rem] p-3 ring-1 ring-white/55">
        <FlashBanner flash={flash} placement="cta" durationMs={2800} />
        <div className="grid grid-cols-2 gap-2">
          <ActivityTabButton
            active={initialTab === "requests"}
            count={0}
            label="참여"
            onClick={() => {}}
          />
          <ActivityTabButton
            active={initialTab === "listings"}
            count={0}
            label="모집"
            onClick={() => {}}
          />
        </div>
      </section>

      <section className="surface-card rounded-[1.45rem] p-5 ring-1 ring-white/55">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded-full bg-[#e7ede4]" />
          <div className="h-4 w-48 rounded-full bg-[#eff3ec]" />
          <div className="h-4 w-40 rounded-full bg-[#eff3ec]" />
        </div>
      </section>
    </div>
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
  const contactActions = getParticipationContactActions(state, request);
  const canWithdraw = request.status === "pending";

  return (
    <article
      className={cn(
        "surface-card rounded-[1.5rem] p-4 ring-1 ring-white/55 transition",
        highlighted && "ring-2 ring-[#b8ff5a]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getParticipationStatusTone(request.status)}>
              {getParticipationStatusLabel(request.status)}
            </Badge>
            <span className="surface-chip rounded-full px-2.5 py-1 text-[11px] font-bold">
              {formatSportType(match.sport_type ?? "futsal")}
            </span>
          </div>
          <h3 className="mt-2 truncate text-[1.02rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#66736a]">
            {formatPrimaryMeta(match)}
          </p>
          <p className="mt-1 truncate text-[13px] text-[#66736a]">
            {formatSecondaryMeta(match)}
          </p>
          <p className="mt-1 text-[12px] font-medium text-[#55625a]">
            {host?.nickname ?? "FootLink Host"} /{" "}
            {getParticipationSummary(request)}
          </p>
        </div>
      </div>

      {request.host_note ? (
        <p className="surface-subcard mt-3 rounded-[1rem] px-3.5 py-3 text-[13px] leading-6 text-[#445149]">
          {request.host_note}
        </p>
      ) : null}

      {contactActions.length > 0 || canWithdraw ? (
        <div className="mt-3 flex gap-2">
          {contactActions.map((action) => (
            <Button
              key={action.kind}
              asChild
              className="flex-1"
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
              className={cn(contactActions.length === 0 && "flex-1")}
              size="sm"
              type="button"
              variant="secondary"
              onClick={onWithdraw}
              disabled={withdrawPending}
            >
              {withdrawPending
                ? "\uC694\uCCAD \uCDE8\uC18C \uC911..."
                : "\uC694\uCCAD \uCDE8\uC18C"}
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
        "surface-subcard rounded-[1rem] px-4 py-3.5 transition",
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
          <p className="mt-2 truncate text-sm font-semibold text-[#112317]">
            {match.title}
          </p>
          <p className="mt-1 truncate text-[12px] text-[#66736a]">
            {formatPrimaryMeta(match)}
          </p>
          {request.host_note ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#55625a]">
              {request.host_note}
            </p>
          ) : null}
        </div>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={onDismiss}
          disabled={dismissPending}
        >
          {dismissPending ? "\uC0AD\uC81C \uC911..." : "\uC0AD\uC81C"}
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
    <div className="surface-subcard rounded-[1rem] px-3.5 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#112317]">
            {requesterName} / {getParticipationSummary(request)}
          </p>
          {requesterMeta ? (
            <p className="mt-1 text-[12px] text-[#66736a]">{requesterMeta}</p>
          ) : null}
          {request.message ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#55625a]">
              {request.message}
            </p>
          ) : null}
        </div>
        <Badge variant="soon">{"\uC694\uCCAD"}</Badge>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          type="button"
          onClick={onAccept}
          disabled={disabled}
        >
          {pendingAction?.targetId === request.id &&
          pendingAction.kind === "accept"
            ? "\uC218\uB77D \uC911..."
            : "\uC218\uB77D"}
        </Button>
        <Button
          className="flex-1"
          size="sm"
          type="button"
          variant="secondary"
          onClick={onReject}
          disabled={disabled}
        >
          {pendingAction?.targetId === request.id &&
          pendingAction.kind === "reject"
            ? "\uAC70\uC808 \uC911..."
            : "\uAC70\uC808"}
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
  const statusLabel =
    request.status === "confirmed"
      ? "\uD655\uC815\uB428"
      : "\uC5F0\uB77D \uC911";
  const confirmPending =
    pendingAction?.targetId === request.id && pendingAction.kind === "confirm";
  const rejectPending =
    pendingAction?.targetId === request.id && pendingAction.kind === "reject";
  const actionDisabled = Boolean(pendingAction);

  return (
    <div className="surface-subcard rounded-[1rem] px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#112317]">
            {requesterName} / {getParticipationSummary(request)}
          </p>
          {requesterMeta ? (
            <p className="mt-1 text-[12px] text-[#66736a]">{requesterMeta}</p>
          ) : null}
        </div>
        <Badge variant={request.status === "confirmed" ? "calm" : "soon"}>
          {statusLabel}
        </Badge>
      </div>

      {request.status === "accepted" ? (
        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            size="sm"
            type="button"
            onClick={onConfirm}
            disabled={actionDisabled}
          >
            {confirmPending ? "\uD655\uC815 \uC911..." : "\uD655\uC815"}
          </Button>
          <Button
            className="flex-1"
            size="sm"
            type="button"
            variant="secondary"
            onClick={onReject}
            disabled={actionDisabled}
          >
            {rejectPending ? "\uAC70\uC808 \uC911..." : "\uAC70\uC808"}
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
  const pendingRequests = requests.filter(
    (request) => request.status === "pending",
  );
  const connectedRequests = requests.filter((request) =>
    ["accepted", "confirmed"].includes(request.status),
  );
  const closedRequests = requests.filter((request) =>
    ["rejected", "withdrawn", "expired"].includes(request.status),
  );
  const hasAcceptedRequest = requests.some((request) => request.status === "accepted");
  const deletePending =
    pendingAction?.targetId === match.id && pendingAction.kind === "delete";
  const canDelete = !hasAcceptedRequest && match.status === "open";
  const isRecruitmentClosed = match.status !== "open";

  return (
    <article
      className={cn(
        "surface-card rounded-[1.5rem] p-4 ring-1 ring-white/55 transition",
        highlighted && "ring-2 ring-[#b8ff5a]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                isRecruitmentClosed ? "calm" : match.remaining_slots <= 1 ? "urgent" : "soon"
              }
            >
              {isRecruitmentClosed
                ? "\uBAA8\uC9D1 \uB9C8\uAC10"
                : match.remaining_slots <= 1
                  ? "1\uC790\uB9AC"
                  : `${match.remaining_slots}\uC790\uB9AC`}
            </Badge>
            {pendingRequests.length > 0 ? (
              <span className="surface-chip rounded-full px-2.5 py-1 text-[11px] font-bold">
                {"\uC0C8 \uC694\uCCAD"} {pendingRequests.length}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-[1.02rem] font-bold tracking-[-0.03em] text-[#112317]">
            {match.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#66736a]">
            {formatStartAt(match.start_at)}
          </p>
        </div>
        <Button
          className="h-9 rounded-[1rem] px-3.5 text-[13px] font-semibold"
          size="sm"
          type="button"
          variant="secondary"
          onClick={onDelete}
          disabled={!canDelete || deletePending}
        >
          {deletePending
            ? "\uB9C8\uAC10 \uC911..."
            : "\uBAA8\uC9D1 \uB9C8\uAC10"}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="surface-chip rounded-full px-3 py-1.5 text-[12px] font-semibold">
          {"\uC694\uCCAD"} {pendingRequests.length}
        </span>
        <span className="surface-chip rounded-full px-3 py-1.5 text-[12px] font-semibold">
          {"\uC5F0\uB77D"} {connectedRequests.length}
        </span>
        <span className="surface-chip rounded-full px-3 py-1.5 text-[12px] font-semibold">
          {"\uC885\uB8CC"} {closedRequests.length}
        </span>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="mt-3 space-y-2.5">
          {pendingRequests.map((request) => {
            const requester = getProfileById(
              state,
              request.requester_profile_id,
            );
            const requesterMeta = requester
              ? `${formatSkillLevel(requester.skill_level)} / ${formatAgeBand(requester.age)}`
              : null;
            const requestActionPending =
              pendingAction?.targetId === request.id &&
              (pendingAction.kind === "accept" ||
                pendingAction.kind === "reject");

            return (
              <PendingRequestRow
                key={request.id}
                request={request}
                requesterName={requester?.nickname ?? "\uCC38\uC5EC\uC790"}
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
        <div className="surface-subcard mt-3 rounded-[1rem] px-4 py-3 text-sm text-[#66736a]">
          {
            "\uC544\uC9C1 \uB4E4\uC5B4\uC628 \uC694\uCCAD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
          }
        </div>
      ) : null}

      {connectedRequests.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">
            {"\uC5F0\uB77D \uBC0F \uD655\uC815"}
          </p>
          {connectedRequests.map((request) => {
            const requester = getProfileById(
              state,
              request.requester_profile_id,
            );
            const requesterMeta = requester
              ? `${formatSkillLevel(requester.skill_level)} / ${formatAgeBand(requester.age)}`
              : null;

            return (
              <ConnectedRequestRow
                key={request.id}
                request={request}
                requesterName={requester?.nickname ?? "\uCC38\uC5EC\uC790"}
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingActivityAction>(null);
  const [localFlash, setLocalFlash] = useState<ActivityFlash | undefined>(
    undefined,
  );
  const [localFlashAt, setLocalFlashAt] = useState<string | undefined>(
    undefined,
  );
  const [localHighlight, setLocalHighlight] = useState<string | undefined>(
    highlight,
  );
  const flashParam = searchParams.get("flash");
  const flashAt = searchParams.get("flashAt");
  const resolvedFlash =
    localFlash ??
    ((flashParam &&
    [
      "created",
      "requested",
      "accepted",
      "confirmed",
      "rejected",
      "withdrawn",
      "cleared",
      "deleted",
    ].includes(flashParam)
      ? flashParam
      : flash) as ActivityFlash | undefined);
  const resolvedHighlight = localHighlight ?? highlight;

  const myRequests = useMemo(() => getMyParticipationRequests(state), [state]);
  const hostedMatches = useMemo(() => getHostedMatches(state), [state]);
  const openRequests = useMemo(
    () => myRequests.filter(isOpenRequest),
    [myRequests],
  );
  const closedRequests = useMemo(
    () => myRequests.filter((request) => !isOpenRequest(request)),
    [myRequests],
  );
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

    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        query ? `/activity?${query}` : "/activity",
      );
    }

    setLocalFlash(next.flash as ActivityFlash | undefined);
    setLocalFlashAt(String(Date.now()));
    setLocalHighlight(next.highlight);
  }

  function handleTabChange(nextTab: ActivityTab) {
    setActiveTab(nextTab);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/activity?tab=${nextTab}`);
    }
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
      setError(
        getUserFacingErrorMessage(
          withdrawError,
          "\uC694\uCCAD\uC744 \uCDE8\uC18C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
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
      setError(
        getUserFacingErrorMessage(
          acceptError,
          "\uCC38\uC5EC \uC694\uCCAD\uC744 \uC218\uB77D\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
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
      setError(
        getUserFacingErrorMessage(
          confirmError,
          "\uCD5C\uC885 \uD655\uC815\uC744 \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
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
      setError(
        getUserFacingErrorMessage(
          rejectError,
          "\uCC38\uC5EC \uC694\uCCAD\uC744 \uAC70\uC808\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(matchId: string) {
    if (
      !window.confirm(
        "\uC774 \uBAA8\uC9D1\uC744 \uB9C8\uAC10\uD560\uAE4C\uC694? \uB300\uAE30 \uC911\uC778 \uC694\uCCAD\uB3C4 \uD568\uAED8 \uC885\uB8CC\uB429\uB2C8\uB2E4.",
      )
    ) {
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
      setError(
        getUserFacingErrorMessage(
          deleteError,
          "\uBAA8\uC9D1\uC744 \uB9C8\uAC10\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
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
      setError(
        getUserFacingErrorMessage(
          dismissError,
          "\uCC38\uC5EC \uC694\uCCAD \uAE30\uB85D\uC744 \uC0AD\uC81C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <ScreenHeader href="/home" ariaLabel="Go home" />

      {error ? (
        <p className="rounded-[1.2rem] bg-[#f7ddd2] px-4 py-3 text-sm font-semibold text-[#8e3e32]">
          {error}
        </p>
      ) : null}

      {showDemoIdentitySwitcher ? <DemoIdentitySwitcher /> : null}

      <section className="surface-card space-y-2 rounded-[1.5rem] p-3 ring-1 ring-white/55">
        <FlashBanner
          key={localFlashAt ?? flashAt ?? resolvedFlash ?? "activity-flash"}
          flash={resolvedFlash}
          placement="cta"
          durationMs={2800}
        />
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
          {openRequests.length === 0 &&
          dismissibleClosedRequests.length === 0 ? (
            <section className="surface-card rounded-[1.5rem] p-5 ring-1 ring-white/55">
              <p className="text-sm text-[#66736a]">
                {
                  "\uCC38\uC5EC \uC694\uCCAD\uD55C \uB9E4\uCE58\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
                }
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/home">{"\uB9E4\uCE58 \uCC3E\uAE30"}</Link>
              </Button>
            </section>
          ) : (
            openRequests.map((request) => {
              const match = state.matches.find(
                (item) => item.id === request.match_id,
              );

              if (!match) {
                return null;
              }

              return (
                <MyJoinCard
                  key={request.id}
                  state={state}
                  match={match}
                  request={request}
                  highlighted={
                    resolvedHighlight === request.id ||
                    resolvedHighlight === match.id
                  }
                  onWithdraw={() => handleWithdraw(request.id)}
                  withdrawPending={
                    pendingAction?.targetId === request.id &&
                    pendingAction.kind === "withdraw"
                  }
                />
              );
            })
          )}

          {dismissibleClosedRequests.length > 0 ? (
            <section className="surface-card rounded-[1.5rem] p-4 ring-1 ring-white/55">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-[-0.02em] text-[#112317]">
                  {"\uC885\uB8CC\uB41C \uC694\uCCAD"}
                </h2>
                <span className="surface-chip rounded-full px-2.5 py-1 text-[11px] font-bold">
                  {dismissibleClosedRequests.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {dismissibleClosedRequests.map((request) => {
                  const match = state.matches.find(
                    (item) => item.id === request.match_id,
                  );

                  if (!match) {
                    return null;
                  }

                  return (
                    <ClosedRequestRow
                      key={request.id}
                      match={match}
                      request={request}
                      highlighted={
                        resolvedHighlight === request.id ||
                        resolvedHighlight === match.id
                      }
                      dismissPending={
                        pendingAction?.targetId === request.id &&
                        pendingAction.kind === "dismiss"
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
            <section className="surface-card rounded-[1.5rem] p-5 ring-1 ring-white/55">
              <p className="text-sm text-[#66736a]">
                {
                  "\uC9C4\uD589 \uC911\uC778 \uBAA8\uC9D1\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."
                }
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/create">
                  {"\uC6A9\uBCD1 \uBAA8\uC9D1\uD558\uAE30"}
                </Link>
              </Button>
            </section>
          ) : (
            hostedMatches.map((match) => (
              <HostSpotCard
                key={match.id}
                state={state}
                match={match}
                requests={getInboundRequestsForMatch(state, match.id)}
                highlighted={resolvedHighlight === match.id}
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

function SupabaseActivityScreen({
  flash,
  initialTab = "requests",
  highlight,
  refreshKey,
}: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  refreshKey?: string;
}) {
  const [stateSnapshot, setStateSnapshot] = useState<DemoAppState | null>(() =>
    getCachedActivitySnapshot(),
  );
  const [loadError, setLoadError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(
    () => !getCachedActivitySnapshot(),
  );

  async function loadSnapshot({
    keepExisting = true,
    force = false,
  }: {
    keepExisting?: boolean;
    force?: boolean;
  } = {}) {
    if (!keepExisting || !stateSnapshot) {
      setBootstrapping(true);
    }

    setLoadError("");

    try {
      const nextState = await fetchActivitySnapshot({ force });
      setStateSnapshot(nextState);
    } catch (error) {
      setLoadError(
        getUserFacingErrorMessage(
          error,
          "\uD65C\uB3D9 \uC0C1\uD0DC\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
    } finally {
      setBootstrapping(false);
    }
  }

  useEffect(() => {
    void loadSnapshot({
      keepExisting: Boolean(stateSnapshot),
      force: Boolean(stateSnapshot),
    });
    // refreshKey comes from the server page render, so router.refresh() remounts
    // the client fetch path without forcing the initial route transition to wait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!stateSnapshot && bootstrapping) {
    return (
      <ActivityLoadingState
        flash={flash}
        initialTab={initialTab}
        loadError={loadError}
      />
    );
  }

  if (!stateSnapshot) {
    return (
      <ActivityLoadingState
        flash={flash}
        initialTab={initialTab}
        loadError={loadError}
      />
    );
  }

  return (
    <ActivityScreenBody
      flash={flash}
      initialTab={initialTab}
      highlight={highlight}
      state={stateSnapshot}
      onWithdraw={async (requestId) => {
        await withdrawParticipationAction(requestId);
        await loadSnapshot();
      }}
      onAccept={async (requestId) => {
        await acceptParticipationAction(requestId);
        await loadSnapshot();
      }}
      onConfirm={async (requestId) => {
        await confirmParticipationAction(requestId);
        await loadSnapshot();
      }}
      onReject={async (requestId) => {
        await rejectParticipationAction(requestId);
        await loadSnapshot();
      }}
      onDismiss={async (requestId) => {
        await dismissParticipationRequestAction(requestId);
        await loadSnapshot();
      }}
      onDelete={async (matchId) => {
        await cancelMatchAction(matchId);
        await loadSnapshot();
      }}
      showDemoIdentitySwitcher={false}
    />
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
  dataSource,
  flash,
  initialTab = "requests",
  highlight,
  stateSnapshot,
  refreshKey,
}: {
  dataSource?: AppDataSource;
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  stateSnapshot?: DemoAppState;
  refreshKey?: string;
}) {
  const resolvedDataSource =
    dataSource ?? (stateSnapshot ? "supabase" : "demo");

  if (stateSnapshot) {
    primeActivitySnapshot(stateSnapshot);

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

  if (resolvedDataSource === "supabase") {
    return (
      <SupabaseActivityScreen
        flash={flash}
        initialTab={initialTab}
        highlight={highlight}
        refreshKey={refreshKey}
      />
    );
  }

  return (
    <DemoActivityScreen
      flash={flash}
      highlight={highlight}
      initialTab={initialTab}
    />
  );
}
