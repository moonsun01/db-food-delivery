import { delay, http, HttpResponse } from "msw";
import { API_URL } from "@/app/_lib/api/client";
import { NEXT_ORDER_STATUS, type OrderStatus, type StoreStatus } from "@/app/_lib/constants/status";
import { markReady, maybeAddDemoOrder, maybeAssignRider, MY_RESTAURANT_ID, ownerOrders, restaurants } from "../data";

const myRestaurant = () => restaurants.find((r) => r.restaurant_id === MY_RESTAURANT_ID)!;

const invalidStatus = (message: string) =>
  HttpResponse.json({ code: "INVALID_ORDER_STATUS", message }, { status: 409 });

export const ownerHandlers = [
  http.get(`${API_URL}/owner/restaurant`, async () => {
    await delay(200);
    return HttpResponse.json(myRestaurant());
  }),

  http.patch<never, { status: StoreStatus }>(`${API_URL}/owner/restaurant/status`, async ({ request }) => {
    await delay(300);
    const { status } = await request.json();
    const restaurant = myRestaurant();
    restaurant.status = status;
    return HttpResponse.json(restaurant);
  }),

  http.get(`${API_URL}/owner/orders`, async () => {
    await delay(300);
    maybeAddDemoOrder();
    maybeAssignRider();
    return HttpResponse.json(ownerOrders);
  }),

  http.patch<{ id: string }, { status: OrderStatus }>(
    `${API_URL}/owner/orders/:id/status`,
    async ({ params, request }) => {
      await delay(400);
      const { status } = await request.json();
      const order = ownerOrders.find((o) => o.order_id === Number(params.id));
      if (!order) return HttpResponse.json({ code: "NOT_FOUND", message: "주문을 찾을 수 없어요." }, { status: 404 });

      // 순서대로만 변경 가능 (접수대기 → 조리중 → 조리완료)
      if (NEXT_ORDER_STATUS[order.status] !== status) {
        return invalidStatus(`이미 ${order.status} 상태인 주문이에요. 목록을 새로고침했어요.`);
      }
      order.status = status;
      if (status === "조리완료") markReady(order.order_id);
      return HttpResponse.json(order);
    },
  ),

  http.post<{ id: string }>(`${API_URL}/owner/orders/:id/reject`, async ({ params }) => {
    await delay(400);
    const order = ownerOrders.find((o) => o.order_id === Number(params.id));
    if (!order) return HttpResponse.json({ code: "NOT_FOUND", message: "주문을 찾을 수 없어요." }, { status: 404 });

    // 접수대기일 때만 거절 가능 → 주문상태 거절 + 결제상태 취소완료
    if (order.status !== "접수대기") {
      return invalidStatus(`${order.status} 상태인 주문은 거절할 수 없어요.`);
    }
    order.status = "거절";
    return HttpResponse.json(order);
  }),
];
