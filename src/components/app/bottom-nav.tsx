"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, House, Plus, UserRound } from "lucide-react";

import { getAppDataSource } from "@/lib/app-config";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getUnreadNotificationCount } from "@/lib/demo-state/selectors";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "홈", icon: House },
  { href: "/create", label: "매치생성", icon: Plus },
  { href: "/activity", label: "활동", icon: ClipboardList },
  { href: "/profile", label: "프로필", icon: UserRound },
];

function BottomNavFrame({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideOnFocusedFlow =
    pathname.startsWith("/match/") || pathname.startsWith("/create");

  useEffect(() => {
    items.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  if (hideOnFocusedFlow) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[430px] px-4 pb-4">
      <nav className="surface-panel safe-bottom grid w-full grid-cols-4 rounded-[1.85rem] px-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href === "/home" && pathname.startsWith("/match/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[1.25rem] px-2 py-3 text-[11px] font-bold text-[#112317] transition-all",
                active && "kinetic-gradient lime-glow -translate-y-1 !text-white [&_svg]:text-white",
              )}
            >
              <span className="relative">
                <Icon className="h-4 w-4" />
                {item.href === "/activity" && unreadCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#d94b3d] px-1 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DemoBottomNav() {
  const { state } = useDemoApp();
  return <BottomNavFrame unreadCount={getUnreadNotificationCount(state)} />;
}

export function BottomNav() {
  if (getAppDataSource() === "demo") {
    return <DemoBottomNav />;
  }

  return <BottomNavFrame unreadCount={0} />;
}
