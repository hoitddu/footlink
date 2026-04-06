import { cn } from "@/lib/utils";

export function BrandHeader({
  left,
  center,
  right,
  className,
}: {
  left: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-11 items-center justify-between gap-3", className)}>
      <div className="flex min-w-[2.75rem] items-center">{left}</div>
      <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      <div className="flex min-w-[2.75rem] justify-end">{right}</div>
    </div>
  );
}
