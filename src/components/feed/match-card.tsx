import Link from "next/link";
import { BusFront, CarFront, Clock, Footprints, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatSkillLevel } from "@/lib/utils";
import type { FeedContext, MatchWithMeta } from "@/lib/types";
import { formatFee, formatRelativeStart } from "@/lib/utils";

function getCardStatusLabel(match: MatchWithMeta) {
  if (match.status === "matched" || match.remaining_slots <= 0) {
    return "마감";
  }

  if (match.mode === "team") {
    return "팀 모집";
  }

  return `${match.remaining_slots}자리`;
}

function getCardStatusTone(match: MatchWithMeta, selectedGroupSize: FeedContext["groupSize"]) {
  if (match.status === "matched" || match.remaining_slots <= 0) {
    return "calm" as const;
  }

  if (match.mode === "team") {
    if (selectedGroupSize >= 6) {
      return "success" as const;
    }

    if (selectedGroupSize === 5) {
      return match.remaining_slots <= selectedGroupSize ? "soon" as const : "success" as const;
    }

    return "team" as const;
  }

  if (selectedGroupSize >= 6) {
    return "success" as const;
  }

  if (selectedGroupSize === 5) {
    return match.remaining_slots <= selectedGroupSize ? "soon" as const : "success" as const;
  }

  if (match.remaining_slots <= selectedGroupSize) {
    return "urgent" as const;
  }

  if (match.remaining_slots === selectedGroupSize + 1) {
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

function formatDistanceShort(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function estimateWalkMinutes(km: number) {
  return Math.max(1, Math.round(km * 12));
}

function estimateTransitMinutes(km: number) {
  return Math.max(8, Math.round(km * 4.5 + 6));
}

function estimateCarMinutes(km: number) {
  return Math.max(1, Math.round(km * 2.4 + 1));
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
  const walkMin = estimateWalkMinutes(match.distanceKm);
  const transitMin = estimateTransitMinutes(match.distanceKm);
  const carMin = estimateCarMinutes(match.distanceKm);

  const travelModes: Array<{ icon: typeof CarFront; min: number; show: boolean }> = [
    { icon: Footprints, min: walkMin, show: walkMin <= 30 },
    { icon: BusFront, min: transitMin, show: true },
    { icon: CarFront, min: carMin, show: true },
  ];
  const visibleTravel = travelModes
    .filter((t) => t.show)
    .sort((a, b) => a.min - b.min);

  const statusLabel = getCardStatusLabel(match);
  const statusTone = getCardStatusTone(match, selectedGroupSize);
  const isClosed = match.status === "matched" || match.remaining_slots <= 0;

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

      {/* Row 2: Venue name + distance */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <h3 className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#112317]">
          {match.title}
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#5f6c64]">
          <MapPin className="h-3 w-3" />
          {formatDistanceShort(match.distanceKm)}
        </span>
      </div>

      {/* Row 3: Travel estimates + meta */}
      <div className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#5f6c64]">
        {visibleTravel.map((t, i) => (
          <span key={t.min} className="flex items-center gap-0.5">
            {i > 0 && <span className="mr-1.5 text-[#c8cec9]">·</span>}
            <t.icon className="h-3 w-3" />
            {t.min}분
          </span>
        ))}
        <span className="text-[#c8cec9]">·</span>
        <span>{formatSkillLevel(match.skill_level)}</span>
        <span className="text-[#c8cec9]">·</span>
        <span>{getMatchFormatLabel(match)}</span>
        <span className="text-[#c8cec9]">·</span>
        <span>{formatFee(match.fee)}</span>
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
