import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-bold tracking-[0.01em]",
  {
    variants: {
      variant: {
        urgent: "bg-[#f7ddd2] text-[#8e3e32]",
        soon: "bg-[#efe4c5] text-[#7b6020]",
        success: "bg-[#dfede0] text-[#295d3a]",
        team: "bg-[#e6eee4] text-[#365341]",
        calm: "bg-[#edf2ea] text-[#536157]",
        outline: "bg-white/82 text-foreground ring-1 ring-black/6",
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
