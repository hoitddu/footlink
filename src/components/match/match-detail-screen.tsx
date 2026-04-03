"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BusFront,
  CarFront,
  ChevronLeft,
  Footprints,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { SectionHeading } from "@/components/app/section-heading";
import { JoinIntentSheet } from "@/components/match/join-intent-sheet";
import { SlotProgress } from "@/components/feed/slot-progress";
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
import { formatFee, formatStartAt, getTravelEstimates, type TravelEstimate } from "@/lib/utils";
import type { ListingType } from "@/lib/types";

const listingTypeLabels: Record<ListingType, string> = {
  mercenary: "용병 구함",
  partial_join: "부분 합류",
  team_match: "팀매치",
};

function TravelIcon({ mode }: { mode: TravelEstimate["mode"] }) {
  if (mode === "walk") {
    return <Footprints className="h-4 w-4" />;
  }

  if (mode === "transit") {
    return <BusFront className="h-4 w-4" />;
  }

  return <CarFront className="h-4 w-4" />;
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
      <section className="surface-card rounded-[1.75rem] p-6">
        <h1 className="text-xl font-bold text-[#112317]">매치를 찾을 수 없습니다.</h1>
        <Button asChild className="mt-4" size="lg">
          <Link href="/home">홈으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  const resolvedMatch = match;
  const isHostView = currentProfile?.id === resolvedMatch.creator_id;
  const travelEstimates = getTravelEstimates(resolvedMatch.distanceKm);
  const defaultRequestedCount = getDefaultRequestedCount(resolvedMatch, backContext);

  function getPrimaryLabel() {
    if (isHostView) {
      return "내 모집 보기";
    }

    if (!activeRequest) {
      return resolvedMatch.contact_type === "openchat" ? "오픈채팅 입장" : "참가 요청 보내기";
    }

    return getParticipationStatusLabel(activeRequest.status);
  }

  function getPrimaryHref() {
    if (isHostView) {
      return `/activity?tab=listings&highlight=${resolvedMatch.id}`;
    }

    if (!activeRequest) {
      return null;
    }

    return `/activity?tab=requests&highlight=${activeRequest.id}`;
  }

  async function handleJoinSubmit(input: { requestedCount: number; message: string }) {
    const createdRequest = actions.submitParticipation({
      matchId: resolvedMatch.id,
      requestedCount: input.requestedCount,
      message: input.message,
    });

    if (resolvedMatch.contact_type === "openchat" && resolvedMatch.contact_value) {
      window.open(resolvedMatch.contact_value, "_blank", "noopener,noreferrer");
    }

    router.push(
      `/activity?tab=requests&highlight=${createdRequest.id}&flash=${
        resolvedMatch.contact_type === "openchat" ? "chat_entered" : "requested"
      }`,
    );
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen);
  }

  const primaryHref = getPrimaryHref();
  const participationMethodLabel =
    resolvedMatch.contact_type === "openchat" ? "오픈채팅 연결" : "호스트 승인";
  const participationFlowLabel = activeRequest
    ? getParticipationStatusLabel(activeRequest.status)
    : resolvedMatch.contact_type === "openchat"
      ? "입장 후 승인"
      : "요청 후 승인";

  return (
    <div className="space-y-6 pb-28">
      <header className="flex items-center justify-between">
        <Button asChild size="icon" variant="secondary">
          <Link href={backHref} aria-label="뒤로 가기">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant={resolvedMatch.statusTone}>{resolvedMatch.statusLabel}</Badge>
      </header>

      <section className="kinetic-gradient relative overflow-hidden rounded-[2rem] p-6 text-white">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-6 -translate-y-6 rounded-full border-[8px] border-white/6" />
        <div className="absolute bottom-0 right-0 h-36 w-36 translate-x-10 translate-y-10 rounded-full bg-[#b8ff5a]/10 blur-3xl" />
        <div className="relative space-y-4">
          <Badge variant={resolvedMatch.statusTone}>{resolvedMatch.statusLabel}</Badge>
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b8ff5a]">Match Detail</p>
            <h1 className="text-[2.2rem] font-bold leading-[1.02] tracking-[-0.06em]">{resolvedMatch.title}</h1>
            <p className="max-w-[26ch] text-sm leading-6 text-white/74">
              {resolvedMatch.region}에서 열리는 {resolvedMatch.skill_level} 기준 경기예요. 이동 시간과 인원, 분위기를 한 번에 확인해보세요.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">Time</p>
            <p className="mt-2 text-lg font-bold tracking-[-0.04em] text-[#112317]">{formatStartAt(resolvedMatch.start_at)}</p>
          </div>
          <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">Fee</p>
            <p className="mt-2 text-lg font-bold tracking-[-0.04em] text-[#112317]">{formatFee(resolvedMatch.fee)}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">유형</p>
            <p className="mt-2 text-lg font-bold tracking-[-0.04em] text-[#112317]">
              {listingTypeLabels[resolvedMatch.listing_type]}
            </p>
          </div>
          <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">실력</p>
            <p className="mt-2 text-lg font-bold tracking-[-0.04em] text-[#112317]">{resolvedMatch.skill_level}</p>
          </div>
        </div>

        <div className="mt-3 rounded-[1.2rem] bg-[#f7f9f7] p-4">
          <SlotProgress mode={resolvedMatch.mode} remaining={resolvedMatch.needed_count} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <div className="surface-card rounded-[1.6rem] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">Location</p>
              <p className="mt-1 font-semibold text-[#112317]">{resolvedMatch.address}</p>
              <p className="mt-1 text-sm text-muted">{resolvedMatch.region}</p>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-[1.6rem] p-5">
          <SectionHeading eyebrow="Travel" title="이동 예상 시간" description="도보는 30분 이내일 때만 표시돼요." />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {travelEstimates.map((estimate) => (
              <div key={estimate.mode} className="rounded-[1.2rem] bg-[#eef2ee] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#4c584f]">
                  <TravelIcon mode={estimate.mode} />
                  {estimate.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card rounded-[1.6rem] p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">참여 방식</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#4c584f]">
                <Wallet className="h-4 w-4 text-[#112317]" />
                {participationMethodLabel}
              </div>
            </div>
            <div className="rounded-[1.2rem] bg-[#eef2ee] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6a766f]">확정 흐름</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#4c584f]">
                <ShieldCheck className="h-4 w-4 text-[#112317]" />
                {participationFlowLabel}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading eyebrow="Match Note" title="경기 메모" description={resolvedMatch.note} />
      </section>

      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Host"
          title={resolvedMatch.organizer?.nickname ?? "FootLink 호스트"}
          description={`선호 지역 ${resolvedMatch.organizer?.preferred_regions.join(" · ") ?? resolvedMatch.region} · ${
            resolvedMatch.organizer ? `${resolvedMatch.organizer.age}세` : "나이 미정"
          }`}
        />
      </section>

      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-3 px-4 pb-4 pt-4 shadow-[0_-18px_48px_rgba(10,18,13,0.06)]">
        {primaryHref ? (
          <Button asChild className="flex-1" size="lg">
            <Link href={primaryHref}>{getPrimaryLabel()}</Link>
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            type="button"
            disabled={
              resolvedMatch.status !== "open" ||
              isHostView ||
              (resolvedMatch.contact_type === "openchat" && !resolvedMatch.contact_value)
            }
            onClick={() => handleSheetOpenChange(true)}
          >
            {getPrimaryLabel()}
          </Button>
        )}
        <Button asChild className="flex-1" size="lg" variant="secondary">
          <Link href="/activity">활동 보기</Link>
        </Button>
      </div>

      <JoinIntentSheet
        match={resolvedMatch}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        defaultRequestedCount={defaultRequestedCount}
        onSubmit={handleJoinSubmit}
      />
    </div>
  );
}
