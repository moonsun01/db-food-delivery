import { apiClient } from "./client";
import type { Menu, Restaurant } from "@/app/_lib/types/restaurant";

export const restaurantApi = {
  getList: () => apiClient.get<Restaurant[]>("/restaurants").then((r) => r.data),

  getDetail: (restaurantId: number) =>
    apiClient.get<Restaurant>(`/restaurants/${restaurantId}`).then((r) => r.data),

  getMenus: (restaurantId: number) =>
    apiClient.get<Menu[]>(`/restaurants/${restaurantId}/menus`).then((r) => r.data),
};
