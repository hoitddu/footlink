import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold tracking-[0.01em]",
  {
    variants: {
      variant: {
        urgent: "bg-[#ffe3de] text-[#c3342b]",
        soon: "bg-[#fff0d7] text-[#9a6111]",
        success: "bg-[#e4f6e8] text-[#1f7a38]",
        team: "bg-[#dce8ff] text-[#2455a6]",
        calm: "bg-[#eef2ee] text-[#536157]",
        outline: "bg-white/72 text-foreground ring-1 ring-black/5",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
