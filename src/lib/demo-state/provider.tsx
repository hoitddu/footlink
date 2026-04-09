"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { DEMO_STORAGE_KEY, createDemoSeed, normalizeDemoState } from "@/lib/demo-state/seed";
import {
  acceptParticipation as acceptParticipationState,
  cancelMatch as cancelMatchState,
  cancelParticipationConfirmation as cancelParticipationConfirmationState,
  confirmParticipation as confirmParticipationState,
  createMatch as createMatchState,
  createResetState,
  dismissParticipationRequest as dismissParticipationRequestState,
  rejectParticipation as rejectParticipationState,
  submitParticipation as submitParticipationState,
  switchProfile as switchProfileState,
  updateCurrentProfile as updateCurrentProfileState,
  validateDemoState,
  markNotificationsRead as markNotificationsReadState,
  withdrawParticipation as withdrawParticipationState,
} from "@/lib/demo-state/store";
import type { DemoAppActions, DemoAppState, Match, ParticipationRequest, Profile } from "@/lib/types";

type DemoAppContextValue = {
  state: DemoAppState;
  actions: DemoAppActions;
  currentProfile?: Profile;
  hydrated: boolean;
};

const DemoAppContext = createContext<DemoAppContextValue | null>(null);

function serializeDemoState(state: DemoAppState) {
  return JSON.stringify(state);
}

export function DemoAppProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: DemoAppState;
}) {
  const initialStateRef = useRef<DemoAppState>(initialState ?? createDemoSeed());
  const initialStateJsonRef = useRef(serializeDemoState(initialStateRef.current));
  const [state, setState] = useState<DemoAppState>(() => initialStateRef.current);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawState = window.localStorage.getItem(DEMO_STORAGE_KEY);

      if (rawState) {
        const parsed = JSON.parse(rawState) as unknown;

        if (validateDemoState(parsed)) {
          const normalized = normalizeDemoState(parsed);

          if (serializeDemoState(normalized) !== initialStateJsonRef.current) {
            setState(normalized);
          }
        }
      }
    } catch {
      // Keep the server seed if storage is missing or corrupted.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const actions = useMemo<DemoAppActions>(
    () => ({
      switchProfile(profileId) {
        setState((current) => switchProfileState(current, profileId));
      },
      updateCurrentProfile(updates) {
        setState((current) => updateCurrentProfileState(current, updates));
      },
      createMatch(input) {
        let created: Match | undefined;

        setState((current) => {
          const result = createMatchState(current, input);
          created = result.match;
          return result.state;
        });

        if (!created) {
          throw new Error("매치를 생성하지 못했습니다.");
        }

        return created;
      },
      cancelMatch(matchId) {
        let updated: Match | undefined;

        setState((current) => {
          const result = cancelMatchState(current, matchId);
          updated = result.match;
          return result.state;
        });

        if (!updated) {
          throw new Error("모집을 마감하지 못했습니다.");
        }

        return updated;
      },
      submitParticipation(input) {
        let created: ParticipationRequest | undefined;

        setState((current) => {
          const result = submitParticipationState(current, input);
          created = result.request;
          return result.state;
        });

        if (!created) {
          throw new Error("참가 기록을 생성하지 못했습니다.");
        }

        return created;
      },
      acceptParticipation(requestId, hostNote) {
        let updated: ParticipationRequest | undefined;

        setState((current) => {
          const result = acceptParticipationState(current, requestId, hostNote);
          updated = result.request;
          return result.state;
        });

        if (!updated) {
          throw new Error("요청을 수락하지 못했습니다.");
        }

        return updated;
      },
      confirmParticipation(requestId, hostNote) {
        let updated: ParticipationRequest | undefined;

        setState((current) => {
          const result = confirmParticipationState(current, requestId, hostNote);
          updated = result.request;
          return result.state;
        });

        if (!updated) {
          throw new Error("요청을 최종 확정하지 못했습니다.");
        }

        return updated;
      },
      cancelParticipationConfirmation(requestId, hostNote) {
        let updated: ParticipationRequest | undefined;

        setState((current) => {
          const result = cancelParticipationConfirmationState(current, requestId, hostNote);
          updated = result.request;
          return result.state;
        });

        if (!updated) {
          throw new Error("최종 확정을 취소하지 못했습니다.");
        }

        return updated;
      },
      rejectParticipation(requestId, hostNote) {
        let updated: ParticipationRequest | undefined;

        setState((current) => {
          const result = rejectParticipationState(current, requestId, hostNote);
          updated = result.request;
          return result.state;
        });

        if (!updated) {
          throw new Error("요청을 거절하지 못했습니다.");
        }

        return updated;
      },
      withdrawParticipation(requestId) {
        let updated: ParticipationRequest | undefined;

        setState((current) => {
          const result = withdrawParticipationState(current, requestId);
          updated = result.request;
          return result.state;
        });

        if (!updated) {
          throw new Error("요청을 취소하지 못했습니다.");
        }

        return updated;
      },
      dismissParticipationRequest(requestId) {
        setState((current) => dismissParticipationRequestState(current, requestId));
      },
      markNotificationsRead(notificationIds) {
        setState((current) => markNotificationsReadState(current, notificationIds));
      },
      resetDemoState() {
        window.localStorage.removeItem(DEMO_STORAGE_KEY);
        setState(createResetState());
      },
    }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      actions,
      currentProfile: state.profiles.find((profile) => profile.id === state.currentProfileId),
      hydrated,
    }),
    [actions, hydrated, state],
  );

  return <DemoAppContext.Provider value={value}>{children}</DemoAppContext.Provider>;
}

export function useDemoApp() {
  const context = useContext(DemoAppContext);

  if (!context) {
    throw new Error("useDemoApp must be used within DemoAppProvider");
  }

  return context;
}
