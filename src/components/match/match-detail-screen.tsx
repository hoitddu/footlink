"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, MessageCircleMore, Phone, UserRound } from "lucide-react";

import { ensureAnonymousSessionAction } from "@/app/actions/auth";
import { submitParticipationAction } from "@/app/actions/requests";
import { BackButton } from "@/components/app/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  buildContactHref,
  getContactActionLabel,
  getContactBadgeLabel,
  getContactDescription,
  resolveContactType,
} from "@/lib/contact";
import { buildContextQuery, parseFeedContext } from "@/lib/context";
import { getMatchPositionLabel } from "@/lib/constants";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getActiveParticipationForMatch,
  getCurrentProfile,
  getMatchMetaForState,
} from "@/lib/demo-state/selectors";
import { getUserFacingErrorMessage } from "@/lib/errors";
import { getMatchFormatLabel } from "@/lib/match-format";
import { isProfileComplete } from "@/lib/profiles";
import {
  formatDurationMinutes,
  formatDistanceValue,
  formatFee,
  formatSportType,
  formatStartAt,
  formatTimeRange,
  formatUrgencyLabel,
  getMatchEndDate,
} from "@/lib/utils";
import type { DemoAppState, Profile } from "@/lib/types";

const ProfileCompletionSheet = dynamic(
  () =>
    import("@/components/profile/profile-completion-sheet").then(
      (module) => module.ProfileCompletionSheet,
    ),
  { loading: () => null, ssr: false },
);

function mergePersonalizedState(
  state: DemoAppState,
  currentProfile: Profile | null,
  myRequest: DemoAppState["participationRequests"][number] | null,
) {
  if (!currentProfile) {
    return state;
  }

  const profiles = [
    currentProfile,
    ...state.profiles.filter((profile) => profile.id !== currentProfile.id),
  ];
  const participationRequests = myRequest
    ? [myRequest, ...state.participationRequests.filter((request) => request.id !== myRequest.id)]
    : state.participationRequests;

  return {
    ...state,
    currentProfileId: currentProfile.id,
    profiles,
    participationRequests,
  };
}

