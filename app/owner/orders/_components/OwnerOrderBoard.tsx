"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/app/_components/EmptyState";
import { useOwnerOrders } from "@/app/_hooks/queries/useOwnerOrders";
import type { OrderStatus } from "@/app/_lib/constants/status";
import type { OwnerOrder } from "@/app/_lib/types/order";
import { toast } from "@/app/_stores/toastStore";
import { OrderStatusTabs, type BoardTab } from "./OrderStatusTabs";
import { OwnerOrderCard } from "./OwnerOrderCard";
import { RejectOrderDialog } from "./RejectOrderDialog";

export function OwnerOrderBoard() {
  const { data: orders, isPending, isError, refetch } = useOwnerOrders();
  const [tab, setTab] = useState<BoardTab>("접수대기");
  const [showRejected, setShowRejected] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OwnerOrder | null>(null);

  useNewOrderAlert(orders);

  const countOf = (status: OrderStatus) => orders?.filter((o) => o.status === status).length ?? 0;
  const visibleStatus: OrderStatus = showRejected ? "거절" : tab;
  const visible = orders?.filter((o) => o.status === visibleStatus) ?? [];

  return (
    <>
      <OrderStatusTabs
        active={showRejected ? null : tab}
        counts={{ 접수대기: countOf("접수대기"), 조리중: countOf("조리중"), 조리완료: countOf("조리완료") }}
        onChange={(next) => {
          setTab(next);
          setShowRejected(false);
        }}
      />

      <main className="flex-1 px-4 pt-4">
        {isPending ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg border border-line bg-white" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            message="주문을 불러오지 못했어요."
            action={
              <button type="button" onClick={() => refetch()} className="h-11 underline underline-offset-4">
                다시 불러오기
              </button>
            }
          />
        ) : (
          <>
            {showRejected && <p className="mb-3 text-caption font-semibold text-ink-2">거절된 주문</p>}
            {visible.length === 0 ? (
              <EmptyState message={`${visibleStatus} 주문이 없어요.`} />
            ) : (
              <div className="space-y-3">
                {visible.map((order) => (
                  <OwnerOrderCard key={order.order_id} order={order} onReject={setRejectTarget} />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowRejected((v) => !v)}
              className="mt-6 mb-4 h-11 w-full text-caption text-ink-2 underline underline-offset-4"
            >
              {showRejected ? "진행 중인 주문으로 돌아가기" : `거절된 주문 보기 (${countOf("거절")})`}
            </button>
          </>
        )}
      </main>

      <RejectOrderDialog order={rejectTarget} onClose={() => setRejectTarget(null)} />
    </>
  );
}

/** 폴링으로 접수대기 주문이 늘어나면 진동 + 토스트 */
function useNewOrderAlert(orders: OwnerOrder[] | undefined) {
  const prevIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!orders) return;
    const waitingIds = new Set(orders.filter((o) => o.status === "접수대기").map((o) => o.order_id));
    // 첫 조회는 기준값만 저장
    if (prevIds.current) {
      const newCount = [...waitingIds].filter((id) => !prevIds.current!.has(id)).length;
      if (newCount > 0) {
        navigator.vibrate?.(200);
        toast(`새 주문이 ${newCount}건 들어왔어요.`);
      }
    }
    prevIds.current = waitingIds;
  }, [orders]);
}
