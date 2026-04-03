import Link from "next/link";
import { CarFront, Clock, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FeedContext, MatchWithMeta } from "@/lib/types";
import { formatFee, formatRelativeStart } from "@/lib/utils";

function getCardStatusLabel(match: MatchWithMeta) {
  if (match.status === "matched" || match.needed_count <= 0) {
    return "마감";
  }

  if (match.mode === "team") {
    return "팀 모집";
  }

  return `${match.needed_count}자리`;
}

function getCardStatusTone(match: MatchWithMeta, selectedGroupSize: FeedContext["groupSize"]) {
  if (match.status === "matched" || match.needed_count <= 0) {
    return "calm" as const;
  }

  if (match.mode === "team") {
    if (selectedGroupSize >= 6) {
      return "success" as const;
    }

    if (selectedGroupSize === 5) {
      return match.needed_count <= selectedGroupSize ? "soon" as const : "success" as const;
    }

    return "team" as const;
  }

  if (selectedGroupSize >= 6) {
    return "success" as const;
  }

  if (selectedGroupSize === 5) {
    return match.needed_count <= selectedGroupSize ? "soon" as const : "success" as const;
  }

  if (match.needed_count <= selectedGroupSize) {
    return "urgent" as const;
  }

  if (match.needed_count === selectedGroupSize + 1) {
    return "soon" as const;
  }

  return "success" as const;
}

function getMatchFormatLabel(match: MatchWithMeta) {
  if (match.mode === "team") {
    return `${match.min_group_size}v${match.max_group_size}`;
  }

  return "5v5";
}

function estimateCarMinutes(distanceKm: number) {
  return Math.max(1, Math.round(distanceKm * 2.4 + 1));
}

export function MatchCard({
  match,
  detailHref,
  selectedGroupSize,
  preview = false,
}: {
  match: MatchWithMeta;
  detailHref: string;
  selectedGroupSize: FeedContext["groupSize"];
  preview?: boolean;
}) {
  const carMin = estimateCarMinutes(match.distanceKm);
  const statusLabel = getCardStatusLabel(match);
  const statusTone = getCardStatusTone(match, selectedGroupSize);
  const isClosed = match.status === "matched" || match.needed_count <= 0;

  const content = (
    <article className={`surface-card rounded-[1.25rem] px-4 py-3.5 transition active:scale-[0.98] ${isClosed ? "opacity-50" : ""}`}>
      {/* Row 1: Time + Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#112317]" />
          <span className="font-display tabular-nums text-[15px] font-bold tracking-[-0.03em] text-[#112317]">
            {formatRelativeStart(match.minutesUntilStart)}
          </span>
        </div>
        <Badge variant={statusTone} className="px-2 py-0.5 text-[11px]">{statusLabel}</Badge>
      </div>

      {/* Row 2: Venue name */}
      <h3 className="mt-1.5 truncate text-[15px] font-bold tracking-[-0.02em] text-[#112317]">
        {match.title}
      </h3>

      {/* Row 3: Meta chips */}
      <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#5f6c64]">
        <span className="flex items-center gap-1">
          <CarFront className="h-3 w-3" />
          {carMin}분
        </span>
        <span className="text-[#c8cec9]">·</span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {match.distanceKm < 1 ? `${Math.round(match.distanceKm * 1000)}m` : `${match.distanceKm.toFixed(1)}km`}
        </span>
        <span className="text-[#c8cec9]">·</span>
        <span>{match.skill_level}</span>
        <span className="text-[#c8cec9]">·</span>
        <span>{getMatchFormatLabel(match)}</span>
        <span className="text-[#c8cec9]">·</span>
        <span>{formatFee(match.fee)}</span>
      </div>

      {/* Row 4: Slot bar (mini) */}
      <div className="mt-2.5 flex gap-0.5">
        {Array.from({ length: match.mode === "team" ? 1 : 6 }).map((_, i) => {
          const total = match.mode === "team" ? 1 : 6;
          const filled = total === 1 ? i === 0 : i < Math.min(match.needed_count, total);
          return (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${filled ? "bg-[#112317]" : "bg-[#dce3dc]"}`}
            />
          );
        })}
      </div>
    </article>
  );

  if (preview) {
    return content;
  }

  return (
    <Link href={detailHref} className="block">
      {content}
    </Link>
  );
}
