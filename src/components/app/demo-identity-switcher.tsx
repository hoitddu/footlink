"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoApp } from "@/lib/demo-state/provider";

export function DemoIdentitySwitcher() {
  const { state, actions, currentProfile } = useDemoApp();

  return (
    <section className="surface-card rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
            Demo User
          </p>
          <p className="mt-1 text-lg font-bold tracking-[-0.03em] text-[#112317]">
            {currentProfile?.nickname ?? "데모 유저"}
          </p>
        </div>
        <Badge variant={currentProfile?.role === "captain" ? "team" : "success"}>
          {currentProfile?.role === "captain" ? "호스트" : "신청자"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {state.profiles.map((profile) => (
          <Button
            key={profile.id}
            type="button"
            variant={profile.id === state.currentProfileId ? "default" : "secondary"}
            className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
            onClick={() => actions.switchProfile(profile.id)}
          >
            <span className="text-sm font-bold">{profile.nickname}</span>
            <span className="text-xs font-semibold opacity-80">
              {profile.role === "captain" ? "호스트 운영" : "참가자 시점"}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
