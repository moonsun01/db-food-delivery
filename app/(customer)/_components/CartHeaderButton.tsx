"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getCartSummary, useCartStore } from "@/app/_stores/cartStore";

export function CartHeaderButton() {
  const items = useCartStore((s) => s.items);
  const { count } = getCartSummary(items);

  return (
    <Link
      href="/cart"
      aria-label={`장바구니 ${count}개`}
      className="relative flex size-11 items-center justify-center rounded-md active:bg-fill"
    >
      <ShoppingBag size={22} strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute top-1.5 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-tab font-semibold text-white tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
