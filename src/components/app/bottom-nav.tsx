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
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] px-3">
      <nav className="surface-panel relative grid w-full grid-cols-4 rounded-t-[1.7rem] border-x border-t border-white/55 px-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_40px_rgba(10,18,13,0.08)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-[calc(env(safe-area-inset-bottom)+0.7rem)] before:rounded-b-[1.7rem] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.94)_100%)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href === "/home" && pathname.startsWith("/match/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative z-10 flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1.5 py-1.5 text-[10px] font-bold leading-none text-[#5f6a63] transition-all",
                active &&
                  "kinetic-gradient lime-glow rounded-[1.05rem] !text-white shadow-[0_10px_24px_rgba(6,21,12,0.2)] [&_svg]:text-white",
              )}
            >
              <span className="relative">
                <Icon className={cn("h-[1.15rem] w-[1.15rem]", active && "scale-[1.02]")} />
                {item.href === "/activity" && unreadCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex min-h-[0.95rem] min-w-[0.95rem] items-center justify-center rounded-full bg-[#d94b3d] px-1 text-[8px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </span>
              <span className="tracking-[-0.02em]">{item.label}</span>
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
