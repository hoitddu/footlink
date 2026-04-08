import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, MessageCircleMore } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { MatchWithMeta } from "@/lib/types";
import { formatDistanceValue, formatFee, formatSportType, formatStartAt, formatUrgencyLabel } from "@/lib/utils";

function getRemainingLabel(match: MatchWithMeta) {
  if (match.remaining_slots <= 0 || match.status !== "open") {
    return "마감";
  }

  return `${match.remaining_slots}자리 남음`;
}

export function MatchCard({
  match,
  detailHref,
}: {
  match: MatchWithMeta;
  detailHref: string;
}) {
  const heroLabel =
    match.urgencyLevel === "last_spot" ? "1자리 긴급" : formatUrgencyLabel(match.start_at, match.minutesUntilStart);

  return (
    <Link href={detailHref} className="block">
      <article className="surface-card rounded-[1.45rem] px-4 py-4 transition active:scale-[0.985]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={match.statusTone} className="px-2.5 py-1 text-[11px]">
                {heroLabel}
              </Badge>
              <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#445149]">
                {formatSportType(match.sport_type ?? "futsal")}
              </span>
              {match.contactAvailable ? (
                <span className="rounded-full bg-[#e7f4da] px-2.5 py-1 text-[11px] font-bold text-[#254712]">
                  오픈채팅 가능
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="text-[1.05rem] font-bold tracking-[-0.03em] text-[#112317]">{match.title}</h3>
              <p className="mt-1 text-[13px] font-semibold text-[#4f5d55]">{getRemainingLabel(match)}</p>
            </div>
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#93a097]" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 text-[12px] font-semibold text-[#5f6c64]">
          <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-[#112317]" />
              <span className="text-[#112317]">{formatStartAt(match.start_at)}</span>
            </div>
          </div>
          <div className="rounded-[1rem] bg-[#f4f7f3] px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#112317]" />
              <span className="text-[#112317]">{formatDistanceValue(match.distanceKm)}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[13px] font-semibold text-[#334139]">
          <span>{formatFee(match.fee)}</span>
          <div className="flex items-center gap-1.5 text-[#66736a]">
            {match.contactAvailable ? <MessageCircleMore className="h-3.5 w-3.5" /> : null}
            <span>{match.contactAvailable ? "바로 연락 가능" : "앱에서 요청"}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
