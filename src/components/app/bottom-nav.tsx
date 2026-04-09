"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, Plus, UserRound } from "lucide-react";

import { warmActivitySnapshot } from "@/lib/activity-snapshot-client";
import { warmCurrentProfile } from "@/lib/current-profile-client";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", label: "홈", icon: House },
  { href: "/activity", label: "활동", icon: ClipboardList },
  { href: "/create", label: "용병모집", icon: Plus },
  { href: "/profile", label: "프로필", icon: UserRound },
];

function BottomNavFrame() {
  const pathname = usePathname();
  const hideOnFocusedFlow = pathname.startsWith("/match/") || pathname.startsWith("/create");

  function prefetchLinkedState(href: string) {
    if (href === "/activity" || href === "/create" || href === "/profile") {
      void warmCurrentProfile();
    }

    if (href !== "/activity") {
      return;
    }

    void warmActivitySnapshot().catch(() => {
      // Best-effort prefetch only.
    });
  }

  if (hideOnFocusedFlow) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] px-3">
      <nav className="relative grid w-full grid-cols-4 rounded-[1.7rem] border border-[rgba(231,240,232,0.08)] bg-[linear-gradient(180deg,rgba(17,28,21,0.96)_0%,rgba(13,22,16,0.98)_100%)] px-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-18px_44px_rgba(4,10,6,0.28)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href === "/home" && pathname.startsWith("/match/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchLinkedState(item.href)}
              onFocus={() => prefetchLinkedState(item.href)}
              onTouchStart={() => prefetchLinkedState(item.href)}
              className={cn(
                "relative z-10 flex min-h-[3.4rem] flex-col items-center justify-center gap-1 rounded-[1rem] px-1.5 py-1.5 transition-all",
                active
                  ? "rounded-[1.05rem] bg-[#f4f7f1] text-[#112317] shadow-[0_12px_24px_rgba(4,10,6,0.22)] [&_svg]:text-[#112317]"
                  : "text-[#b2c0b3] hover:bg-white/[0.05] [&_svg]:text-[#aab8ac]",
              )}
            >
              <Icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active && "scale-[1.02]")} />
              <span
                className={cn(
                  "block text-[11px] font-semibold leading-[1.05] tracking-[-0.02em]",
                  active ? "text-[#112317]" : "text-[#b6c4b7]",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function BottomNav() {
  return <BottomNavFrame />;
}
