"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/_lib/utils/cn";

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 숫자 배지 (0이면 숨김) */
  badge?: number;
  /** 홈("/")처럼 정확히 일치할 때만 활성화 */
  exact?: boolean;
}

interface BottomTabBarProps {
  items: TabItem[];
  /** 이 경로로 시작하는 화면에서는 탭 바를 숨김 (하단 고정 CTA가 있는 화면) */
  hideOn?: string[];
}

/** 하단 탭 바 높이 — 본문 하단 여백 계산에 사용 */
export const TAB_BAR_HEIGHT = 56;

export function BottomTabBar({ items, hideOn = [] }: BottomTabBarProps) {
  const pathname = usePathname();
  if (hideOn.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      {/* 탭 바에 본문 마지막 항목이 가려지지 않도록 같은 높이의 여백 */}
      <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))] shrink-0" />
      <nav className="fixed bottom-0 left-1/2 z-20 grid w-full max-w-[480px] -translate-x-1/2 auto-cols-fr grid-flow-col border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon, badge, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-0.5",
                active ? "text-ink" : "text-ink-3",
              )}
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className={cn("text-tab", active && "font-semibold")}>{label}</span>
              {!!badge && (
                <span className="absolute top-1.5 left-1/2 ml-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-tab font-semibold text-white tabular-nums">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
