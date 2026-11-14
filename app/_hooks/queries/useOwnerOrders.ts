import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/app/_lib/api/ownerApi";
import { POLLING } from "@/app/_lib/constants/polling";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import type { OrderStatus } from "@/app/_lib/constants/status";

export function useOwnerOrders() {
  return useQuery({
    queryKey: queryKeys.owner.orders,
    queryFn: ownerApi.getOrders,
    refetchInterval: POLLING.ownerOrders,
  });
}

/** 주문상태 변경 후 폴링 주기를 기다리지 않고 바로 다시 조회 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: OrderStatus }) =>
      ownerApi.updateOrderStatus(orderId, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders }),
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => ownerApi.rejectOrder(orderId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders }),
  });
}
