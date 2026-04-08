"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { saveProfile } from "@/components/profile/profile-save";
import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { SectionHeading } from "@/components/app/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AGE_BANDS,
  REGION_OPTIONS,
  SKILL_LEVELS,
  SPORT_OPTIONS,
  getSkillLevelLabel,
} from "@/lib/constants";
import { getUserFacingErrorMessage } from "@/lib/errors";
import { useDemoApp } from "@/lib/demo-state/provider";
import type { Profile, SportType } from "@/lib/types";

type SaveProfileInput = {
  nickname: string;
  age: number;
  skill_level: Profile["skill_level"];
  preferred_sport: SportType | null;
  preferred_regions: string[];
  open_chat_link: string;
};

function ProfileEditor({
  profile,
  returnTo,
  onSaveProfile,
  onReset,
}: {
  profile: Profile | null;
  returnTo?: string;
  onSaveProfile: (input: SaveProfileInput) => Promise<void>;
  onReset?: () => void;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<number>(profile?.age ?? 20);
  const [skillLevel, setSkillLevel] = useState<Profile["skill_level"]>(profile?.skill_level ?? "mid");
  const [preferredSport, setPreferredSport] = useState<SportType | null>(profile?.preferred_sport ?? "futsal");
  const [openChatLink, setOpenChatLink] = useState(profile?.open_chat_link ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaved(false);
    setError("");

    try {
      await onSaveProfile({
        nickname: nickname.trim() || profile?.nickname || "플레이어",
        age: ageBand,
        skill_level: skillLevel,
        preferred_sport: preferredSport,
        preferred_regions: [REGION_OPTIONS[0].label],
        open_chat_link: openChatLink.trim(),
      });

      setSaved(true);

      if (returnTo) {
        router.push(returnTo);
        return;
      }

      router.refresh();
    } catch (saveError) {
      setError(getUserFacingErrorMessage(saveError, "프로필을 저장하지 못했습니다."));
    }
  }

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Profile"
          title="프로필 설정"
          description="홈에서는 빠르게 보고, 세부 취향은 여기에서 정리합니다."
        />
        {saved ? (
          <p className="mt-4 rounded-[1.2rem] bg-[#eef2ee] px-4 py-3 text-sm font-semibold text-[#112317]">
            프로필을 저장했습니다.
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
            {error}
          </p>
        ) : null}
      </section>

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
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">실력</span>
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

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">연락 링크</span>
            <Input
              value={openChatLink}
              onChange={(event) => setOpenChatLink(event.target.value)}
              placeholder="https://open.kakao.com/..."
            />
            <p className="text-xs leading-5 text-[#66736a]">
              공석을 올릴 때 바로 연락받고 싶다면 오픈채팅 링크를 넣어두세요.
            </p>
          </label>

          <div className="rounded-[1.15rem] bg-[#f4f7f3] px-4 py-3 text-sm text-[#536157]">
            현재 서비스 지역은 수원으로 고정되어 있습니다.
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" type="button" onClick={handleSave}>
              저장하기
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

function DemoProfileForm({ returnTo }: { returnTo?: string }) {
  const { currentProfile, actions } = useDemoApp();

  return (
    <ProfileEditor
      profile={currentProfile ?? null}
      returnTo={returnTo}
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
}: {
  profile?: Profile | null;
  returnTo?: string;
}) {
  if (profile !== undefined) {
    return (
      <ProfileEditor
        profile={profile}
        returnTo={returnTo}
        onSaveProfile={async (input) => {
          await saveProfile({
            nickname: input.nickname.trim(),
            age: input.age,
            preferred_mode: profile?.preferred_mode ?? "solo",
            preferred_sport: input.preferred_sport,
            preferred_regions: input.preferred_regions,
            skill_level: input.skill_level,
            open_chat_link: input.open_chat_link || null,
          });
        }}
      />
    );
  }

  return <DemoProfileForm returnTo={returnTo} />;
}
