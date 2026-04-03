"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

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

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAllRead,
}: {
  notifications: DemoNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
}) {
  return (
    <section className="surface-card rounded-[1.75rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Notifications</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-[#112317]">앱 내부 알림</h2>
        </div>
        {unreadCount > 0 ? (
          <Button size="sm" type="button" variant="secondary" onClick={onMarkAllRead}>
            <CheckCheck className="mr-1 h-4 w-4" />
            모두 확인
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-[1.2rem] bg-[#f7f9f7] px-4 py-4 text-sm text-muted">
          아직 알림이 없습니다.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {notifications.slice(0, 6).map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className="block rounded-[1.2rem] bg-[#f7f9f7] p-4 transition hover:bg-[#f1f5f1]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 shrink-0 text-[#112317]" />
                    <p className="truncate font-semibold text-[#112317]">{notification.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#415047]">{notification.body}</p>
                  <p className="mt-2 text-xs font-medium text-muted">{formatCreatedAt(notification.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getNotificationTone(notification)}`}>
                  {notification.read_at ? "확인됨" : "새 알림"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
