"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, MessageCircleMore, UserRound } from "lucide-react";

import { submitParticipationAction } from "@/app/actions/requests";
import { BackButton } from "@/components/app/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { buildContextQuery, parseFeedContext } from "@/lib/context";
import { useDemoApp } from "@/lib/demo-state/provider";
import {
  getActiveParticipationForMatch,
  getCurrentProfile,
  getMatchMetaForState,
} from "@/lib/demo-state/selectors";
import { getUserFacingErrorMessage } from "@/lib/errors";
import { isProfileComplete } from "@/lib/profiles";
import {
  formatDistanceValue,
  formatFee,
  formatSportType,
  formatStartAt,
  formatUrgencyLabel,
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
  const contactHref =
    activeRequest?.accepted_contact_link ||
    match?.contact_link ||
    match?.organizer?.open_chat_link ||
    null;

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

  return (
    <div className="space-y-4 pb-28">
      <section className="surface-card rounded-[1.7rem] p-4">
        <div className="flex items-center justify-between">
          <BackButton href={backHref} ariaLabel="홈으로 돌아가기" />
          <span className="font-display text-[1.04rem] font-bold tracking-[0.16em] text-[#112317]">FOOTLINK</span>
          <span className="rounded-full bg-[#eef2ee] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#66736a]">
            Detail
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={match.statusTone} className="px-2.5 py-1 text-[11px]">
            {urgencyLabel}
          </Badge>
          <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#445149]">
            {formatSportType(match.sport_type ?? "futsal")}
          </span>
          {contactHref ? (
            <span className="rounded-full bg-[#e7f4da] px-2.5 py-1 text-[11px] font-bold text-[#254712]">
              오픈채팅 가능
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-[1.75rem] font-bold tracking-[-0.05em] text-[#112317]">{match.title}</h1>
        <p className="mt-2 text-[1rem] font-semibold text-[#4f5d55]">{spotLabel}</p>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.15rem] bg-[#f4f7f3] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Start</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatStartAt(match.start_at)}</p>
          </div>
          <div className="rounded-[1.15rem] bg-[#f4f7f3] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Distance</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">
              {formatDistanceValue(match.distanceKm)}
            </p>
          </div>
          <div className="rounded-[1.15rem] bg-[#f4f7f3] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Fee</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{formatFee(match.fee)}</p>
          </div>
          <div className="rounded-[1.15rem] bg-[#f4f7f3] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Spot</p>
            <p className="mt-2 text-[14px] font-bold text-[#112317]">{spotLabel}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.2rem] bg-[#f4f7f3] px-4 py-4">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#112317]" />
            <div>
              <p className="text-[14px] font-bold text-[#112317]">{match.address}</p>
              <p className="mt-1 text-[12px] text-[#66736a]">{match.region_label}</p>
            </div>
          </div>
        </div>
      </section>

      {match.note ? (
        <section className="surface-card rounded-[1.45rem] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Note</p>
          <p className="mt-3 text-[14px] leading-6 text-[#445149]">{match.note}</p>
        </section>
      ) : null}

      <section className="surface-card rounded-[1.45rem] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317]">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#112317]">{match.organizer?.nickname ?? "FootLink Host"}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#66736a]">
              {contactHref
                ? "참여 후 바로 연락할 수 있는 링크가 준비되어 있습니다."
                : "앱에서 요청을 보내면 호스트가 확인한 뒤 상태가 업데이트됩니다."}
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
          {error}
        </p>
      ) : null}

      <div className="glass-panel safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[430px] gap-2 rounded-t-[1.75rem] px-4 pb-5 pt-3 shadow-[0_-18px_42px_rgba(10,18,13,0.06)]">
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 min-w-[9.5rem] items-center justify-center gap-2 rounded-[1.1rem] bg-[#eef2ee] px-4 text-[14px] font-bold text-[#112317] transition active:scale-95"
          >
            <MessageCircleMore className="h-4 w-4" />
            연락하기
          </a>
        ) : null}

        {activeRequest ? (
          <Button asChild className="flex-1" size="lg">
            <Link href={`/activity?highlight=${activeRequest.id}`}>내 참여 보기</Link>
          </Button>
        ) : isClosed ? (
          <Button asChild className="flex-1" size="lg">
            <Link href={backHref}>다른 공석 보기</Link>
          </Button>
        ) : (
          <Button
            className="flex-1"
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
                내 참여에서 상태를 볼 수 있고, 연락 링크가 있으면 바로 이어서 대화할 수 있습니다.
              </SheetDescription>
            </div>

            <div className="rounded-[1.25rem] bg-[#f4f7f3] px-4 py-4">
              <p className="text-sm font-bold text-[#112317]">{match.title}</p>
              <p className="mt-1 text-sm text-[#66736a]">{formatStartAt(match.start_at)}</p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1" size="lg" variant="secondary">
                <Link href={`/activity?highlight=${successRequestId ?? match.id}`}>내 참여 보기</Link>
              </Button>
              {contactHref ? (
                <Button asChild className="flex-1" size="lg">
                  <a href={contactHref} target="_blank" rel="noreferrer">
                    오픈채팅 열기
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
          const { ensureAnonymousSession } = await import("@/lib/supabase/client");
          await ensureAnonymousSession();
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
