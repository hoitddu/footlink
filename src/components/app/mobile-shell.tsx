import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="app-bottom-nav-offset mx-auto min-h-[100dvh] w-full max-w-[430px] px-4 pt-3">
      <main className={cn("space-y-3", className)}>{children}</main>
    </div>
  );
}
