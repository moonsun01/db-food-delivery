"use client";

import Link from "next/link";
import { cn } from "@/app/_lib/utils/cn";
import { formatWon, getPaymentAmount } from "@/app/_lib/utils/format";
import { getCartSummary, useCartStore } from "@/app/_stores/cartStore";

/** 메뉴 화면 하단 고정 바: 주문금액·배달비를 나눠 보여 주고 버튼에는 결제금액 표시 */
export function CartBar({ restaurantId, isOpen }: { restaurantId: number; isOpen: boolean }) {
  const items = useCartStore((s) => s.items);
  const cartRestaurant = useCartStore((s) => s.restaurant);
  const { count, totalAmount } = getCartSummary(items);

  // 장바구니에 다른 가게 메뉴가 담겨 있으면 이 가게 금액처럼 보이지 않게 따로 안내
  const isOtherRestaurant = cartRestaurant !== null && cartRestaurant.restaurant_id !== restaurantId;
  const deliveryFee = cartRestaurant?.delivery_fee ?? 0;
  const canGoCart = isOtherRestaurant || (isOpen && count > 0);

  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      {isOtherRestaurant ? (
        <p className="mb-3 text-caption text-ink-2">
          장바구니에 <b className="font-semibold text-ink">{cartRestaurant.name}</b> 메뉴가 담겨 있어요.
        </p>
      ) : (
        count > 0 && (
          <dl className="mb-3 space-y-1 text-caption text-ink-2">
            <div className="flex justify-between">
              <dt>주문금액</dt>
              <dd className="tabular-nums">{formatWon(totalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>배달비</dt>
              <dd className="tabular-nums">{formatWon(deliveryFee)}</dd>
            </div>
          </dl>
        )
      )}
      <Link
        href="/cart"
        aria-disabled={!canGoCart}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-md font-semibold transition-colors",
          canGoCart ? "bg-brand text-white active:bg-brand-hover" : "pointer-events-none bg-fill text-ink-3",
        )}
      >
        {isOtherRestaurant ? (
          "장바구니 보기"
        ) : !isOpen ? (
          "영업 시간이 아니에요"
        ) : count === 0 ? (
          "메뉴를 담아 주세요"
        ) : (
          <>
            <span className="tabular-nums">{count}개</span>
            <span className="opacity-60">·</span>
            <span className="tabular-nums">{formatWon(getPaymentAmount(totalAmount, deliveryFee))}</span>
            장바구니 보기
          </>
        )}
      </Link>
    </div>
  );
}
