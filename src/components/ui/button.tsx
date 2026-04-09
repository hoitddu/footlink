import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[1.05rem] text-sm font-bold tracking-[-0.02em] transition-all outline-none focus-visible:ring-4 focus-visible:ring-[#c7f36b]/18 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "kinetic-gradient !text-white shadow-[0_18px_36px_rgba(6,21,12,0.16)] hover:brightness-[1.03] [&_svg]:text-white",
        secondary:
          "surface-subcard text-[#112317] shadow-[0_10px_22px_rgba(10,18,13,0.06)] hover:bg-white/92 [&_svg]:text-[#112317]",
        ghost: "bg-transparent text-[#112317] hover:bg-[#112317]/4",
        subtle: "bg-accent-soft text-accent hover:bg-[#caff87]/24",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-sm",
        lg: "h-[3.45rem] px-6 text-[15px]",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
