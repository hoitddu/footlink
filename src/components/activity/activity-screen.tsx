"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { FlashBanner } from "@/components/app/flash-banner";
import { SectionHeading } from "@/components/app/section-heading";
import { HostListingCard } from "@/components/activity/host-listing-card";
import { NotificationCenter } from "@/components/activity/notification-center";
import { RequestStatusCard } from "@/components/activity/request-status-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getHostedMatches,
  getInboundRequestsForMatch,
  getMyParticipationRequests,
  getProfileById,
  getNotificationsForCurrentProfile,
  getUnreadNotificationIds,
} from "@/lib/demo-state/selectors";

type ActivityTab = "requests" | "listings";

export function ActivityScreen({
  flash,
  initialTab = "requests",
  highlight,
}: {
  flash?: "created" | "requested" | "chat_entered" | "accepted" | "rejected" | "withdrawn";
  initialTab?: ActivityTab;
  highlight?: string;
}) {
  const router = useRouter();
  const { state, actions } = useDemoApp();
  const [error, setError] = useState("");
  const currentTab = initialTab;

  const myRequests = useMemo(() => getMyParticipationRequests(state), [state]);
  const hostedMatches = useMemo(() => getHostedMatches(state), [state]);
  const notifications = useMemo(() => getNotificationsForCurrentProfile(state), [state]);
  const unreadNotificationIds = useMemo(() => getUnreadNotificationIds(state), [state]);

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

  function handleWithdraw(requestId: string) {
    setError("");

    try {
      const updated = actions.withdrawParticipation(requestId);
      replaceActivityQuery({
        tab: "requests",
        highlight: updated.id,
        flash: "withdrawn",
      });
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : "요청을 취소하지 못했습니다.");
    }
  }

  function handleAccept(requestId: string) {
    setError("");

    try {
      const updated = actions.acceptParticipation(requestId);
      replaceActivityQuery({
        tab: "listings",
        highlight: updated.match_id,
        flash: "accepted",
      });
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "요청을 수락하지 못했습니다.");
    }
  }

  function handleReject(requestId: string) {
    setError("");

    try {
      const updated = actions.rejectParticipation(requestId);
      replaceActivityQuery({
        tab: "listings",
        highlight: updated.match_id,
        flash: "rejected",
      });
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "요청을 거절하지 못했습니다.");
    }
  }

  function handleMarkAllNotificationsRead() {
    if (unreadNotificationIds.length === 0) {
      return;
    }

    actions.markNotificationsRead(unreadNotificationIds);
  }

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Activity"
          title="참가 요청과 모집 상태"
          description="내가 보낸 요청과 내가 올린 모집을 한 곳에서 관리할 수 있어요."
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

      <DemoIdentitySwitcher />

      <NotificationCenter
        notifications={notifications}
        unreadCount={unreadNotificationIds.length}
        onMarkAllRead={handleMarkAllNotificationsRead}
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
                  host={getProfileById(state, request.host_id)}
                  match={match}
                  onWithdraw={() => handleWithdraw(request.id)}
                  request={request}
                  state={state}
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
                onAccept={handleAccept}
                onReject={handleReject}
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
