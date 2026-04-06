"use client";

import Link from "next/link";
import { BellDot, ChevronLeft, Inbox } from "lucide-react";
import { useMemo, useState } from "react";

import { markNotificationsReadAction } from "@/app/actions/requests";
import { NotificationCenter } from "@/components/activity/notification-center";
import { BrandHeader } from "@/components/app/brand-header";
import { SectionHeading } from "@/components/app/section-heading";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getNotificationsForCurrentProfile } from "@/lib/demo-state/selectors";
import type { DemoAppState } from "@/lib/types";

type InboxFilter = "unread" | "all";

function NotificationsScreenBody({
  state,
  notificationsReadEnabled,
  onMarkNotificationsRead,
}: {
  state: DemoAppState;
  notificationsReadEnabled: boolean;
  onMarkNotificationsRead?: (notificationIds: string[]) => void | Promise<void>;
}) {
  const notifications = useMemo(() => getNotificationsForCurrentProfile(state), [state]);
  const [optimisticReadIds, setOptimisticReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<InboxFilter>(() =>
    notifications.some((notification) => !notification.read_at) ? "unread" : "all",
  );

  const localReadIds = useMemo(
    () =>
      new Set([
        ...notifications
          .filter((notification) => notification.read_at)
          .map((notification) => notification.id),
        ...optimisticReadIds,
      ]),
    [notifications, optimisticReadIds],
  );

  const resolvedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        read_at: localReadIds.has(notification.id)
          ? notification.read_at ?? new Date().toISOString()
          : notification.read_at,
      })),
    [localReadIds, notifications],
  );

  const unreadNotificationIds = useMemo(
    () =>
      resolvedNotifications
        .filter((notification) => !notification.read_at)
        .map((notification) => notification.id),
    [resolvedNotifications],
  );

  const filteredNotifications = useMemo(
    () =>
      filter === "unread"
        ? resolvedNotifications.filter((notification) => !notification.read_at)
        : resolvedNotifications,
    [filter, resolvedNotifications],
  );

  async function handleMarkRead(notificationIds: string[]) {
    if (notificationIds.length === 0) {
      return;
    }

    setOptimisticReadIds((current) => Array.from(new Set([...current, ...notificationIds])));
    await onMarkNotificationsRead?.(notificationIds);
  }

  return (
    <div className="space-y-4">
      <section className="surface-card rounded-[1.75rem] p-5">
        <BrandHeader
          left={
            <Link
              href="/home"
              aria-label="홈으로 돌아가기"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/78 text-[#112317] shadow-[0_12px_30px_rgba(6,21,12,0.05)] transition active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          }
          center={
            <span className="font-display text-[1.08rem] font-bold tracking-[0.16em] text-[#112317]">
              FOOTLINK
            </span>
          }
          right={
            <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736a]">
              Inbox
            </div>
          }
        />

        <SectionHeading
          className="mt-4"
          eyebrow="Notifications"
          title="알림함"
          description="참가 요청, 수락, 거절, 최종 확정을 홈에서 바로 관리하세요."
        />
      </section>

      <section className="surface-card rounded-[1.5rem] p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`flex items-center justify-between rounded-[1rem] px-4 py-3 text-left transition ${
              filter === "unread"
                ? "kinetic-gradient text-white"
                : "bg-[#eef2ee] text-[#223128]"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <BellDot className="h-4.5 w-4.5" />
              미확인
            </span>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold text-inherit">
              {unreadNotificationIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex items-center justify-between rounded-[1rem] px-4 py-3 text-left transition ${
              filter === "all"
                ? "kinetic-gradient text-white"
                : "bg-[#eef2ee] text-[#223128]"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Inbox className="h-4.5 w-4.5" />
              전체
            </span>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold text-inherit">
              {resolvedNotifications.length}
            </span>
          </button>
        </div>
      </section>

      <NotificationCenter
        notifications={filteredNotifications}
        unreadCount={unreadNotificationIds.length}
        title={filter === "unread" ? "미확인 알림" : "전체 알림"}
        description={
          filter === "unread"
            ? "아직 확인하지 않은 알림만 모아 보여줍니다."
            : "최근 알림을 시간순으로 모두 보여줍니다."
        }
        emptyMessage={
          filter === "unread"
            ? "새로 확인할 알림이 없습니다. 전체 탭에서 지난 알림을 볼 수 있어요."
            : "아직 도착한 알림이 없습니다."
        }
        onMarkAllRead={
          notificationsReadEnabled
            ? async () => {
                await handleMarkRead(unreadNotificationIds);
              }
            : undefined
        }
        onMarkRead={
          notificationsReadEnabled
            ? async (notificationId) => {
                await handleMarkRead([notificationId]);
              }
            : undefined
        }
      />
    </div>
  );
}

function DemoNotificationsScreen() {
  const { state, actions } = useDemoApp();

  return (
    <NotificationsScreenBody
      state={state}
      notificationsReadEnabled
      onMarkNotificationsRead={(notificationIds) => {
        if (notificationIds.length > 0) {
          actions.markNotificationsRead(notificationIds);
        }
      }}
    />
  );
}

export function NotificationsScreen({ stateSnapshot }: { stateSnapshot?: DemoAppState }) {
  if (stateSnapshot) {
    return (
      <NotificationsScreenBody
        state={stateSnapshot}
        notificationsReadEnabled
        onMarkNotificationsRead={async (notificationIds) => {
          await markNotificationsReadAction(notificationIds);
        }}
      />
    );
  }

  return <DemoNotificationsScreen />;
}
