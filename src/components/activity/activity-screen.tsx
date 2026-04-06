"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { cancelMatchAction } from "@/app/actions/matches";
import {
  acceptParticipationAction,
  confirmParticipationAction,
  rejectParticipationAction,
  withdrawParticipationAction,
} from "@/app/actions/requests";
import { HostListingCard } from "@/components/activity/host-listing-card";
import { NotificationCenter } from "@/components/activity/notification-center";
import { RequestStatusCard } from "@/components/activity/request-status-card";
import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { FlashBanner } from "@/components/app/flash-banner";
import { SectionHeading } from "@/components/app/section-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getUserFacingErrorMessage } from "@/lib/errors";
import {
  getHostedMatches,
  getInboundRequestsForMatch,
  getMyParticipationRequests,
  getNotificationsForCurrentProfile,
  getProfileById,
  getUnreadNotificationIds,
} from "@/lib/demo-state/selectors";
import type { DemoAppState } from "@/lib/types";

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
  | { targetId: string; kind: "withdraw" | "accept" | "reject" | "confirm" | "delete" }
  | null;

function ActivityScreenBody({
  flash,
  initialTab = "requests",
  highlight,
  state,
  onWithdraw,
  onAccept,
  onConfirm,
  onReject,
  onDelete,
  showDemoIdentitySwitcher,
  notificationsReadEnabled,
  onMarkAllNotificationsRead,
}: {
  flash?: ActivityFlash;
  initialTab?: ActivityTab;
  highlight?: string;
  state: DemoAppState;
  onWithdraw: (requestId: string) => Promise<void>;
  onAccept: (requestId: string) => Promise<void>;
  onConfirm: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onDelete: (matchId: string) => Promise<void>;
  showDemoIdentitySwitcher: boolean;
  notificationsReadEnabled: boolean;
  onMarkAllNotificationsRead?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingActivityAction>(null);
  const currentTab = initialTab;

  const myRequests = useMemo(() => getMyParticipationRequests(state), [state]);
  const hostedMatches = useMemo(() => getHostedMatches(state), [state]);
  const notifications = useMemo(() => getNotificationsForCurrentProfile(state), [state]);
  const unreadNotificationIds = useMemo(() => getUnreadNotificationIds(state), [state]);

  useEffect(() => {
    router.prefetch("/activity?tab=requests");
    router.prefetch("/activity?tab=listings");
  }, [router]);

  function replaceActivityQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();

    if (currentTab) {
      params.set("tab", currentTab);
    }
    if (highlight) {
      params.set("highlight", highlight);
    }
    if (flash) {
      params.set("flash", flash);
    }

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    router.replace(`/activity?${params.toString()}`);
  }

  function handleTabChange(tab: string) {
    replaceActivityQuery({
      tab,
      highlight: undefined,
      flash: undefined,
    });
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
      setError(getUserFacingErrorMessage(acceptError, "요청을 수락하지 못했습니다."));
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
      setError(getUserFacingErrorMessage(rejectError, "요청을 거절하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleConfirm(requestId: string, matchId: string) {
    setError("");
    setPendingAction({ targetId: requestId, kind: "confirm" });

    try {
      await onConfirm(requestId);
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

  async function handleDelete(matchId: string) {
    if (!window.confirm("이 모집을 삭제할까요? 대기 중인 참가 요청은 자동으로 거절됩니다.")) {
      return;
    }

    setError("");
    setPendingAction({ targetId: matchId, kind: "delete" });

    try {
      await onDelete(matchId);
      replaceActivityQuery({
        tab: "listings",
        highlight: undefined,
        flash: "deleted",
      });
    } catch (deleteError) {
      setError(getUserFacingErrorMessage(deleteError, "모집을 삭제하지 못했습니다."));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Activity"
          title="참가 요청과 모집 상태"
          description="보낸 요청과 내가 올린 모집글을 한 곳에서 관리해요."
        />
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

      <NotificationCenter
        notifications={notifications}
        unreadCount={notificationsReadEnabled ? unreadNotificationIds.length : notifications.length}
        onMarkAllRead={notificationsReadEnabled ? onMarkAllNotificationsRead : undefined}
      />

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="requests">내 요청</TabsTrigger>
          <TabsTrigger value="listings">내 모집</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 space-y-3" value="requests">
          {myRequests.length === 0 ? (
            <section className="surface-card rounded-[1.5rem] p-5">
              <p className="text-sm text-muted">아직 보낸 요청이 없습니다.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/home">매치 둘러보기</Link>
              </Button>
            </section>
          ) : (
            myRequests.map((request) => {
              const match = state.matches.find((item) => item.id === request.match_id);

              if (!match) {
                return null;
              }

              return (
                <RequestStatusCard
                  key={request.id}
                  highlighted={highlight === request.id}
                  host={getProfileById(state, request.host_profile_id)}
                  match={match}
                  onWithdraw={() => handleWithdraw(request.id)}
                  request={request}
                  state={state}
                  withdrawPending={
                    pendingAction?.targetId === request.id && pendingAction.kind === "withdraw"
                  }
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent className="mt-4 space-y-3" value="listings">
          {hostedMatches.length === 0 ? (
            <section className="surface-card rounded-[1.5rem] p-5">
              <p className="text-sm text-muted">아직 올린 모집이 없습니다.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/create">매치 만들기</Link>
              </Button>
            </section>
          ) : (
            hostedMatches.map((match) => (
              <HostListingCard
                key={match.id}
                highlighted={highlight === match.id}
                match={match}
                onAccept={(requestId) => handleAccept(requestId, match.id)}
                onConfirm={(requestId) => handleConfirm(requestId, match.id)}
                onDelete={() => handleDelete(match.id)}
                onReject={(requestId) => handleReject(requestId, match.id)}
                pendingRequestAction={
                  pendingAction &&
                  ["accept", "reject", "confirm"].includes(pendingAction.kind)
                    ? {
                        requestId: pendingAction.targetId,
                        kind: pendingAction.kind as "accept" | "reject" | "confirm",
                      }
                    : null
                }
                deletePending={pendingAction?.targetId === match.id && pendingAction.kind === "delete"}
                requests={getInboundRequestsForMatch(state, match.id)}
                state={state}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
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
      onDelete={async (matchId) => {
        actions.cancelMatch(matchId);
      }}
      showDemoIdentitySwitcher
      notificationsReadEnabled
      onMarkAllNotificationsRead={() => {
        const ids = getUnreadNotificationIds(state);
        if (ids.length > 0) {
          actions.markNotificationsRead(ids);
        }
      }}
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
        onDelete={async (matchId) => {
          await cancelMatchAction(matchId);
        }}
        showDemoIdentitySwitcher={false}
        notificationsReadEnabled={false}
      />
    );
  }

  return <DemoActivityScreen flash={flash} highlight={highlight} initialTab={initialTab} />;
}
