"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BusFront,
  CalendarDays,
  CarFront,
  ChevronLeft,
  Clock,
  Footprints,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { JoinIntentSheet } from "@/components/match/join-intent-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildContextQuery, parseFeedContext } from "@/lib/context";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getActiveParticipationForMatch,
  getCurrentProfile,
  getDefaultRequestedCount,
  getMatchMetaForState,
  getParticipationStatusLabel,
} from "@/lib/demo-state/selectors";
import { formatFee, formatStartAt, getTravelEstimates } from "@/lib/utils";
import type { ListingType } from "@/lib/types";

const listingTypeLabels: Record<ListingType, string> = {
  mercenary: "용병 구함",
  partial_join: "부분 합류",
  team_match: "팀매치",
};

function getMatchFormatLabel(match: { mode: string; min_group_size: number; max_group_size: number }) {
  if (match.mode === "team") {
    return `${match.min_group_size}v${match.max_group_size}`;
  }
  return "5v5";
}

export function MatchDetailScreen({
  matchId,
  searchParams,
  referenceNow,
}: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
}) {
  const router = useRouter();
  const { state, actions } = useDemoApp();
  const match = useMemo(() => getMatchMetaForState(state, matchId, referenceNow), [matchId, referenceNow, state]);
  const backContext = parseFeedContext(searchParams);
  const backHref = `/home?${buildContextQuery(backContext)}`;
  const currentProfile = getCurrentProfile(state);
  const activeRequest = match ? getActiveParticipationForMatch(state, match.id) : undefined;
  const canStartJoinFlow = match
    ? match.status === "open" &&
      currentProfile?.id !== match.creator_id &&
      !activeRequest &&
      (match.contact_type !== "openchat" || Boolean(match.contact_value))
    : false;
  const shouldOpenJoinFlow = searchParams.intent === "join";
  const [sheetOpen, setSheetOpen] = useState(() => shouldOpenJoinFlow && canStartJoinFlow);

  if (!match) {
    return (
      <section className="surface-card rounded-[1.25rem] p-5">
        <h1 className="text-lg font-bold text-[#112317]">매치를 찾을 수 없습니다.</h1>
        <Button asChild className="mt-3" size="sm">
          <Link href="/home">홈으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  const resolvedMatch = match;
  const isHostView = currentProfile?.id === resolvedMatch.creator_id;
  const travelEstimates = getTravelEstimates(resolvedMatch.distanceKm).sort((a, b) => a.minutes - b.minutes);
  const defaultRequestedCount = getDefaultRequestedCount(resolvedMatch, backContext);

  const participationMethodLabel =
    "참가 요청";
  const participationFlowLabel = activeRequest
    ? getParticipationStatusLabel(activeRequest.status)
    : resolvedMatch.contact_type === "openchat"
      ? "수락 후 오픈채팅"
      : "요청 후 승인";

  const remainingLabel =
    resolvedMatch.mode === "team"
      ? "팀 모집"
      : resolvedMatch.needed_count <= 0
        ? "마감"
        : `남은 ${resolvedMatch.needed_count}자리`;

  function getPrimaryLabel() {
    if (isHostView) return "내 모집 보기";
    if (!activeRequest) {
      return "참가 요청 보내기";
    }
    return getParticipationStatusLabel(activeRequest.status);
  }

  function getPrimaryHref() {
    if (isHostView) return `/activity?tab=listings&highlight=${resolvedMatch.id}`;
    if (!activeRequest) return null;
    return `/activity?tab=requests&highlight=${activeRequest.id}`;
  }

  async function handleJoinSubmit(input: { requestedCount: number; message: string }) {
    const createdRequest = actions.submitParticipation({
      matchId: resolvedMatch.id,
      requestedCount: input.requestedCount,
      message: input.message,
    });

    router.push(`/activity?tab=requests&highlight=${createdRequest.id}&flash=requested`);
  }

  const primaryHref = getPrimaryHref();

  const travelIcons = { walk: Footprints, transit: BusFront, car: CarFront } as const;

  return (
    <div className="space-y-3 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Button asChild size="icon" variant="secondary">
          <Link href={backHref} aria-label="뒤로 가기">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant={resolvedMatch.statusTone}>{resolvedMatch.statusLabel}</Badge>
      </header>

      {/* Title + meta */}
      <div>
        <h1 className="text-[1.3rem] font-bold tracking-[-0.03em] text-[#112317]">
          {resolvedMatch.title}
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-[#5f6c64]">
          {resolvedMatch.region} · {resolvedMatch.skill_level} · {getMatchFormatLabel(resolvedMatch)} · {remainingLabel}
        </p>
      </div>

      {/* Info rows */}
      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="space-y-3">
          <InfoRow icon={CalendarDays} label="시간" value={formatStartAt(resolvedMatch.start_at)} />
          <InfoRow icon={Tag} label="비용" value={formatFee(resolvedMatch.fee)} />
          <InfoRow icon={Clock} label="유형" value={listingTypeLabels[resolvedMatch.listing_type]} />
          <InfoRow icon={Wallet} label="참여 방식" value={participationMethodLabel} />
          <InfoRow icon={ShieldCheck} label="확정 흐름" value={participationFlowLabel} />
        </div>
      </section>

      {/* Location + travel */}
      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
          <div>
            <p className="text-[13px] font-bold text-[#112317]">{resolvedMatch.address}</p>
            <p className="mt-0.5 text-[12px] text-[#5f6c64]">{resolvedMatch.region}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#5f6c64]">
          {travelEstimates.map((est, i) => {
            const Icon = travelIcons[est.mode];
            return (
              <span key={est.mode} className="flex items-center gap-0.5">
                {i > 0 && <span className="mr-1.5 text-[#c8cec9]">·</span>}
                <Icon className="h-3 w-3" />
                {est.minutes}분
              </span>
            );
          })}
        </div>
      </section>

      {/* Note */}
      {resolvedMatch.note ? (
        <section className="surface-card rounded-[1.25rem] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
            <p className="text-[13px] leading-5 text-[#3a4a3f]">{resolvedMatch.note}</p>
          </div>
        </section>
      ) : null}

      {/* Host */}
      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317]">
            <User className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#112317]">
              {resolvedMatch.organizer?.nickname ?? "FootLink 호스트"}
            </p>
            <p className="text-[12px] text-[#5f6c64]">
              {resolvedMatch.organizer?.preferred_regions.join(" · ") ?? resolvedMatch.region}
              {resolvedMatch.organizer ? ` · ${resolvedMatch.organizer.age}세` : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] px-4 pb-4 pt-3 shadow-[0_-18px_48px_rgba(10,18,13,0.06)]">
        {primaryHref ? (
          <Button asChild className="w-full" size="lg">
            <Link href={primaryHref}>{getPrimaryLabel()}</Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            type="button"
            disabled={
              resolvedMatch.status !== "open" ||
              isHostView ||
              (resolvedMatch.contact_type === "openchat" && !resolvedMatch.contact_value)
            }
            onClick={() => setSheetOpen(true)}
          >
            {getPrimaryLabel()}
          </Button>
        )}
      </div>

      <JoinIntentSheet
        match={resolvedMatch}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultRequestedCount={defaultRequestedCount}
        onSubmit={handleJoinSubmit}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#88948c]" />
      <span className="w-16 shrink-0 text-[12px] font-semibold text-[#88948c]">{label}</span>
      <span className="text-[13px] font-bold text-[#112317]">{value}</span>
    </div>
  );
}
