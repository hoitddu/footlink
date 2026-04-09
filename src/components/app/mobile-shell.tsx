import { cn } from "@/lib/utils";

export function MobileShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="app-bottom-nav-offset relative mx-auto min-h-[100dvh] w-full max-w-[430px] px-4 pt-3">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[12.5rem] rounded-b-[2.6rem] bg-[radial-gradient(circle_at_top,rgba(199,243,107,0.12),transparent_24%),linear-gradient(180deg,rgba(13,22,16,0.98)_0%,rgba(19,31,24,0.96)_72%,rgba(19,31,24,0)_100%)]"
      />
      <main className={cn("space-y-3", className)}>{children}</main>
    </div>
  );
}
