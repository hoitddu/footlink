"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { SectionHeading } from "@/components/app/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AGE_BANDS, REGION_OPTIONS, SKILL_LEVELS, getSkillLevelLabel } from "@/lib/constants";
import { useDemoApp } from "@/lib/demo-state/provider";
import type { Profile } from "@/lib/types";

type SaveProfileInput = {
  nickname: string;
  age: number;
  skill_level: Profile["skill_level"];
  preferred_regions: string[];
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
  const [preferredRegions, setPreferredRegions] = useState<string[]>(
    profile?.preferred_regions.length ? profile.preferred_regions : [REGION_OPTIONS[0].label],
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleRegion(region: string) {
    setPreferredRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  }

  async function handleSave() {
    setSaved(false);
    setError("");

    try {
      await onSaveProfile({
        nickname: nickname.trim() || profile?.nickname || "플레이어",
        age: ageBand,
        skill_level: skillLevel,
        preferred_regions:
          preferredRegions.length > 0 ? preferredRegions : profile?.preferred_regions ?? [REGION_OPTIONS[0].label],
      });

      setSaved(true);

      if (returnTo) {
        router.push(returnTo);
        return;
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "프로필을 저장하지 못했습니다.");
    }
  }

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Profile"
          title="프로필 설정"
          description="참가 요청과 승인 이후 연결에 필요한 기본 정보를 입력하세요."
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
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">닉네임</span>
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>

          <div className="grid gap-3">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">나이</span>
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

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">선호 지역</span>
            <div className="flex flex-wrap gap-2">
              {REGION_OPTIONS.map((region) => {
                const active = preferredRegions.includes(region.label);

                return (
                  <button
                    key={region.slug}
                    type="button"
                    onClick={() => toggleRegion(region.label)}
                    className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                      active ? "bg-[#112317] text-white" : "bg-[#eef2ee] text-foreground"
                    }`}
                  >
                    {region.label}
                  </button>
                );
              })}
            </div>
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
          const { createBrowserSupabaseClient, ensureAnonymousSession } = await import(
            "@/lib/supabase/client"
          );
          const user = await ensureAnonymousSession();

          if (!user) {
            throw new Error("인증 세션을 만들지 못했습니다. 새로고침 후 다시 시도해주세요.");
          }

          const supabase = createBrowserSupabaseClient();
          const { error } = await supabase.from("profiles").upsert(
            {
              auth_user_id: user.id,
              nickname: input.nickname.trim(),
              age: input.age,
              preferred_mode: profile?.preferred_mode ?? "solo",
              preferred_regions: input.preferred_regions,
              skill_level: input.skill_level,
              open_chat_link: profile?.open_chat_link ?? null,
            },
            { onConflict: "auth_user_id" },
          );

          if (error) {
            throw error;
          }
        }}
      />
    );
  }

  return <DemoProfileForm returnTo={returnTo} />;
}
