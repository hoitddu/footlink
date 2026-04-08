"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock3, MapPin, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { MatchCard } from "@/components/feed/match-card";
import { Button } from "@/components/ui/button";
import { buildContextQuery } from "@/lib/context";
import { RADIUS_OPTIONS, SPORT_OPTIONS, TIME_WINDOW_OPTIONS } from "@/lib/constants";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getFeedMatches, getFeedSections } from "@/lib/feed";
import type { FeedContext, FeedDataSource, FeedSort } from "@/lib/types";
import { cn } from "@/lib/utils";

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95",
        active ? "kinetic-gradient text-white shadow-[0_10px_24px_rgba(6,21,12,0.14)]" : "bg-[#eef2ee] text-[#334139]",
      )}
    >
      {label}
    </button>
  );
}

function SectionBlock({
  title,
  description,
  items,
  contextQuery,
  empty,
}: {
  title: string;
  description: string;
  items: ReturnType<typeof getFeedMatches>;
  contextQuery: string;
  empty: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Open Spots</p>
          <h2 className="mt-1 text-[1.35rem] font-bold tracking-[-0.04em] text-[#112317]">{title}</h2>
        </div>
        <span className="rounded-full bg-[#eef2ee] px-2.5 py-1 text-[11px] font-bold text-[#55625a]">
          {items.length}
        </span>
      </div>
      <p className="px-1 text-[13px] leading-5 text-[#66736a]">{description}</p>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((match) => (
            <MatchCard key={match.id} match={match} detailHref={`/match/${match.id}?${contextQuery}`} />
          ))}
        </div>
      ) : (
        <div className="surface-card rounded-[1.35rem] px-4 py-5 text-sm font-medium text-[#66736a]">
          {empty}
        </div>
      )}
    </section>
  );
}

function FeedScreenView({
  initialContext,
  initialReferenceNow,
  source,
}: {
  initialContext: FeedContext;
  initialReferenceNow: number;
  source: FeedDataSource;
}) {
  const router = useRouter();
  const [context, setContext] = useState(initialContext);
  const [sort, setSort] = useState<FeedSort>(initialContext.sort);
  const referenceNow = initialReferenceNow;
  const resolvedContext = useMemo(() => ({ ...context, sort }), [context, sort]);
  const contextQuery = buildContextQuery(resolvedContext);

  const items = useMemo(
    () => getFeedMatches(source, resolvedContext, sort, referenceNow),
    [referenceNow, resolvedContext, sort, source],
  );
  const sections = useMemo(() => getFeedSections(items, referenceNow), [items, referenceNow]);

  function applyContext(next: Partial<FeedContext>, nextSort = sort) {
    const resolvedNext = { ...resolvedContext, ...next, sort: nextSort };
    setContext((current) => ({ ...current, ...next }));
    setSort(nextSort);
    router.replace(`/home?${buildContextQuery(resolvedNext)}`, { scroll: false });
  }

  const emptyMessage =
    resolvedContext.sport === "soccer"
      ? "지금 조건에 맞는 축구 공석이 없습니다. 풋살로 바꾸거나 시간을 넓혀 보세요."
      : "지금 조건에 맞는 풋살 공석이 없습니다. 거리나 시간을 조금 넓혀 보세요.";

  return (
    <div className="space-y-4 pb-24">
      <section className="surface-card rounded-[1.7rem] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">FootLink</p>
            <h1 className="mt-1 text-[1.8rem] font-bold tracking-[-0.05em] text-[#112317]">
              수원 용병 레이더
            </h1>
          </div>
          <div className="rounded-full bg-[#eef2ee] px-3 py-1.5 text-[11px] font-bold text-[#55625a]">
            {resolvedContext.regionLabel}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {SPORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => applyContext({ sport: option.value })}
              className={cn(
                "min-h-12 rounded-[1rem] px-4 py-3 text-[15px] font-bold transition active:scale-[0.98]",
                resolvedContext.sport === option.value ? "kinetic-gradient text-white" : "bg-[#eef2ee] text-[#223128]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-[#66736a]">
          <MapPin className="h-3.5 w-3.5" />
          <span>수원 기준</span>
          <span className="text-[#c8cec9]">·</span>
          <Clock3 className="h-3.5 w-3.5" />
          <span>{items.length}개 공석</span>
        </div>
      </section>

      <section className="surface-card rounded-[1.55rem] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d786f]">Filters</p>
            <h2 className="mt-1 text-[1.1rem] font-bold tracking-[-0.04em] text-[#112317]">
              빠른 참여 조건
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSort((current) => (current === "urgent" ? "distance" : "urgent"))}
            className="flex h-11 items-center gap-2 rounded-full bg-[#eef2ee] px-4 text-[12px] font-bold text-[#112317] transition active:scale-95"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {sort === "urgent" ? "급한 순" : "가까운 순"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TIME_WINDOW_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={resolvedContext.window === option.value}
              label={option.label}
              onClick={() => applyContext({ window: option.value })}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={(resolvedContext.radiusKm ?? 5) === option.value}
              label={option.label}
              onClick={() => applyContext({ radiusKm: option.value })}
            />
          ))}
          <FilterChip
            active={resolvedContext.onlyLastSpot}
            label="1자리만"
            onClick={() => applyContext({ onlyLastSpot: !resolvedContext.onlyLastSpot })}
          />
        </div>
      </section>

      {resolvedContext.window === "today" || resolvedContext.window === "now" ? (
        <>
          <SectionBlock
            title="지금 급한 공석"
            description="곧 시작하거나 마지막 자리가 남은 경기부터 보여줍니다."
            items={sections.immediate}
            contextQuery={contextQuery}
            empty={emptyMessage}
          />
          <SectionBlock
            title="오늘 늦은 경기"
            description="오늘 안에 참여할 수 있는 다음 후보입니다."
            items={sections.laterToday}
            contextQuery={contextQuery}
            empty="오늘 늦은 시간 공석은 아직 없습니다."
          />
          <SectionBlock
            title="이번 주말"
            description="오늘 조건이 비어 있으면 주말 공석까지 같이 확인해 보세요."
            items={sections.weekend}
            contextQuery={contextQuery}
            empty="이번 주말 조건에 맞는 공석은 아직 없습니다."
          />
        </>
      ) : (
        <SectionBlock
          title={resolvedContext.window === "tomorrow" ? "내일 공석" : "주말 공석"}
          description="선택한 시간대에 맞는 공석만 모아 보여줍니다."
          items={items}
          contextQuery={contextQuery}
          empty={emptyMessage}
        />
      )}

      <div className="surface-card rounded-[1.35rem] px-4 py-4">
        <p className="text-[13px] font-medium leading-6 text-[#66736a]">
          직접 사람을 구해야 한다면 공석을 올리고 빠르게 연락을 받아보세요.
        </p>
        <Button asChild className="mt-3" size="sm">
          <Link href="/create">공석 올리기</Link>
        </Button>
      </div>
    </div>
  );
}

function DemoFeedScreen(props: {
  initialContext: FeedContext;
  initialReferenceNow: number;
}) {
  const { state } = useDemoApp();

  return <FeedScreenView {...props} source={state} />;
}

export function FeedScreen({
  source,
  ...props
}: {
  initialContext: FeedContext;
  initialReferenceNow: number;
  source?: FeedDataSource;
}) {
  if (source) {
    return <FeedScreenView {...props} source={source} />;
  }

  return <DemoFeedScreen {...props} />;
}
