"use client";

import { BellDot, Inbox } from "lucide-react";
import { useMemo, useState } from "react";

import { markNotificationsReadAction } from "@/app/actions/requests";
import { NotificationCenter } from "@/components/activity/notification-center";
import { BackButton } from "@/components/app/back-button";
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
    <div className="space-y-3">
      <section className="surface-card rounded-[1.55rem] px-4 pb-4 pt-3.5">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <BackButton href="/home" ariaLabel="홈으로 돌아가기" />
          <span className="text-center font-display text-[1.05rem] font-bold tracking-[0.16em] text-[#112317]">
            FOOTLINK
          </span>
          <div className="h-11 w-11" aria-hidden="true" />
        </div>

        <div className="mt-4 px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">
            Notifications
          </p>
          <h1 className="mt-2 text-[1.95rem] font-bold tracking-[-0.05em] text-[#112317]">알림함</h1>
        </div>
      </section>

      <section className="surface-card rounded-[1.3rem] p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`flex min-h-12 items-center justify-between rounded-[1rem] px-3.5 py-2.5 text-left transition ${
              filter === "unread" ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#223128]"
            }`}
          >
            <span className="flex items-center gap-2 text-[0.95rem] font-bold">
              <BellDot className="h-4 w-4" />
              미확인
            </span>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold text-inherit">
              {unreadNotificationIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex min-h-12 items-center justify-between rounded-[1rem] px-3.5 py-2.5 text-left transition ${
              filter === "all" ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#223128]"
            }`}
          >
            <span className="flex items-center gap-2 text-[0.95rem] font-bold">
              <Inbox className="h-4 w-4" />
              전체
            </span>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-bold text-inherit">
              {resolvedNotifications.length}
            </span>
          </button>
        </div>
      </section>

      <NotificationCenter
        notifications={filteredNotifications}
        unreadCount={unreadNotificationIds.length}
        title={filter === "unread" ? "미확인 알림" : "전체 알림"}
        description=""
        emptyMessage={filter === "unread" ? "아직 확인할 알림이 없습니다." : "아직 도착한 알림이 없습니다."}
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
