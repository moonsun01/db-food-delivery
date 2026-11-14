import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/app/_lib/api/ownerApi";
import { queryKeys } from "@/app/_lib/constants/queryKeys";
import type { StoreStatus } from "@/app/_lib/constants/status";

export function useOwnerRestaurant() {
  return useQuery({
    queryKey: queryKeys.owner.restaurant,
    queryFn: ownerApi.getMyRestaurant,
  });
}

export function useUpdateStoreStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: StoreStatus) => ownerApi.updateStoreStatus(status),
    onSuccess: (restaurant) => {
      queryClient.setQueryData(queryKeys.owner.restaurant, restaurant);
      // 고객 화면의 음식점 목록·상세도 영업상태가 바뀌므로 함께 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
    },
  });
}
