"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-[#091511]/40 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          "fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 rounded-t-[2rem] border border-white/60 bg-[#f8faf7] px-5 pb-7 pt-4 shadow-[0_-20px_60px_rgba(9,21,17,0.18)] outline-none",
          "safe-bottom",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-black/10" />
        <Dialog.Close className="absolute right-5 top-4 rounded-full bg-black/5 p-2 text-muted transition hover:bg-black/10">
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
