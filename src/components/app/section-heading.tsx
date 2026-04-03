import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[#5d6d62]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <h2 className="text-[1.85rem] font-bold tracking-[-0.04em] text-foreground">
          {title}
        </h2>
        {description ? <p className="max-w-[32ch] text-sm leading-6 text-muted">{description}</p> : null}
      </div>
    </div>
  );
}
