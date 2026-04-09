"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import { DateFilterBar } from "@/components/feed/date-filter-bar";
import { MatchCard } from "@/components/feed/match-card";
import { buildContextQuery } from "@/lib/context";
import { FEED_SPORT_OPTIONS } from "@/lib/constants";
import { useDemoApp } from "@/lib/demo-state/provider";
import { getFeedMatches } from "@/lib/feed";
import type {
  FeedContext,
  FeedDataSource,
  FeedDateFilterItem,
  FeedSort,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: Array<{ value: FeedSort; label: string }> = [
  { value: "recommended", label: "추천" },
  { value: "time", label: "곧 시작" },
  { value: "distance", label: "이동시간" },
  { value: "fee", label: "참가비" },
  { value: "closing", label: "마감임박" },
];

function formatDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDateFilterItems(referenceNow: number, selectedDate?: string) {
  const base = new Date(referenceNow);
  const items: FeedDateFilterItem[] = [{ id: "all", label: "전체", dayOfWeek: "보기" }];

  for (let offset = 0; offset < 7; offset += 1) {
    const current = new Date(base);
    current.setDate(base.getDate() + offset);

    items.push({
      id: formatDateId(current),
      label: `${current.getMonth() + 1}.${current.getDate()}`,
      dayOfWeek: ["일", "월", "화", "수", "목", "금", "토"][current.getDay()] ?? "",
      fullDate: formatDateId(current),
    });
  }

  if (selectedDate && !items.some((item) => item.id === selectedDate)) {
    const extraDate = new Date(`${selectedDate}T12:00:00+09:00`);

    items.push({
      id: selectedDate,
      label: `${extraDate.getMonth() + 1}.${extraDate.getDate()}`,
      dayOfWeek: ["일", "월", "화", "수", "목", "금", "토"][extraDate.getDay()] ?? "",
      fullDate: selectedDate,
    });
  }

  return items;
}

function FilterPill({
  active,
  label,
  onClick,
  compact = false,
  stretch = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  compact?: boolean;
  stretch?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full font-bold transition active:scale-[0.985]",
        compact
          ? "min-h-[2.45rem] px-2 text-[11px] tracking-[-0.045em]"
          : "min-h-10 px-3.5 text-[12px]",
        stretch && "w-full",
        active
          ? "bg-[#06150c] text-white shadow-[0_10px_18px_rgba(6,21,12,0.11)]"
          : "bg-white/86 text-[#334139] shadow-[0_6px_12px_rgba(10,18,13,0.025)] ring-1 ring-[#e7ece7]",
      )}
    >
      {label}
    </button>
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
  const items = useMemo(
    () => getFeedMatches(source, resolvedContext, sort, referenceNow),
    [referenceNow, resolvedContext, sort, source],
  );
  const selectedDateId = resolvedContext.selectedDateFrom ?? "all";
  const dateItems = useMemo(
    () => buildDateFilterItems(referenceNow, resolvedContext.selectedDateFrom),
    [referenceNow, resolvedContext.selectedDateFrom],
  );

  function applyContext(next: Partial<FeedContext>, nextSort = sort) {
    const resolvedNext = { ...resolvedContext, ...next, sort: nextSort };
    setContext((current) => ({ ...current, ...next }));
    setSort(nextSort);
    router.replace(`/home?${buildContextQuery(resolvedNext)}`, { scroll: false });
  }

  return (
    <div className="pb-24">
      <div className="-mx-4 sticky top-0 z-30 bg-[linear-gradient(180deg,rgba(250,251,249,0.98)_0%,rgba(250,251,249,0.94)_82%,rgba(250,251,249,0)_100%)] px-4 pb-2.5 pt-1 backdrop-blur-xl">
        <div className="px-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-[1.08rem] font-bold tracking-[0.18em] text-[#112317]">
                FOOTLINK
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/84 px-2.5 py-1 text-[11px] font-semibold text-[#55625a] ring-1 ring-[#e9eeea]">
                <MapPin className="h-3.5 w-3.5" />
                수원
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex gap-2">
            {FEED_SPORT_OPTIONS.map((option) => (
              <FilterPill
                key={option.value}
                active={resolvedContext.sport === option.value}
                label={option.label}
                onClick={() => applyContext({ sport: option.value })}
              />
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {SORT_OPTIONS.map((option) => (
                <FilterPill
                  key={option.value}
                  active={sort === option.value}
                  label={option.label}
                  compact
                  stretch
                  onClick={() => applyContext({}, option.value)}
                />
              ))}
          </div>

          <div className="mt-[1.15rem]">
            <DateFilterBar
              items={dateItems}
              selectedId={selectedDateId}
              onSelect={(item) => {
                if (item.id === "all") {
                  applyContext({
                    selectedDateFrom: undefined,
                    selectedDateTo: undefined,
                    selectedDateLabel: undefined,
                    window: "all",
                  });
                  return;
                }

                applyContext({
                  selectedDateFrom: item.fullDate,
                  selectedDateTo: item.fullDate,
                  selectedDateLabel: `${item.label} ${item.dayOfWeek}`,
                  window: "all",
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              showDate={selectedDateId === "all"}
              detailHref={`/match/${match.id}?${buildContextQuery(resolvedContext)}`}
            />
          ))
        ) : (
          <div className="surface-card rounded-[1.25rem] px-4 py-5 text-[14px] font-medium leading-6 text-[#66736a]">
            해당 조건에 맞는 용병 공석이 없어요. 날짜나 종목을 바꿔 다시 확인해보세요.
          </div>
        )}
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
