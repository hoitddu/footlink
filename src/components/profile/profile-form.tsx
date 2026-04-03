"use client";

import { useState } from "react";

import { DemoIdentitySwitcher } from "@/components/app/demo-identity-switcher";
import { SectionHeading } from "@/components/app/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoApp } from "@/lib/demo-state/provider";
import { regions, skillLabels } from "@/lib/mock-data";
import type { Profile } from "@/lib/types";

export function ProfileForm() {
  const { currentProfile } = useDemoApp();

  if (!currentProfile) {
    return null;
  }

  return <ProfileEditor key={currentProfile.id} profile={currentProfile} />;
}

function ProfileEditor({ profile }: { profile: Profile }) {
  const { actions } = useDemoApp();
  const [nickname, setNickname] = useState(profile.nickname);
  const [age, setAge] = useState(String(profile.age));
  const [skillLevel, setSkillLevel] = useState(profile.skill_level);
  const [openChatLink, setOpenChatLink] = useState(profile.open_chat_link ?? "");
  const [preferredRegions, setPreferredRegions] = useState<string[]>(profile.preferred_regions);
  const [saved, setSaved] = useState(false);

  function toggleRegion(region: string) {
    setPreferredRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region],
    );
  }

  function handleSave() {
    const parsedAge = Number.parseInt(age, 10);

    actions.updateCurrentProfile({
      nickname: nickname.trim() || profile.nickname,
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : profile.age,
      skill_level: skillLevel as (typeof skillLabels)[number],
      preferred_regions: preferredRegions.length > 0 ? preferredRegions : profile.preferred_regions,
      open_chat_link: openChatLink.trim(),
    });
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-[1.75rem] p-5">
        <SectionHeading
          eyebrow="Profile"
          title="데모 프로필 설정"
          description="호스트와 신청자 화면에 바로 반영되는 기본 정보와 오픈채팅 링크를 관리하세요."
        />
        {saved ? (
          <p className="mt-4 rounded-[1.2rem] bg-[#eef2ee] px-4 py-3 text-sm font-semibold text-[#112317]">
            프로필을 저장했습니다. 이후 화면에 바로 반영됩니다.
          </p>
        ) : null}
      </section>

      <DemoIdentitySwitcher />

      <section className="surface-card rounded-[1.75rem] p-5">
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">닉네임</span>
            <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">나이</span>
              <Input min={1} type="number" value={age} onChange={(event) => setAge(event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">실력</span>
              <select
                className="h-12 w-full rounded-[1.2rem] bg-[#eef2ee] px-4 text-sm font-semibold outline-none"
                value={skillLevel}
                onChange={(event) => setSkillLevel(event.target.value as Profile["skill_level"])}
              >
                {skillLabels.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">선호 지역</span>
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => {
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

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">오픈채팅 링크</span>
            <Input
              placeholder="https://open.kakao.com/..."
              value={openChatLink}
              onChange={(event) => setOpenChatLink(event.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <Button className="flex-1" type="button" onClick={handleSave}>
              저장하기
            </Button>
            <Button className="flex-1" type="button" variant="secondary" onClick={() => actions.resetDemoState()}>
              데모 초기화
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
