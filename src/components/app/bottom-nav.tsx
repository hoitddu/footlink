"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, House, Plus, UserRound } from "lucide-react";

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

  if (hideOnFocusedFlow) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] px-3">
      <nav className="surface-panel relative grid w-full grid-cols-4 rounded-t-[1.7rem] border-x border-t border-white/65 bg-[rgba(255,255,255,0.94)] px-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-14px_40px_rgba(10,18,13,0.08)] before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-[calc(env(safe-area-inset-bottom)+0.7rem)] before:rounded-b-[1.7rem] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.97)_100%)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href === "/home" && pathname.startsWith("/match/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative z-10 flex min-h-[3.4rem] flex-col items-center justify-center gap-1 rounded-[1rem] px-1.5 py-1.5 transition-all",
                active
                  ? "kinetic-gradient lime-glow rounded-[1.05rem] text-white shadow-[0_10px_24px_rgba(6,21,12,0.2)] [&_svg]:text-white"
                  : "text-[#2c3a32] hover:bg-[#f3f6f2] [&_svg]:text-[#34433b]",
              )}
            >
              <Icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active && "scale-[1.02]")} />
              <span
                className={cn(
                  "block text-[11px] font-semibold leading-[1.05] tracking-[-0.02em]",
                  active ? "text-white" : "text-[#2f3d34]",
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
