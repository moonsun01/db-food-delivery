"use client";

import { Button } from "@/app/_components/Button";
import { StatusBadge } from "@/app/_components/StatusBadge";
import { useUpdateOrderStatus } from "@/app/_hooks/queries/useOwnerOrders";
import { ApiError } from "@/app/_lib/api/client";
import { NEXT_ORDER_STATUS, STATUS_TONE } from "@/app/_lib/constants/status";
import type { OwnerOrder } from "@/app/_lib/types/order";
import { cn } from "@/app/_lib/utils/cn";
import { formatTime, formatWon } from "@/app/_lib/utils/format";
import { toast } from "@/app/_stores/toastStore";

const DELIVERY_TEXT = {
  waiting: "text-waiting",
  progress: "text-progress",
  success: "text-success",
  danger: "text-danger",
  neutral: "text-neutral",
} as const;

export function OwnerOrderCard({
  order,
  onReject,
}: {
  order: OwnerOrder;
  onReject: (order: OwnerOrder) => void;
}) {
  const updateStatus = useUpdateOrderStatus();
  const next = NEXT_ORDER_STATUS[order.status];

  const handleNext = () => {
    if (!next) return;
    updateStatus.mutate(
      { orderId: order.order_id, status: next },
      {
        onSuccess: () => toast(`#${order.order_id} 주문을 ${next} 상태로 바꿨어요.`),
        onError: (e) => toast(e instanceof ApiError ? e.message : "상태를 바꾸지 못했어요."),
      },
    );
  };

  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="font-bold tabular-nums">#{order.order_id}</span>
        <StatusBadge status={order.status} />
        <time className="ml-auto text-caption text-ink-3 tabular-nums" dateTime={order.ordered_time}>
          {formatTime(order.ordered_time)}
        </time>
      </div>

      <ul className="mt-3 space-y-1">
        {order.items.map((it) => (
          <li key={it.order_item_id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {it.menu_name} <span className="text-ink-3 tabular-nums">{it.quantity}개</span>
            </span>
            <span className="shrink-0 text-ink-2 tabular-nums">{formatWon(it.quantity * it.unit_price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-line pt-3">
        <span className="text-ink-2">주문금액</span>
        <span className="font-semibold tabular-nums">{formatWon(order.total_amount)}</span>
      </div>
      <p className="mt-2 truncate text-caption text-ink-2">{order.order_address}</p>

      {/* 현재 상태에서 가능한 동작만 노출 */}
      {order.status === "접수대기" && (
        <div className="mt-4 grid grid-cols-[96px_1fr] gap-2">
          <Button variant="secondary" onClick={() => onReject(order)} disabled={updateStatus.isPending}>
            거절
          </Button>
          <Button onClick={handleNext} disabled={updateStatus.isPending}>
            수락하고 조리 시작
          </Button>
        </div>
      )}

      {order.status === "조리중" && (
        <Button variant="dark" block className="mt-4" onClick={handleNext} disabled={updateStatus.isPending}>
          조리 완료
        </Button>
      )}

      {order.status === "조리완료" &&
        (order.delivery ? (
          <div className="mt-4 flex h-11 items-center justify-between rounded-md bg-fill px-3 text-caption">
            <span className="text-ink-2">라이더 {order.delivery.rider_name}</span>
            <span className={cn("font-semibold", DELIVERY_TEXT[STATUS_TONE[order.delivery.status]])}>
              {order.delivery.status}
            </span>
          </div>
        ) : (
          <div className="mt-4 flex h-11 items-center justify-center rounded-md bg-fill text-caption text-ink-2">
            라이더 수락을 기다리는 중이에요
          </div>
        ))}

      {order.status === "거절" && <p className="mt-4 text-caption text-danger">거절됨 · 결제 취소완료</p>}
    </article>
  );
}
