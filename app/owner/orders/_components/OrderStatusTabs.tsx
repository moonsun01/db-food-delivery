import { cn } from "@/app/_lib/utils/cn";

export const BOARD_TABS = ["접수대기", "조리중", "조리완료"] as const;
export type BoardTab = (typeof BOARD_TABS)[number];

/** 상단 고정 탭 — 상태별 건수 표시, 접수대기 건수는 주색으로 강조 */
export function OrderStatusTabs({
  active,
  counts,
  onChange,
}: {
  /** null이면 선택된 탭 없음 (거절 목록 보는 중) */
  active: BoardTab | null;
  counts: Record<BoardTab, number>;
  onChange: (tab: BoardTab) => void;
}) {
  return (
    <nav role="tablist" className="sticky top-14 z-10 grid grid-cols-3 border-b border-line bg-white">
      {BOARD_TABS.map((tab) => {
        const selected = tab === active;
        const highlight = tab === "접수대기" && counts[tab] > 0;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab)}
            className={cn(
              "flex h-12 items-center justify-center gap-1.5 border-b-2",
              selected ? "border-ink font-semibold text-ink" : "border-transparent text-ink-3",
            )}
          >
            {tab}
            <span className={cn("tabular-nums", highlight && "font-semibold text-brand")}>{counts[tab]}</span>
          </button>
        );
      })}
    </nav>
  );
}
