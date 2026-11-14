"use client";

import Link from "next/link";
import { Button } from "@/app/_components/Button";
import { EmptyState } from "@/app/_components/EmptyState";
import { PriceSummary } from "@/app/_components/PriceSummary";
import { QuantityStepper } from "@/app/_components/QuantityStepper";
import { formatWon } from "@/app/_lib/utils/format";
import { getCartSummary, useCartStore } from "@/app/_stores/cartStore";

export function CartView() {
  const { restaurant, items, increase, decrease } = useCartStore();
  const { totalAmount } = getCartSummary(items);

  if (!restaurant || items.length === 0) {
    return (
      <main className="flex-1">
        <EmptyState
          message="장바구니가 비어 있어요."
          action={
            <Link href="/" className="h-11 leading-[44px] text-ink underline underline-offset-4">
              음식점 둘러보기
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <>
      <main className="flex-1">
        <section className="border-b border-line px-4 py-4">
          <Link href={`/restaurants/${restaurant.restaurant_id}`} className="font-bold">
            {restaurant.name}
          </Link>
        </section>

        <ul className="divide-y divide-line border-b border-line">
          {items.map((it) => (
            <li key={it.menu_id} className="flex min-h-[72px] items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{it.name}</p>
                <p className="text-ink-2 tabular-nums">{formatWon(it.price * it.quantity)}</p>
              </div>
              <QuantityStepper
                quantity={it.quantity}
                onIncrease={() => increase(it.menu_id)}
                onDecrease={() => decrease(it.menu_id)}
              />
            </li>
          ))}
        </ul>

        <section className="px-4 py-5">
          <PriceSummary totalAmount={totalAmount} deliveryFee={restaurant.delivery_fee} />
        </section>
      </main>

      <div className="sticky bottom-0 border-t border-line bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {/* TODO: 배송지·결제수단 선택, 주문 생성 API — 백엔드 API 합의 후 연결 */}
        <p className="mb-2 text-center text-caption text-ink-3">배송지·결제수단 선택은 다음 작업에서 연결해요</p>
        <Button block disabled>
          주문하기
        </Button>
      </div>
    </>
  );
}
