import Link from "next/link";
import { BusFront, CarFront, Clock3, Footprints } from "lucide-react";

import { getMatchFormatLabel } from "@/lib/match-format";
import type { MatchWithMeta } from "@/lib/types";
import { cn, formatFee, formatTimeRange, getTravelEstimates } from "@/lib/utils";

function formatCardSchedule(date: string, durationMinutes: number, showDate: boolean) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(new Date(date));
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const dayOfWeek = parts.find((part) => part.type === "weekday")?.value ?? "";
  const timeRange = formatTimeRange(date, durationMinutes);

  if (!showDate) {
    return timeRange;
  }

  return `${month}.${day} (${dayOfWeek}) ${timeRange}`;
}

function TravelIcon({ mode }: { mode: "walk" | "car" | "transit" }) {
  if (mode === "walk") {
    return <Footprints className="h-3 w-3" />;
  }

  if (mode === "car") {
    return <CarFront className="h-3 w-3" />;
  }

  return <BusFront className="h-3 w-3" />;
}

export function MatchCard({
  match,
  detailHref,
  showDate = true,
}: {
  match: MatchWithMeta;
  detailHref: string;
  showDate?: boolean;
}) {
  const travelEstimate = getTravelEstimates(match.distanceKm)
    .filter((estimate) => estimate.mode !== "walk" || estimate.minutes < 30)
    .sort((left, right) => left.minutes - right.minutes)[0];
  const remainingLabel =
    match.remaining_slots <= 0 || match.status !== "open"
      ? "마감"
      : match.remaining_slots === 1
        ? "1자리"
        : `${match.remaining_slots}자리`;
  const formatLabel = getMatchFormatLabel(match);
  const showGoalkeeperBadge = match.position_targets.includes("goalkeeper");

  return (
    <Link href={detailHref} className="block">
      <article className="surface-card rounded-[1.05rem] px-3.5 py-3 transition active:scale-[0.99]">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-1.5 text-[#112317]">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <p className="truncate text-[0.93rem] font-bold tracking-[-0.03em]">
                {formatCardSchedule(match.start_at, match.duration_minutes, showDate)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                match.remaining_slots === 1
                  ? "bg-[#06150c] text-white"
                  : "bg-[#eef2ee] text-[#445149]",
              )}
            >
              {remainingLabel}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[1rem] font-semibold tracking-[-0.03em] text-[#112317]">
              {match.title}
            </h3>
            {showGoalkeeperBadge ? (
              <span className="shrink-0 rounded-full bg-[#e7f4da] px-2 py-0.5 text-[10px] font-bold text-[#254712]">
                GK
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#66736a]">
            {travelEstimate ? (
              <span className="inline-flex items-center gap-1">
                <TravelIcon mode={travelEstimate.mode} />
                {travelEstimate.label}
              </span>
            ) : null}
            {formatLabel ? <span>· {formatLabel}</span> : null}
            <span>· {formatFee(match.fee)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
