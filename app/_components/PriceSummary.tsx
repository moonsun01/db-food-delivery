import { formatWon, getPaymentAmount } from "@/app/_lib/utils/format";

/** 주문금액 / 배달비 / 결제금액 3줄 — 장바구니, 주문상세 공통 */
export function PriceSummary({
  totalAmount,
  deliveryFee,
}: {
  totalAmount: number;
  deliveryFee: number;
}) {
  return (
    <dl className="space-y-2">
      <div className="flex justify-between text-ink-2">
        <dt>주문금액</dt>
        <dd className="tabular-nums">{formatWon(totalAmount)}</dd>
      </div>
      <div className="flex justify-between text-ink-2">
        <dt>배달비</dt>
        <dd className="tabular-nums">{formatWon(deliveryFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 font-bold">
        <dt>결제금액</dt>
        <dd className="tabular-nums">{formatWon(getPaymentAmount(totalAmount, deliveryFee))}</dd>
      </div>
    </dl>
  );
}
