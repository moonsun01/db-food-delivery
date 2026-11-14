import { apiClient } from "./client";
import type { OrderStatus, StoreStatus } from "@/app/_lib/constants/status";
import type { OwnerOrder } from "@/app/_lib/types/order";
import type { Restaurant } from "@/app/_lib/types/restaurant";

/** 점주 API — 로그인한 점주의 가게 기준 (점주 1명 : 가게 0~1개) */
export const ownerApi = {
  getMyRestaurant: () => apiClient.get<Restaurant>("/owner/restaurant").then((r) => r.data),

  updateStoreStatus: (status: StoreStatus) =>
    apiClient.patch<Restaurant>("/owner/restaurant/status", { status }).then((r) => r.data),

  /** 진행 중(접수대기·조리중·조리완료) + 거절 주문 */
  getOrders: () => apiClient.get<OwnerOrder[]>("/owner/orders").then((r) => r.data),

  /** 접수대기 → 조리중, 조리중 → 조리완료 */
  updateOrderStatus: (orderId: number, status: OrderStatus) =>
    apiClient.patch<OwnerOrder>(`/owner/orders/${orderId}/status`, { status }).then((r) => r.data),

  /** 거절: 주문상태=거절, 결제상태=취소완료 (백엔드에서 한 트랜잭션) */
  rejectOrder: (orderId: number) =>
    apiClient.post<OwnerOrder>(`/owner/orders/${orderId}/reject`).then((r) => r.data),
};
