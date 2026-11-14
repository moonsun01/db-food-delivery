"use client";

import { ToggleSwitch } from "@/app/_components/ToggleSwitch";
import { useOwnerRestaurant, useUpdateStoreStatus } from "@/app/_hooks/queries/useOwnerRestaurant";
import { ApiError } from "@/app/_lib/api/client";
import { cn } from "@/app/_lib/utils/cn";
import { toast } from "@/app/_stores/toastStore";

/** 점주 화면 공통 상단 바: 가게명 + 영업상태 토글 (어느 화면에서든 바로 바꿀 수 있게) */
export function OwnerHeader() {
  const { data: restaurant } = useOwnerRestaurant();
  const updateStatus = useUpdateStoreStatus();
  const isOpen = restaurant?.status === "영업중";

  const handleToggle = (next: boolean) => {
    updateStatus.mutate(next ? "영업중" : "영업종료", {
      onSuccess: () =>
        toast(next ? "영업을 시작했어요. 이제 주문을 받을 수 있어요." : "영업을 종료했어요. 새 주문이 들어오지 않아요."),
      onError: (e) => toast(e instanceof ApiError ? e.message : "영업상태를 바꾸지 못했어요."),
    });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-white pr-3 pl-4">
      <h1 className="min-w-0 flex-1 truncate font-bold">{restaurant?.name ?? ""}</h1>
      {restaurant && (
        <>
          <span className={cn("text-caption font-semibold", isOpen ? "text-success" : "text-ink-3")}>
            {restaurant.status}
          </span>
          <ToggleSwitch
            label="영업상태"
            checked={isOpen}
            disabled={updateStatus.isPending}
            onChange={handleToggle}
          />
        </>
      )}
    </header>
  );
}
