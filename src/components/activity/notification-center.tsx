"use client";

import Link from "next/link";
import {
  BellRing,
  CheckCheck,
  CircleX,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getNotificationTone } from "@/lib/demo-state/selectors";
import type { DemoNotification } from "@/lib/types";

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function getNotificationIcon(notification: DemoNotification) {
  if (notification.kind === "host_request_received") {
    return UserPlus;
  }

  if (notification.kind === "request_rejected") {
    return CircleX;
  }

  if (notification.kind === "request_confirmed") {
    return ShieldCheck;
  }

  return BellRing;
}

function getNotificationIconTone(notification: DemoNotification) {
  if (notification.kind === "host_request_received") {
    return "bg-[#fff0d7] text-[#9a6111]";
  }

  if (notification.kind === "request_rejected") {
    return "bg-[#f6f1f0] text-[#6b5852]";
  }

  return "bg-[#e4f6e8] text-[#1f7a38]";
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  limit,
  title = "알림",
  description = "중요한 상태 변경을 한 곳에서 확인하세요.",
  emptyMessage = "아직 알림이 없습니다.",
}: {
  notifications: DemoNotification[];
  unreadCount: number;
  onMarkAllRead?: () => void | Promise<void>;
  onMarkRead?: (notificationId: string) => void | Promise<void>;
  limit?: number;
  title?: string;
  description?: string;
  emptyMessage?: string;
}) {
  const visibleNotifications = typeof limit === "number" ? notifications.slice(0, limit) : notifications;

  return (
    <section className="surface-card rounded-[1.6rem] px-5 py-[1.1rem]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Notifications</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-[#112317]">{title}</h2>
          <p className="mt-1 text-sm text-[#5f6c64]">{description}</p>
        </div>
        {unreadCount > 0 && onMarkAllRead ? (
          <Button
            className="h-9 rounded-[0.95rem] px-3 text-[13px]"
            size="sm"
            type="button"
            variant="secondary"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            모두 읽음
          </Button>
        ) : null}
      </div>

      {visibleNotifications.length === 0 ? (
        <div className="mt-4 rounded-[1.1rem] bg-[#f7f9f7] px-4 py-4 text-sm text-muted">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {visibleNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification);

            return (
              <Link
                key={notification.id}
                href={notification.href}
                className="block rounded-[1.1rem] bg-[#f7f9f7] px-4 py-3.5 transition hover:bg-[#f1f5f1]"
                onClick={() => {
                  if (!notification.read_at) {
                    void onMarkRead?.(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getNotificationIconTone(notification)}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#112317]">{notification.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[#415047]">{notification.body}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getNotificationTone(notification)}`}
                      >
                        {notification.read_at ? "읽음" : "새 알림"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-muted">{formatCreatedAt(notification.created_at)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
