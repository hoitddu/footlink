"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root className={cn("w-full", className)} {...props} />;
}

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "grid h-11 grid-cols-2 rounded-[1.15rem] bg-[#eef2ee] p-[0.2rem] ring-1 ring-[#112317]/5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center rounded-[0.95rem] px-3.5 text-[0.92rem] font-bold tracking-[-0.02em] text-muted transition data-[state=active]:bg-[#112317] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(6,21,12,0.14)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />;
}
