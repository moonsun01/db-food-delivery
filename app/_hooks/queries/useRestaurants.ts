import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/app/_lib/api/restaurantApi";
import { queryKeys } from "@/app/_lib/constants/queryKeys";

export function useRestaurants() {
  return useQuery({
    queryKey: queryKeys.restaurants.all,
    queryFn: restaurantApi.getList,
  });
}

export function useRestaurant(restaurantId: number) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(restaurantId),
    queryFn: () => restaurantApi.getDetail(restaurantId),
    enabled: Number.isInteger(restaurantId),
  });
}

export function useMenus(restaurantId: number) {
  return useQuery({
    queryKey: queryKeys.restaurants.menus(restaurantId),
    queryFn: () => restaurantApi.getMenus(restaurantId),
    enabled: Number.isInteger(restaurantId),
  });
}
