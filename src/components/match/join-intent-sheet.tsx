"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getUserFacingErrorMessage } from "@/lib/errors";
import type { MatchWithMeta } from "@/lib/types";

function getRequestBounds(match: MatchWithMeta) {
  if (match.mode === "team") {
    return { min: 1, max: 1 };
  }

  return {
    min: match.min_group_size,
    max: Math.min(match.max_group_size, Math.max(match.remaining_slots, 1)),
  };
}

export function JoinIntentSheet({
  match,
  open,
  onOpenChange,
  defaultRequestedCount,
  onSubmit,
}: {
  match: MatchWithMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultRequestedCount: number;
  onSubmit: (input: { requestedCount: number; message: string }) => Promise<void> | void;
}) {
  const bounds = useMemo(() => getRequestBounds(match), [match]);
  const [requestedCount, setRequestedCount] = useState(defaultRequestedCount);
  const [arrivalTime, setArrivalTime] = useState("");
  const [intro, setIntro] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRequestedCount(Math.min(Math.max(defaultRequestedCount, bounds.min), bounds.max));
    setArrivalTime("");
    setIntro("");
    setError("");
    setIsSubmitting(false);
  }, [bounds.max, bounds.min, defaultRequestedCount, open]);

  async function handleSubmit() {
    setError("");

    if (!arrivalTime) {
      setError("도착 가능 시간을 입력해 주세요.");
      return;
    }

    if (!intro.trim()) {
      setError("한줄 소개를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await Promise.resolve(
        onSubmit({
          requestedCount,
          message: `도착 가능 시간: ${arrivalTime}\n한줄 소개: ${intro.trim()}`,
        }),
      );
      onOpenChange(false);
    } catch (submitError) {
      setError(getUserFacingErrorMessage(submitError, "참가 요청을 처리하지 못했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const countEditable = bounds.max > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="space-y-5">
          <div>
            <SheetTitle className="text-[1.4rem] font-bold tracking-[-0.04em] text-[#112317]">
              참가 요청 보내기
            </SheetTitle>
            <SheetDescription className="mt-2 text-sm leading-6 text-muted">
              요청을 보내면 호스트가 확인 후 수락 또는 거절합니다. 수락되면 오픈채팅 입장이 열립니다.
            </SheetDescription>
          </div>

          <div className="rounded-[1.25rem] bg-[#f7f9f7] px-4 py-4">
            <p className="text-sm font-semibold text-[#112317]">{match.title}</p>
            <p className="mt-1 text-sm text-muted">
              남은 자리 {match.mode === "team" ? "1팀" : `${match.remaining_slots}명`}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">요청 인원</span>
            {countEditable ? (
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  type="button"
                  variant="secondary"
                  onClick={() => setRequestedCount((count) => Math.max(bounds.min, count - 1))}
                >
                  -
                </Button>
                <div className="flex-1 rounded-[1rem] bg-[#eef2ee] px-4 py-3 text-center text-lg font-bold text-[#112317]">
                  {requestedCount}명
                </div>
                <Button
                  size="icon"
                  type="button"
                  onClick={() => setRequestedCount((count) => Math.min(bounds.max, count + 1))}
                >
                  +
                </Button>
              </div>
            ) : (
              <Input
                readOnly
                value={match.mode === "team" ? "팀 1개" : `${requestedCount}명`}
                className="bg-[#eef2ee] text-center font-bold text-[#112317]"
              />
            )}
          </div>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">도착 가능 시간</span>
            <Input
              type="time"
              value={arrivalTime}
              onChange={(event) => setArrivalTime(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">한줄 소개</span>
            <Input
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="예: 템포 맞춰 성실하게 뛰겠습니다."
            />
          </label>

          {error ? <p className="text-sm font-medium text-[#c3342b]">{error}</p> : null}

          <div className="flex gap-2">
            <Button className="flex-1" size="lg" type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button className="flex-1" size="lg" type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "참가 요청 보내기"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
