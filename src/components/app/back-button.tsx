"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

const backButtonClassName =
  "flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/78 text-[#112317] shadow-[0_12px_30px_rgba(6,21,12,0.05)] transition active:scale-95";

export function BackButton({
  href,
  onClick,
  ariaLabel = "뒤로 가기",
  className,
}: {
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cn(backButtonClassName, className)}>
        <ArrowLeft className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cn(backButtonClassName, className)}>
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}
