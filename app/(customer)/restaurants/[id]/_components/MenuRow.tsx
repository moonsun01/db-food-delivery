"use client";

import { QuantityStepper } from "@/app/_components/QuantityStepper";
import { formatWon } from "@/app/_lib/utils/format";
import type { Menu } from "@/app/_lib/types/restaurant";
import { useCartStore } from "@/app/_stores/cartStore";

/** menu 테이블에는 이름·가격만 있으므로 사진·설명 없이 표시 */
export function MenuRow({
  menu,
  disabled,
  onAdd,
}: {
  menu: Menu;
  disabled: boolean;
  onAdd: (menu: Menu) => void;
}) {
  const quantity = useCartStore(
    (s) => s.items.find((it) => it.menu_id === menu.menu_id)?.quantity ?? 0,
  );
  const decrease = useCartStore((s) => s.decrease);

  return (
    <li className="flex min-h-[72px] items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{menu.name}</p>
        <p className="text-ink-2 tabular-nums">{formatWon(menu.price)}</p>
      </div>
      {quantity > 0 && !disabled ? (
        <QuantityStepper
          quantity={quantity}
          onIncrease={() => onAdd(menu)}
          onDecrease={() => decrease(menu.menu_id)}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAdd(menu)}
          className="h-11 rounded-md border border-line px-4 font-semibold active:bg-fill disabled:text-ink-3"
        >
          담기
        </button>
      )}
    </li>
  );
}
