import { Minus, Plus } from "lucide-react";

/** 수량 조절 (1 이상). 1에서 −를 누르면 onDecrease에서 제거 처리 */
export function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}) {
  return (
    <div className="flex h-11 items-center rounded-md border border-ink">
      <button
        type="button"
        aria-label="수량 빼기"
        onClick={onDecrease}
        className="flex size-11 items-center justify-center rounded-l-md active:bg-fill"
      >
        <Minus size={20} strokeWidth={1.75} />
      </button>
      <span className="w-6 text-center font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="수량 더하기"
        onClick={onIncrease}
        className="flex size-11 items-center justify-center rounded-r-md active:bg-fill"
      >
        <Plus size={20} strokeWidth={1.75} />
      </button>
    </div>
  );
}
