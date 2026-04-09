"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import type { FeedDateFilterItem } from "@/lib/types";

export function DateFilterBar({
  items,
  selectedId,
  onSelect,
}: {
  items: FeedDateFilterItem[];
  selectedId: string;
  onSelect: (item: FeedDateFilterItem) => void;
}) {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const target = itemRefs.current[selectedId];

    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedId]);

  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
      <div className="flex min-w-max gap-2 pb-1">
        {items.map((item) => {
          const active = item.id === selectedId;
          const isAll = item.id === "all";

          return (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[item.id] = node;
              }}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item)}
              className={cn(
                "flex h-[4.25rem] min-w-[4rem] flex-col items-center justify-center rounded-[1.3rem] border text-center transition active:scale-[0.985]",
                active
                  ? "border-[#06150c] bg-[#06150c] text-white shadow-[0_8px_16px_rgba(6,21,12,0.11)]"
                  : "border-[#e8ece8] bg-white/84 text-[#4c584f] shadow-[0_5px_12px_rgba(10,18,13,0.025)]",
                isAll && "min-w-[4.35rem]",
              )}
            >
              {isAll ? (
                <>
                  <span className={cn("text-[0.9rem] font-bold tracking-[-0.03em]", active ? "text-white" : "text-[#112317]")}>
                    전체
                  </span>
                  <span className={cn("mt-0.5 text-[0.9rem] font-bold tracking-[-0.03em]", active ? "text-white" : "text-[#112317]")}>
                    보기
                  </span>
                </>
              ) : (
                <>
                  <span className={cn("text-[0.96rem] font-bold tracking-[-0.04em]", active ? "text-white" : "text-[#112317]")}>
                    {item.label}
                  </span>
                  <span className={cn("mt-0.5 text-[0.8rem] font-semibold", active ? "text-white/82" : "text-[#8b968e]")}>
                    {item.dayOfWeek}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
