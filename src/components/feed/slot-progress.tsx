import type { EntryMode } from "@/lib/types";

export function SlotProgress({
  mode,
  remaining,
  compact = false,
}: {
  mode: EntryMode;
  remaining: number;
  compact?: boolean;
}) {
  const total = mode === "team" ? 1 : 6;
  const active = Math.min(remaining, total);
  const label = mode === "team" ? "상대 팀 1팀 찾는 중" : `남은 자리 ${remaining}명`;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      {compact ? <span className="sr-only">{label}</span> : null}
      {compact ? null : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
            Remaining
          </span>
          <span className="text-xs font-semibold text-[#55625a]">{label}</span>
        </div>
      )}
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: total === 1 ? 6 : total }).map((_, index) => {
          const filled = total === 1 ? index === 0 : index < active;

          return (
            <span
              key={`${label}-${index}`}
              className={`h-2 rounded-full transition ${
                filled ? "bg-[#112317]" : "bg-[#dce3dc]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