function MatchDetailBody({
  matchId,
  searchParams,
  referenceNow,
  initialState,
  onSubmitParticipation,
  profileCompletionEnabled = false,
  hydratePersonalState = false,
}: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
  initialState: DemoAppState;
  onSubmitParticipation: () => Promise<string>;
  profileCompletionEnabled?: boolean;
  hydratePersonalState?: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [personalizationReady, setPersonalizationReady] = useState(!hydratePersonalState);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [submitAfterProfile, setSubmitAfterProfile] = useState(false);
  const [successSheetOpen, setSuccessSheetOpen] = useState(false);
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);
  const [joinSubmitPending, setJoinSubmitPending] = useState(false);
  const [error, setError] = useState("");

  const match = useMemo(() => getMatchMetaForState(state, matchId, referenceNow), [matchId, referenceNow, state]);
  const backContext = parseFeedContext(searchParams);
  const backHref = `/home?${buildContextQuery(backContext)}`;
  const resolvedProfile = getCurrentProfile(state) ?? null;
  const activeRequest = match
    ? getActiveParticipationForMatch(state, match.id, resolvedProfile?.id ?? "")
    : undefined;
  const rawContactValue = activeRequest?.accepted_contact_link || null;
  const rawContactType = activeRequest?.entry_channel || match?.contact_type || "request_only";
  const contactType = resolveContactType(rawContactType, rawContactValue);
  const contactHref = buildContactHref(contactType, rawContactValue);
  const contactActionLabel = getContactActionLabel(contactType);
  const hasDirectContactMethod = match ? match.contact_type !== "request_only" : false;
  const contactDescription = contactHref
    ? getContactDescription(contactType)
    : hasDirectContactMethod
      ? `참여 요청이 수락되면 ${getContactBadgeLabel(match?.contact_type ?? "request_only").replace(" 가능", "")}으로 바로 연락할 수 있습니다.`
      : getContactDescription("request_only");

  useEffect(() => {
    if (!hydratePersonalState) {
      return;
    }

    let cancelled = false;

    void import("@/lib/supabase/browser")
      .then(({ getBrowserMatchPersonalization }) => getBrowserMatchPersonalization(matchId))
      .then(({ currentProfile, myRequest }) => {
        if (!cancelled) {
          setState((currentState) => mergePersonalizedState(currentState, currentProfile, myRequest));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPersonalizationReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hydratePersonalState, matchId]);

  async function submitJoin(profileOverride?: Profile | null) {
    if (!match || joinSubmitPending || activeRequest || match.status !== "open" || match.remaining_slots <= 0) {
      return;
    }

    const currentProfile = profileOverride ?? resolvedProfile;
    setError("");
    setJoinSubmitPending(true);

    try {
      const requestId = await onSubmitParticipation();
      const now = new Date().toISOString();

      if (currentProfile) {
        setState((currentState) => ({
          ...currentState,
          participationRequests: [
            {
              id: requestId,
              match_id: match.id,
              requester_profile_id: currentProfile.id,
              host_profile_id: match.creator_profile_id,
              entry_channel: match.contact_type,
              requested_count: 1,
              message: "",
              status: "pending",
              created_at: now,
            },
            ...currentState.participationRequests,
          ],
        }));
      }

      setSuccessRequestId(requestId);
      setSuccessSheetOpen(true);
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "참여 요청을 처리하지 못했습니다."));
    } finally {
      setJoinSubmitPending(false);
    }
  }

  async function handleSubmitJoin() {
    if (!match || joinSubmitPending || activeRequest || match.status !== "open" || match.remaining_slots <= 0) {
      return;
    }

    if (profileCompletionEnabled && !isProfileComplete(resolvedProfile)) {
      setSubmitAfterProfile(true);
      setProfileSheetOpen(true);
      return;
    }

    await submitJoin(resolvedProfile);
  }

  if (!match) {
    return (
      <section className="surface-card rounded-[1.35rem] p-5">
        <h1 className="text-lg font-bold text-[#112317]">매치를 찾을 수 없습니다.</h1>
        <Button asChild className="mt-3" size="sm">
          <Link href="/home">홈으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  const isClosed = match.status !== "open" || match.remaining_slots <= 0;
  const spotLabel = isClosed
    ? "마감"
    : match.remaining_slots === 1
      ? "1자리 남음"
      : `${match.remaining_slots}자리 남음`;
  const urgencyLabel = formatUrgencyLabel(match.start_at, match.minutesUntilStart);
  const formatLabel = getMatchFormatLabel(match);
  const endAt = getMatchEndDate(match.start_at, match.duration_minutes).toISOString();

  return (
    <div className="space-y-4 pb-28">
      <section className="shell-card rounded-[1.7rem] p-4">
        <div className="flex items-center justify-between">
          <BackButton href={backHref} ariaLabel="홈으로 돌아가기" />
          <span className="font-display text-[1.04rem] font-bold tracking-[0.16em] text-[#f4f7f1]">FOOTLINK</span>
          <span aria-hidden="true" className="block h-11 w-11 shrink-0" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={match.statusTone} className="px-2.5 py-1 text-[11px]">
            {urgencyLabel}
          </Badge>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-[#d2dbd2] ring-1 ring-white/10">
            {formatSportType(match.sport_type ?? "futsal")}
          </span>
          {formatLabel ? (
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-[#d2dbd2] ring-1 ring-white/10">
              {formatLabel}
            </span>
          ) : null}
          {hasDirectContactMethod ? (
            <span className="rounded-full bg-[#e7f4da] px-2.5 py-1 text-[11px] font-bold text-[#254712]">
              {getContactBadgeLabel(match.contact_type)}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-[1.75rem] font-bold tracking-[-0.05em] text-[#f4f7f1]">{match.title}</h1>
        <p className="mt-2 text-[1rem] font-semibold text-[#b5c2b7]">{spotLabel}</p>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4 ring-1 ring-white/55">
        <div className="grid grid-cols-2 gap-3">
          <div className="surface-subcard rounded-[1.15rem] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Start</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatStartAt(match.start_at)}</p>
          </div>
          <div className="surface-subcard rounded-[1.15rem] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">End</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatStartAt(endAt)}</p>
          </div>
          <div className="surface-subcard rounded-[1.15rem] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Duration</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatDurationMinutes(match.duration_minutes)}</p>
          </div>
          <div className="surface-subcard rounded-[1.15rem] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Fee</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatFee(match.fee)}</p>
          </div>
        </div>

        <div className="surface-subcard mt-4 rounded-[1.2rem] px-4 py-4">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
            <div>
              <p className="text-[14px] font-bold text-[#112317]">{match.address}</p>
              <p className="mt-1 text-[12px] text-[#66736a]">
                {match.region_label} · {formatDistanceValue(match.distanceKm)}
              </p>
            </div>
          </div>
        </div>

        <div className="surface-subcard mt-3 rounded-[1.2rem] px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">모집 포지션</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {match.position_targets.length > 0 ? (
              match.position_targets.map((position) => (
                <span
                  key={position}
                  className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#112317] shadow-[0_8px_16px_rgba(10,18,13,0.04)]"
                >
                  {getMatchPositionLabel(position)}
                </span>
              ))
            ) : (
              <span className="surface-chip rounded-full px-3 py-1.5 text-[12px] font-medium shadow-none">
                포지션 무관
              </span>
            )}
          </div>
        </div>
      </section>

      {match.note ? (
        <section className="surface-card rounded-[1.45rem] p-4 ring-1 ring-white/55">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Note</p>
          <p className="mt-3 text-[14px] leading-6 text-[#445149]">{match.note}</p>
        </section>
      ) : null}

      <section className="surface-card rounded-[1.45rem] p-4 ring-1 ring-white/55">
        <div className="flex items-start gap-3">
          <div className="surface-subcard flex h-10 w-10 items-center justify-center rounded-full text-[#112317]">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#112317]">{match.organizer?.nickname ?? "FootLink Host"}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#66736a]">
              {contactDescription}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
          {error}
        </p>
      ) : null}

      <div className="action-dock safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] gap-2 rounded-t-[1.75rem] px-4 pb-5 pt-3">
        {contactHref ? (
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="min-w-[9.75rem] gap-2 rounded-[1.15rem] px-4"
          >
            <a
              href={contactHref}
              target={contactType === "openchat" ? "_blank" : undefined}
              rel={contactType === "openchat" ? "noreferrer" : undefined}
            >
              {contactType === "phone" ? <Phone className="h-4 w-4" /> : <MessageCircleMore className="h-4 w-4" />}
              {contactActionLabel}
            </a>
          </Button>
        ) : null}

        {activeRequest ? (
          <Button asChild className="flex-1 rounded-[1.15rem]" size="lg">
            <Link href={`/activity?highlight=${activeRequest.id}`}>내 참여 보기</Link>
          </Button>
        ) : isClosed ? (
          <Button asChild className="flex-1 rounded-[1.15rem]" size="lg">
            <Link href={backHref}>다른 공석 보기</Link>
          </Button>
        ) : (
          <Button
            className="flex-1 rounded-[1.15rem]"
            size="lg"
            type="button"
            disabled={joinSubmitPending || !personalizationReady}
            onClick={handleSubmitJoin}
          >
            {joinSubmitPending ? "요청 중..." : "참여 요청"}
          </Button>
        )}
      </div>

      <Sheet open={successSheetOpen} onOpenChange={setSuccessSheetOpen}>
        <SheetContent>
          <div className="space-y-5">
            <div>
              <SheetTitle className="text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">
                참여 요청을 전송했어요
              </SheetTitle>
              <SheetDescription className="mt-2 text-sm leading-6 text-[#66736a]">
                내 참여에서 상태를 볼 수 있고, 연락 정보가 있으면 바로 이어서 연락할 수 있습니다.
              </SheetDescription>
            </div>

            <div className="surface-subcard rounded-[1.25rem] px-4 py-4">
              <p className="text-sm font-bold text-[#112317]">{match.title}</p>
              <p className="mt-1 text-sm text-[#66736a]">
                {formatStartAt(match.start_at)} · {formatTimeRange(match.start_at, match.duration_minutes)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1" size="lg" variant="secondary">
                <Link href={`/activity?highlight=${successRequestId ?? match.id}`}>내 참여 보기</Link>
              </Button>
              {contactHref ? (
                <Button asChild className="flex-1" size="lg">
                  <a
                    href={contactHref}
                    target={contactType === "openchat" ? "_blank" : undefined}
                    rel={contactType === "openchat" ? "noreferrer" : undefined}
                  >
                    {contactActionLabel}
                  </a>
                </Button>
              ) : (
                <Button className="flex-1" size="lg" type="button" onClick={() => setSuccessSheetOpen(false)}>
                  확인
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ProfileCompletionSheet
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        profile={resolvedProfile}
        title="참여하려면 기본 정보가 필요해요"
        description="닉네임, 연령대, 실력만 입력하면 바로 요청을 이어서 보낼 수 있습니다."
        confirmLabel="저장하고 참여 요청하기"
        onCompleted={(profile) => {
          setState((currentState) => mergePersonalizedState(currentState, profile, null));

          if (submitAfterProfile) {
            setSubmitAfterProfile(false);
            void submitJoin(profile);
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
      initialState={state}
      onSubmitParticipation={async () => {
        const request = actions.submitParticipation({
          matchId: props.matchId,
          requestedCount: 1,
          message: "",
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
  hydratePersonalState = false,
}: {
  matchId: string;
  searchParams: Record<string, string | undefined>;
  referenceNow: number;
  stateSnapshot?: DemoAppState | null;
  hydratePersonalState?: boolean;
}) {
  if (stateSnapshot) {
    return (
      <MatchDetailBody
        matchId={matchId}
        searchParams={searchParams}
        referenceNow={referenceNow}
        initialState={stateSnapshot}
        profileCompletionEnabled
        hydratePersonalState={hydratePersonalState}
        onSubmitParticipation={async () => {
          await ensureAnonymousSessionAction();
          const request = await submitParticipationAction({
            matchId,
            requestedCount: 1,
            message: "",
          });

          return request.id;
        }}
      />
    );
  }

  return (
    <DemoMatchDetailScreen
      matchId={matchId}
      referenceNow={referenceNow}
      searchParams={searchParams}
    />
  );
}
