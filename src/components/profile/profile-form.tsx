"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { saveProfile } from "@/components/profile/profile-save";
import { FlashBanner } from "@/components/app/flash-banner";
import { ScreenHeader } from "@/components/app/screen-header";
import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppDataSource } from "@/lib/app-config";
import {
  AGE_BANDS,
  REGION_OPTIONS,
  SKILL_LEVELS,
  SPORT_OPTIONS,
  getSkillLevelLabel,
} from "@/lib/constants";
import { useCurrentProfile } from "@/lib/current-profile-context";
import { getUserFacingErrorMessage } from "@/lib/errors";
import { DIRECT_CONTACT_OPTIONS } from "@/lib/contact";
import { useDemoApp } from "@/lib/demo-state/provider";
import type { DirectContactType, Profile, SportType } from "@/lib/types";

type SaveProfileInput = {
  nickname: string;
  age: number;
  skill_level: Profile["skill_level"];
  preferred_sport: SportType | null;
  preferred_regions: string[];
  open_chat_link: string;
  phone_number: string;
  default_contact_type: DirectContactType;
};

function ProfileEditor({
  profile,
  returnTo,
  flash,
  onSaveProfile,
  onReset,
  shouldLoadCurrentProfile = false,
}: {
  profile: Profile | null;
  returnTo?: string;
  flash?: "saved";
  onSaveProfile: (input: SaveProfileInput) => Promise<void>;
  onReset?: () => void;
  shouldLoadCurrentProfile?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resolvedProfile, setResolvedProfile] = useState(profile);
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<number>(profile?.age ?? 20);
  const [skillLevel, setSkillLevel] = useState<Profile["skill_level"]>(profile?.skill_level ?? "mid");
  const [preferredSport, setPreferredSport] = useState<SportType | null>(profile?.preferred_sport ?? "futsal");
  const [openChatLink, setOpenChatLink] = useState(profile?.open_chat_link ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number ?? "");
  const [defaultContactType, setDefaultContactType] = useState<DirectContactType>(
    profile?.default_contact_type ?? (profile?.open_chat_link ? "openchat" : profile?.phone_number ? "phone" : "openchat"),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [localFlash, setLocalFlash] = useState<"saved" | undefined>(undefined);
  const saveLockRef = useRef(false);
  const [error, setError] = useState("");
  const flashParam = searchParams.get("flash");
  const flashAt = searchParams.get("flashAt");
  const resolvedFlash = flashParam === "saved" ? "saved" : localFlash ?? flash;

  useEffect(() => {
    setResolvedProfile(profile);
    setNickname(profile?.nickname ?? "");
    setAgeBand(profile?.age ?? 20);
    setSkillLevel(profile?.skill_level ?? "mid");
    setPreferredSport(profile?.preferred_sport ?? "futsal");
    setOpenChatLink(profile?.open_chat_link ?? "");
    setPhoneNumber(profile?.phone_number ?? "");
    setDefaultContactType(
      profile?.default_contact_type ??
        (profile?.open_chat_link ? "openchat" : profile?.phone_number ? "phone" : "openchat"),
    );
  }, [profile]);

  useEffect(() => {
    if (!shouldLoadCurrentProfile) {
      return;
    }

    let cancelled = false;

    void import("@/lib/supabase/browser")
      .then(({ getBrowserCurrentProfile }) => getBrowserCurrentProfile())
      .then((liveProfile) => {
        if (!cancelled && liveProfile) {
          setResolvedProfile(liveProfile);
          setNickname(liveProfile.nickname ?? "");
          setAgeBand(liveProfile.age ?? 20);
          setSkillLevel(liveProfile.skill_level ?? "mid");
          setPreferredSport(liveProfile.preferred_sport ?? "futsal");
          setOpenChatLink(liveProfile.open_chat_link ?? "");
          setPhoneNumber(liveProfile.phone_number ?? "");
          setDefaultContactType(
            liveProfile.default_contact_type ??
              (liveProfile.open_chat_link
                ? "openchat"
                : liveProfile.phone_number
                  ? "phone"
                  : "openchat"),
          );
        }
      })
      .catch(() => {
        // Keep the editor usable even if browser profile hydration fails.
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoadCurrentProfile]);

  async function handleSave() {
    if (saveLockRef.current) {
      return;
    }

    setError("");
    saveLockRef.current = true;
    setIsSaving(true);

    try {
      await onSaveProfile({
        nickname: nickname.trim() || resolvedProfile?.nickname || "플레이어",
        age: ageBand,
        skill_level: skillLevel,
        preferred_sport: preferredSport,
        preferred_regions: [REGION_OPTIONS[0].label],
        open_chat_link: openChatLink.trim(),
        phone_number: phoneNumber.replace(/[^\d]/g, ""),
        default_contact_type: defaultContactType,
      });

      if (returnTo) {
        router.push(returnTo);
        return;
      }

      const nextFlashAt = Date.now();
      setLocalFlash("saved");
      router.replace(`/profile?flash=saved&flashAt=${nextFlashAt}`, { scroll: false });
    } catch (saveError) {
      setError(getUserFacingErrorMessage(saveError, "프로필을 저장하지 못했습니다."));
    } finally {
      saveLockRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <ScreenHeader href={returnTo ?? "/home"} ariaLabel="홈으로 돌아가기" />

      <FlashBanner key={flashAt ?? resolvedFlash ?? "profile-flash"} flash={resolvedFlash} />
      {error ? (
        <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
          {error}
        </p>
      ) : null}

      {onReset ? <DemoIdentitySwitcher /> : null}

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="grid gap-5">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">닉네임</span>
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">선호 종목</span>
            <div className="grid grid-cols-2 gap-2">
              {SPORT_OPTIONS.map((sport) => (
                <button
                  key={sport.value}
                  type="button"
                  onClick={() => setPreferredSport(sport.value)}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                    preferredSport === sport.value
                      ? "bg-[#112317] text-white"
                      : "bg-[#eef2ee] text-[#223128]"
                  }`}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">연령대</span>
              <div className="grid grid-cols-3 gap-2">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band.value}
                    type="button"
                    onClick={() => setAgeBand(band.value)}
                    className={`rounded-[1rem] px-3 py-3 text-sm font-bold transition ${
                      ageBand === band.value ? "bg-[#112317] text-white" : "bg-[#eef2ee] text-foreground"
                    }`}
                  >
                    {band.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">SKILL LEVEL</span>
              <div className="grid grid-cols-4 gap-2">
                {SKILL_LEVELS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSkillLevel(skill)}
                    className={`rounded-[1rem] px-3 py-3 text-sm font-bold transition ${
                      skillLevel === skill ? "bg-[#112317] text-white" : "bg-[#eef2ee] text-foreground"
                    }`}
                  >
                    {getSkillLevelLabel(skill)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">기본 연락 방식</span>
            <div className="grid grid-cols-2 gap-2">
              {DIRECT_CONTACT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDefaultContactType(option.value)}
                  className={`rounded-[1rem] px-4 py-3 text-sm font-bold transition ${
                    defaultContactType === option.value
                      ? "bg-[#112317] text-white"
                      : "bg-[#eef2ee] text-[#223128]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">오픈채팅 링크</span>
            <Input
              value={openChatLink}
              onChange={(event) => setOpenChatLink(event.target.value)}
              placeholder="https://open.kakao.com/..."
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">휴대폰 번호</span>
            <Input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value.replace(/[^\d]/g, ""))}
              inputMode="tel"
              placeholder="01012345678"
            />
          </label>

          <div className="flex gap-2">
            <Button className="flex-1" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장하기"}
            </Button>
            {onReset ? (
              <Button className="flex-1" type="button" variant="secondary" onClick={onReset}>
                데모 초기화
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function DemoProfileForm({ returnTo, flash }: { returnTo?: string; flash?: "saved" }) {
  const { currentProfile, actions } = useDemoApp();

  return (
    <ProfileEditor
      profile={currentProfile ?? null}
      returnTo={returnTo}
      flash={flash}
      onSaveProfile={async (input) => {
        actions.updateCurrentProfile(input);
      }}
      onReset={() => actions.resetDemoState()}
    />
  );
}

export function ProfileForm({
  profile,
  returnTo,
  flash,
  dataSource = profile !== undefined ? "supabase" : "demo",
}: {
  profile?: Profile | null;
  returnTo?: string;
  flash?: "saved";
  dataSource?: AppDataSource;
}) {
  const shellProfile = useCurrentProfile();
  const initialProfile = profile === undefined ? shellProfile : profile;

  if (dataSource === "supabase") {
    return (
      <ProfileEditor
        profile={initialProfile ?? null}
        returnTo={returnTo}
        flash={flash}
        shouldLoadCurrentProfile={profile === undefined}
        onSaveProfile={async (input) => {
          await saveProfile({
            nickname: input.nickname.trim(),
            age: input.age,
            preferred_mode: (initialProfile ?? shellProfile)?.preferred_mode ?? "solo",
            preferred_sport: input.preferred_sport,
            preferred_regions: input.preferred_regions,
            skill_level: input.skill_level,
            open_chat_link: input.open_chat_link || null,
            phone_number: input.phone_number || null,
            default_contact_type: input.default_contact_type,
          });
        }}
      />
    );
  }

  return <DemoProfileForm returnTo={returnTo} flash={flash} />;
}
