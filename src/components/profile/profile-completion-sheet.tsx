"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { AGE_BANDS, REGION_OPTIONS, SKILL_LEVELS, getSkillLevelLabel } from "@/lib/constants";
import { isProfileComplete } from "@/lib/profiles";
import { ensureAnonymousSession, createBrowserSupabaseClient } from "@/lib/supabase/client";
import { mapProfileRow } from "@/lib/supabase/mappers";
import { PROFILE_APP_SELECT, type AppProfileRow } from "@/lib/supabase/selects";
import type { EntryMode, Profile } from "@/lib/types";

type ProfileCompletionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
  preferredMode?: EntryMode;
  regionLabel?: string;
  refreshOnComplete?: boolean;
  onCompleted?: (profile: Profile) => void;
};

export function ProfileCompletionSheet({
  open,
  onOpenChange,
  profile,
  title = "프로필 먼저 입력해 주세요",
  description = "닉네임, 연령대, 실력만 입력하면 바로 다음 단계로 이어집니다.",
  confirmLabel = "저장하고 계속하기",
  preferredMode,
  regionLabel = REGION_OPTIONS[0].label,
  refreshOnComplete = false,
  onCompleted,
}: ProfileCompletionSheetProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<number>(profile?.age ?? 20);
  const [skillLevel, setSkillLevel] = useState<Profile["skill_level"]>(profile?.skill_level ?? "mid");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setNickname(profile?.nickname ?? "");
    setAgeBand(profile?.age ?? 20);
    setSkillLevel(profile?.skill_level ?? "mid");
    setError("");
    setIsSaving(false);
  }, [open, profile]);

  async function handleSave() {
    setError("");
    setIsSaving(true);

    try {
      const user = await ensureAnonymousSession();

      if (!user) {
        throw new Error("익명 세션을 만들지 못했습니다. 다시 시도해 주세요.");
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: saveError } = await supabase
        .from("profiles")
        .upsert(
          {
            auth_user_id: user.id,
            nickname: nickname.trim() || profile?.nickname || "플레이어",
            age: ageBand,
            preferred_mode: preferredMode ?? profile?.preferred_mode ?? "solo",
            preferred_regions:
              profile?.preferred_regions.length ? profile.preferred_regions : [regionLabel],
            skill_level: skillLevel,
            open_chat_link: profile?.open_chat_link ?? null,
          },
          { onConflict: "auth_user_id" },
        )
        .select(PROFILE_APP_SELECT)
        .single();

      if (saveError) {
        throw saveError;
      }

      const savedProfile = mapProfileRow(data as unknown as AppProfileRow);

      if (!isProfileComplete(savedProfile)) {
        throw new Error("프로필 저장이 완전하지 않습니다. 다시 시도해 주세요.");
      }

      onCompleted?.(savedProfile);
      onOpenChange(false);

      if (refreshOnComplete) {
        router.refresh();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "프로필을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="space-y-5">
          <div className="space-y-2">
            <SheetTitle className="text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">
              {title}
            </SheetTitle>
            <SheetDescription className="text-sm leading-6 text-[#66736a]">
              {description}
            </SheetDescription>
          </div>

          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">닉네임</span>
              <Input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="앱에서 보일 이름"
              />
            </label>

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

            <div className="rounded-[1.2rem] bg-[#f1f4f1] px-4 py-3 text-sm text-[#536157]">
              오픈채팅 링크는 매치 생성할 때만 필요합니다.
            </div>

            {error ? (
              <p className="rounded-[1.2rem] bg-[#ffe3de] px-4 py-3 text-sm font-semibold text-[#c3342b]">
                {error}
              </p>
            ) : null}

            <Button className="w-full" size="lg" type="button" disabled={isSaving} onClick={handleSave}>
              {isSaving ? "저장 중.." : confirmLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
