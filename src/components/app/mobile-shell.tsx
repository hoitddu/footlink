import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] px-4 pb-28 pt-5">
      <main className={cn("space-y-5", className)}>{children}</main>
    </div>
  );
}
