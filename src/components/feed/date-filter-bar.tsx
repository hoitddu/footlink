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
      <div className="flex min-w-max gap-2 pb-0.5">
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
                "flex h-[3.78rem] min-w-[3.75rem] flex-col items-center justify-center rounded-[1.2rem] border text-center transition active:scale-[0.985]",
                active
                  ? "border-[#f4f7f1] bg-[#f4f7f1] text-[#112317] shadow-[0_10px_22px_rgba(4,10,6,0.24)]"
                  : "border-white/10 bg-white/[0.05] text-[#d8e0d9] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
                isAll && "min-w-[4.05rem]",
              )}
            >
              {isAll ? (
                <>
                  <span
                    className={cn(
                      "text-[0.82rem] font-bold tracking-[-0.03em]",
                      active ? "text-[#112317]" : "text-[#f0f4ee]",
                    )}
                  >
                    전체
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[0.82rem] font-bold tracking-[-0.03em]",
                      active ? "text-[#112317]" : "text-[#f0f4ee]",
                    )}
                  >
                    보기
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      "text-[0.9rem] font-bold tracking-[-0.04em]",
                      active ? "text-[#112317]" : "text-[#f0f4ee]",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[0.72rem] font-semibold",
                      active ? "text-[#516056]" : "text-[#93a297]",
                    )}
                  >
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
