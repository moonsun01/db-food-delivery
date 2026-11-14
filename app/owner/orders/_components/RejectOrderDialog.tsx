"use client";

import { ConfirmDialog } from "@/app/_components/ConfirmDialog";
import { useRejectOrder } from "@/app/_hooks/queries/useOwnerOrders";
import { ApiError } from "@/app/_lib/api/client";
import type { OwnerOrder } from "@/app/_lib/types/order";
import { formatWon, getPaymentAmount } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";

/** 거절 = 결제 취소. 되돌릴 수 없으므로 취소될 금액을 보여 주고 한 번 더 확인 */
export function RejectOrderDialog({ order, onClose }: { order: OwnerOrder | null; onClose: () => void }) {
  const reject = useRejectOrder();

  return (
    <ConfirmDialog
      open={order !== null}
      title="주문을 거절할까요?"
      description="거절하면 고객 결제가 바로 취소되고, 되돌릴 수 없어요."
      confirmLabel="거절하기"
      tone="danger"
      pending={reject.isPending}
      onClose={onClose}
      onConfirm={() => {
        if (!order) return;
        reject.mutate(order.order_id, {
          onSuccess: () => toast(`#${order.order_id} 주문을 거절했어요. 결제가 취소됐어요.`),
          onError: (e) => toast(e instanceof ApiError ? e.message : "주문을 거절하지 못했어요."),
          onSettled: onClose,
        });
      }}
    >
      {order && (
        <dl className="mt-4 space-y-1 rounded-md bg-fill px-3 py-2.5 text-caption">
          <div className="flex justify-between">
            <dt className="text-ink-2">주문번호</dt>
            <dd className="tabular-nums">#{order.order_id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">취소될 결제금액</dt>
            <dd className="font-semibold tabular-nums">
              {formatWon(getPaymentAmount(order.total_amount, order.delivery_fee))}
            </dd>
          </div>
        </dl>
      )}
    </ConfirmDialog>
  );
}
