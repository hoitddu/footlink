"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { SPORT_OPTIONS } from "@/lib/constants";
import type { SportType } from "@/lib/types";

export function MatchIntentStep({
  sport,
  onSportChange,
}: {
  sport: SportType;
  onSportChange: (sport: SportType) => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pt-1">
      <div className="mb-3">
        <h1 className="text-[1.68rem] font-bold tracking-[-0.04em] text-[#0c140f]">어떤 경기를 찾고 있나요?</h1>
        <p className="mt-1 text-[13px] leading-5 text-muted">
          첫 홈 화면은 선택한 종목 기준으로 열립니다. 시간과 거리는 홈에서 바로 바꿀 수 있어요.
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 pb-2">
        {SPORT_OPTIONS.map((option) => {
          const active = sport === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSportChange(option.value)}
              className={`surface-card flex items-center justify-between rounded-[1.75rem] px-4 py-4 text-left transition active:scale-[0.985] ${
                active ? "ring-2 ring-[#b8ff5a]" : ""
              }`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Sport</p>
                <h2 className="mt-1 text-[1.25rem] font-bold tracking-[-0.04em] text-[#112317]">
                  {option.label}
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-[#66736a]">
                  {option.value === "futsal"
                    ? "수원에서 가장 빠르게 구할 수 있는 풋살 공석부터 보여드립니다."
                    : "축구 공석도 같은 흐름으로 탐색할 수 있게 준비합니다."}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  active ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#6c766f]"
                }`}
              >
                {active ? <Check className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </button>
          );
        })}

        <div className="surface-card rounded-[1.5rem] px-4 py-4">
          <p className="text-[13px] font-medium leading-6 text-[#66736a]">
            직접 부족 인원을 채우고 싶다면
            <Link href="/create" className="ml-2 inline-block border-b border-[#112317]/25 font-bold text-[#112317]">
              공석 올리기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
