"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/app/_components/EmptyState";
import { LoadingList } from "@/app/_components/LoadingList";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { useRestaurants } from "@/app/_hooks/queries/useRestaurants";
import { cn } from "@/app/_lib/utils/cn";
import { formatWon } from "@/app/_lib/utils/format";

export function RestaurantList() {
  const { data: restaurants, isPending, isError, refetch } = useRestaurants();

  if (isPending) return <LoadingList rows={5} height={88} />;
  if (isError)
    return (
      <EmptyState
        message="음식점 목록을 불러오지 못했어요."
        action={
          <button type="button" onClick={() => refetch()} className="h-11 text-ink underline underline-offset-4">
            다시 불러오기
          </button>
        }
      />
    );
  if (restaurants.length === 0) return <EmptyState message="주문할 수 있는 음식점이 없어요." />;

  // 영업중인 가게를 위로
  const sorted = [...restaurants].sort(
    (a, b) => Number(b.status === "영업중") - Number(a.status === "영업중"),
  );

  return (
    <ul className="divide-y divide-line">
      {sorted.map((r) => {
        const closed = r.status === "영업종료";
        return (
          <li key={r.restaurant_id}>
            <Link
              href={`/restaurants/${r.restaurant_id}`}
              className="flex items-center gap-3 px-4 py-4 active:bg-fill"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("truncate font-semibold", closed && "text-ink-3")}>{r.name}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-0.5 truncate text-caption text-ink-2">{r.address}</p>
                <p className="mt-1 text-caption text-ink-2 tabular-nums">
                  {r.delivery_fee === 0 ? "배달비 무료" : `배달비 ${formatWon(r.delivery_fee)}`}
                </p>
              </div>
              <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-ink-3" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
