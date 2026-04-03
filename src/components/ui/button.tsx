import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold transition-all outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "kinetic-gradient !text-white shadow-[0_18px_36px_rgba(6,21,12,0.18)] hover:brightness-105 [&_svg]:text-white",
        secondary:
          "bg-[#eef2ee] text-[#112317] ring-1 ring-[#112317]/6 hover:bg-[#e7ede6] [&_svg]:text-[#112317]",
        ghost: "bg-transparent text-[#112317] hover:bg-black/4",
        subtle: "bg-accent-soft text-accent hover:bg-[#caff87]/28",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-6 text-base",
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
