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

import { submitParticipationAction } from "@/app/actions/requests";
import { JoinIntentSheet } from "@/components/match/join-intent-sheet";
import { ProfileCompletionSheet } from "@/components/profile/profile-completion-sheet";
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
import { isProfileComplete } from "@/lib/profiles";
import { ensureAnonymousSession } from "@/lib/supabase/client";
import { formatAgeBand, formatFee, formatSkillLevel, formatStartAt, getTravelEstimates } from "@/lib/utils";
import type { DemoAppState, ListingType, Profile } from "@/lib/types";

const listingTypeLabels: Record<ListingType, string> = {
  mercenary: "용병 구함",
  partial_join: "부분 합류",
  team_match: "팀 매치",
};

function getMatchFormatLabel(match: { mode: string; min_group_size: number; max_group_size: number }) {
  if (match.mode === "team") {
    return `${match.min_group_size}v${match.max_group_size}`;
  }

  return "5v5";
}

function MatchDetailBody({
  matchId,
  searchParams,
  referenceNow,
  state,
  onSubmitParticipation,
  profileCompletionEnabled = false,
}: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
  state: DemoAppState;
  onSubmitParticipation: (input: { requestedCount: number; message: string }) => Promise<string>;
  profileCompletionEnabled?: boolean;
}) {
  const router = useRouter();
  const match = useMemo(() => getMatchMetaForState(state, matchId, referenceNow), [matchId, referenceNow, state]);
  const backContext = parseFeedContext(searchParams);
  const backHref = `/home?${buildContextQuery(backContext)}`;
  const initialProfile = getCurrentProfile(state) ?? null;
  const [resolvedProfile, setResolvedProfile] = useState<Profile | null>(initialProfile);

  const activeRequest = match
    ? getActiveParticipationForMatch(state, match.id, resolvedProfile?.id ?? "")
    : undefined;
  const isHostView = match ? resolvedProfile?.id === match.creator_profile_id : false;
  const canStartJoinFlow = Boolean(match && match.status === "open" && !isHostView && !activeRequest);
  const shouldOpenJoinFlow = searchParams.intent === "join";
  const shouldOpenProfileFirst =
    shouldOpenJoinFlow && profileCompletionEnabled && !isProfileComplete(initialProfile);
  const [profileSheetOpen, setProfileSheetOpen] = useState(shouldOpenProfileFirst);
  const [joinSheetOpen, setJoinSheetOpen] = useState(
    shouldOpenJoinFlow && (!profileCompletionEnabled || isProfileComplete(initialProfile)) && canStartJoinFlow,
  );
  const [pendingJoinAfterProfile, setPendingJoinAfterProfile] = useState(shouldOpenProfileFirst);
  const travelEstimates = match ? getTravelEstimates(match.distanceKm).sort((a, b) => a.minutes - b.minutes) : [];
  const defaultRequestedCount = match ? getDefaultRequestedCount(match, backContext) : 1;

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

  const participationMethodLabel = "참가 요청 후 호스트 승인";
  const participationFlowLabel = activeRequest
    ? getParticipationStatusLabel(activeRequest.status)
    : "수락되면 오픈채팅 입장";
  const remainingLabel =
    match.mode === "team"
      ? "상대 팀 모집"
      : match.remaining_slots <= 0
        ? "모집 완료"
        : `남은 ${match.remaining_slots}자리`;
  const primaryHref = isHostView
    ? `/activity?tab=listings&highlight=${match.id}`
    : activeRequest
      ? `/activity?tab=requests&highlight=${activeRequest.id}`
      : null;
  const travelIcons = { walk: Footprints, transit: BusFront, car: CarFront } as const;

  function getPrimaryLabel() {
    if (isHostView) return "내 모집 보기";
    if (!activeRequest) return "참가 요청 보내기";
    return getParticipationStatusLabel(activeRequest.status);
  }

  async function handleJoinSubmit(input: { requestedCount: number; message: string }) {
    const requestId = await onSubmitParticipation(input);
    router.push(`/activity?tab=requests&highlight=${requestId}&flash=requested`);
  }

  return (
    <div className="space-y-3 pb-24">
      <header className="flex items-center justify-between">
        <Button asChild size="icon" variant="secondary">
          <Link href={backHref} aria-label="뒤로 가기">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Badge variant={match.statusTone}>{match.statusLabel}</Badge>
      </header>

      <div>
        <h1 className="text-[1.3rem] font-bold tracking-[-0.03em] text-[#112317]">{match.title}</h1>
        <p className="mt-1 text-[13px] font-semibold text-[#5f6c64]">
          {match.region_label} · {formatSkillLevel(match.skill_level)} · {getMatchFormatLabel(match)} · {remainingLabel}
        </p>
      </div>

      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="space-y-3">
          <InfoRow icon={CalendarDays} label="시간" value={formatStartAt(match.start_at)} />
          <InfoRow icon={Tag} label="비용" value={formatFee(match.fee)} />
          <InfoRow icon={Clock} label="유형" value={listingTypeLabels[match.listing_type]} />
          <InfoRow icon={Wallet} label="진행 방식" value={participationMethodLabel} />
          <InfoRow icon={ShieldCheck} label="연결 방식" value={participationFlowLabel} />
        </div>
      </section>

      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
          <div>
            <p className="text-[13px] font-bold text-[#112317]">{match.address}</p>
            <p className="mt-0.5 text-[12px] text-[#5f6c64]">{match.region_label}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#5f6c64]">
          {travelEstimates.map((est, index) => {
            const Icon = travelIcons[est.mode];
            return (
              <span key={est.mode} className="flex items-center gap-0.5">
                {index > 0 ? <span className="mr-1.5 text-[#c8cec9]">·</span> : null}
                <Icon className="h-3 w-3" />
                {est.minutes}분
              </span>
            );
          })}
        </div>
      </section>

      {match.note ? (
        <section className="surface-card rounded-[1.25rem] px-4 py-3">
          <div className="flex items-start gap-2.5">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
            <p className="text-[13px] leading-5 text-[#3a4a3f]">{match.note}</p>
          </div>
        </section>
      ) : null}

      <section className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317]">
            <User className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#112317]">{match.organizer?.nickname ?? "FootLink 호스트"}</p>
            <p className="text-[12px] text-[#5f6c64]">
              {match.organizer?.preferred_regions.join(" · ") ?? match.region_label}
              {match.organizer ? ` · ${formatAgeBand(match.organizer.age)}` : ""}
            </p>
          </div>
        </div>
      </section>

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
            disabled={match.status !== "open" || isHostView}
            onClick={() => {
              if (profileCompletionEnabled && !isProfileComplete(resolvedProfile)) {
                setPendingJoinAfterProfile(true);
                setProfileSheetOpen(true);
                return;
              }

              setJoinSheetOpen(true);
            }}
          >
            {getPrimaryLabel()}
          </Button>
        )}
      </div>

      <JoinIntentSheet
        match={match}
        open={joinSheetOpen}
        onOpenChange={setJoinSheetOpen}
        defaultRequestedCount={defaultRequestedCount}
        onSubmit={handleJoinSubmit}
      />
      <ProfileCompletionSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profile={resolvedProfile}
        preferredMode={match.mode}
        regionLabel={match.region_label}
        confirmLabel="저장하고 참가 요청하기"
        onCompleted={(profile) => {
          setResolvedProfile(profile);

          if (pendingJoinAfterProfile && match.status === "open" && profile.id !== match.creator_profile_id) {
            setPendingJoinAfterProfile(false);
            setJoinSheetOpen(true);
          }
        }}
      />
    </div>
  );
}

function DemoMatchDetailScreen(props: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
}) {
  const { state, actions } = useDemoApp();

  return (
    <MatchDetailBody
      {...props}
      state={state}
      onSubmitParticipation={async (input) => {
        const request = actions.submitParticipation({
          matchId: props.matchId,
          requestedCount: input.requestedCount,
          message: input.message,
        });

        return request.id;
      }}
    />
  );
}

export function MatchDetailScreen({
  matchId,
  searchParams,
  referenceNow,
  stateSnapshot,
}: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
  stateSnapshot?: DemoAppState | null;
}) {
  if (stateSnapshot) {
    return (
      <MatchDetailBody
        matchId={matchId}
        searchParams={searchParams}
        referenceNow={referenceNow}
        state={stateSnapshot}
        profileCompletionEnabled
        onSubmitParticipation={async (input) => {
          await ensureAnonymousSession();
          const request = await submitParticipationAction({
            matchId,
            requestedCount: input.requestedCount,
            message: input.message,
          });

          return request.id;
        }}
      />
    );
  }

  return <DemoMatchDetailScreen matchId={matchId} referenceNow={referenceNow} searchParams={searchParams} />;
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
