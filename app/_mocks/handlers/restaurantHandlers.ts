import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import { menus, restaurants } from "../data";

export const restaurantHandlers = [
  http.get(`${API_URL}/restaurants`, async () => {
    await delay(300);
    return HttpResponse.json(restaurants);
  }),

  http.get(`${API_URL}/restaurants/:id`, async ({ params }) => {
    await delay(200);
    const restaurant = restaurants.find((r) => r.restaurant_id === Number(params.id));
    if (!restaurant) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "음식점을 찾을 수 없어요." }, { status: 404 });
    }
    return HttpResponse.json(restaurant);
  }),

  http.get(`${API_URL}/restaurants/:id/menus`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json(menus.filter((m) => m.restaurant_id === Number(params.id)));
  }),
];
