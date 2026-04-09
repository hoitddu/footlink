"use client";

import { BackButton } from "@/components/app/back-button";

export function ScreenHeader({
  href = "/home",
  ariaLabel = "홈으로 돌아가기",
}: {
  href?: string;
  ariaLabel?: string;
}) {
  return (
    <section className="surface-card rounded-[1.55rem] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <BackButton href={href} ariaLabel={ariaLabel} />
        <span className="font-display text-[1.04rem] font-bold tracking-[0.16em] text-[#112317]">
          FOOTLINK
        </span>
        <span className="block h-11 w-11" aria-hidden="true" />
      </div>
    </section>
  );
}
