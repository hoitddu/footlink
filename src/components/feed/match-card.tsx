import Link from "next/link";
import { ArrowUpRight, BusFront, CarFront, Footprints, Gauge, MapPin, Wallet } from "lucide-react";

import { SlotProgress } from "@/components/feed/slot-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeedContext, MatchWithMeta } from "@/lib/types";
import {
  formatDistanceValue,
  formatFee,
  formatRelativeStart,
  getTravelEstimates,
  type TravelEstimate,
} from "@/lib/utils";

function getCardStatusLabel(match: MatchWithMeta) {
  if (match.status === "matched" || match.needed_count <= 0) {
    return "모집 완료";
  }

  if (match.mode === "team") {
    return "상대 팀 모집";
  }

  return `${match.needed_count}자리 남음`;
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

function TravelIcon({ mode }: { mode: TravelEstimate["mode"] }) {
  if (mode === "walk") {
    return <Footprints className="h-[18px] w-[18px] shrink-0 text-[#112317]" />;
  }

  if (mode === "transit") {
    return <BusFront className="h-[18px] w-[18px] shrink-0 text-[#112317]" />;
  }

  return <CarFront className="h-[18px] w-[18px] shrink-0 text-[#112317]" />;
}

function getMatchFormatLabel(match: MatchWithMeta) {
  if (match.mode === "team") {
    return `${match.min_group_size}vs${match.max_group_size}`;
  }

  return "5vs5";
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
  const travelEstimates = getTravelEstimates(match.distanceKm);
  const primaryTravelEstimates = travelEstimates.slice(0, 3);
  const participateHref = detailHref.includes("?") ? `${detailHref}&intent=join` : `${detailHref}?intent=join`;
  const compactTravelLabel = (estimate: TravelEstimate) => `${estimate.minutes}분`;

  return (
    <article className="surface-card overflow-hidden rounded-[1.6rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
            KICKOFF
          </p>
          <p className="mt-1 tabular-nums text-[1.9rem] font-bold tracking-[-0.06em] text-[#112317]">
            {formatRelativeStart(match.minutesUntilStart)}
          </p>
        </div>
        <Badge variant={getCardStatusTone(match, selectedGroupSize)}>{getCardStatusLabel(match)}</Badge>
      </div>

      <div className="mt-5 space-y-2.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">
            경기장
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-3">
            <h3 className="text-[1.4rem] font-bold tracking-[-0.04em] text-[#112317]">
              {match.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#5f6c64]">
              <MapPin className="h-4 w-4 text-[#112317]" />
              <span>{formatDistanceValue(match.distanceKm)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {primaryTravelEstimates.map((estimate) => (
            <div key={estimate.mode} className="rounded-[1.1rem] bg-[#eef2ee] px-3 py-3">
              <div className="flex items-center justify-center gap-2 text-sm font-semibold leading-none text-[#4f5b53]">
                <TravelIcon mode={estimate.mode} />
                <span className="pt-[1px] text-[#112317]">{compactTravelLabel(estimate)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[1.1rem] bg-[#eef2ee] px-3 py-3">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold leading-none text-[#4f5b53]">
              <Gauge className="h-[18px] w-[18px] shrink-0 text-[#112317]" />
              <span className="pt-[1px] text-[#112317]">{match.skill_level}</span>
            </div>
          </div>
          <div className="rounded-[1.1rem] bg-[#eef2ee] px-3 py-3">
            <div className="flex items-center justify-center text-sm font-semibold leading-none text-[#112317]">
              <span className="pt-[1px]">{getMatchFormatLabel(match)}</span>
            </div>
          </div>
          <div className="rounded-[1.1rem] bg-[#eef2ee] px-3 py-3">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold leading-none text-[#4f5b53]">
              <Wallet className="h-[18px] w-[18px] shrink-0 text-[#112317]" />
              <span className="pt-[1px] text-[#112317]">{formatFee(match.fee)}</span>
            </div>
          </div>
        </div>

        <SlotProgress mode={match.mode} remaining={match.needed_count} compact />
      </div>

      <div className="mt-5 flex gap-2">
        {preview ? (
          <>
            <Button className="flex-1" size="sm" disabled type="button">
              참가하기
            </Button>
            <Button className="flex-1" size="sm" variant="secondary" disabled type="button">
              상세 보기
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="flex-1" size="sm">
              <Link href={participateHref}>참가하기</Link>
            </Button>
            <Button asChild className="flex-1" size="sm" variant="secondary">
              <Link href={detailHref}>
                상세 보기
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
