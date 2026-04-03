"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";

import { skillLabels } from "@/lib/mock-data";
import type { SkillLevel } from "@/lib/types";

const QUICK_OPTIONS = [1, 2, 3, 4, 5, 6];

export function PlayerCountSelector({
  value,
  onChange,
  skillLevel,
  onSkillChange,
}: {
  value: number;
  onChange: (count: number) => void;
  skillLevel: SkillLevel;
  onSkillChange: (skill: SkillLevel) => void;
}) {
  function decrement() {
    onChange(Math.max(1, value - 1));
  }

  function increment() {
    onChange(Math.min(20, value + 1));
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-2">
      <div className="mb-5">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#0c140f]">
          몇 명이 함께 뛰나요?
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          인원 수와 실력을 먼저 고르면 더 맞는 매치를 빠르게 보여드릴게요.
        </p>
      </div>

      <div className="surface-card rounded-[2rem] px-5 py-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={decrement}
            disabled={value <= 1}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ee] text-[#112317] transition active:scale-95 disabled:opacity-35"
          >
            <Minus className="h-5 w-5" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center">
            <span className="font-display tabular-nums text-[5.5rem] font-bold leading-none tracking-[-0.08em] text-[#112317]">
              {value}
            </span>
            <span className="font-display mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#7a857e]">
              Players
            </span>
          </div>

          <button
            type="button"
            onClick={increment}
            className="kinetic-gradient lime-glow flex h-14 w-14 items-center justify-center rounded-full text-white transition active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-2">
          {QUICK_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onChange(count)}
              className={`rounded-full py-3 text-sm font-bold transition active:scale-95 ${
                value === count
                  ? "kinetic-gradient text-white"
                  : "bg-[#eef2ee] text-[#55625a]"
              }`}
            >
              {count}명
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 surface-card rounded-[2rem] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6a766f]">
          Skill Level
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {skillLabels.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => onSkillChange(skill)}
              className={`rounded-[1.1rem] px-4 py-3 text-sm font-bold transition active:scale-95 ${
                skillLevel === skill
                  ? "bg-[#112317] text-white shadow-[0_14px_28px_rgba(6,21,12,0.16)]"
                  : "bg-[#eef2ee] text-[#55625a]"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <Link
        href="/create"
        className="mx-auto mt-6 inline-block border-b-2 border-[#b8ff5a]/50 pb-0.5 text-sm font-bold text-[#39443d] transition hover:text-[#112317]"
      >
        새 매치 만들기
      </Link>
    </div>
  );
}
