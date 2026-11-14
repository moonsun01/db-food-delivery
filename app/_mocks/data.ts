/**
 * MSW용 가짜 DB (메모리). 새로고침하면 초기 상태로 돌아간다.
 * 테이블 정의서 컬럼명을 그대로 사용한다.
 */
import type { OwnerOrder } from "@/app/_lib/types/order";
import type { Menu, Restaurant } from "@/app/_lib/types/restaurant";

/** 로그인한 점주의 가게라고 가정 (인증 연동 전) */
export const MY_RESTAURANT_ID = 1;

export const restaurants: Restaurant[] = [
  { restaurant_id: 1, name: "홍콩반점 광교점", address: "경기 수원시 영통구 광교중앙로 123", status: "영업중", delivery_fee: 3000 },
  { restaurant_id: 2, name: "버거하우스 광교", address: "경기 수원시 영통구 도청로 55", status: "영업중", delivery_fee: 2500 },
  { restaurant_id: 3, name: "광교김밥", address: "경기 수원시 영통구 광교호수로 210", status: "영업종료", delivery_fee: 2000 },
  { restaurant_id: 4, name: "청춘떡볶이 아주대점", address: "경기 수원시 영통구 월드컵로 206", status: "영업중", delivery_fee: 0 },
];

export const menus: Menu[] = [
  { menu_id: 1, restaurant_id: 1, name: "짜장면", price: 7000 },
  { menu_id: 2, restaurant_id: 1, name: "짬뽕", price: 8000 },
  { menu_id: 3, restaurant_id: 1, name: "간짜장", price: 8500 },
  { menu_id: 4, restaurant_id: 1, name: "탕수육 (소)", price: 13000 },
  { menu_id: 5, restaurant_id: 1, name: "탕수육 (대)", price: 19000 },
  { menu_id: 6, restaurant_id: 1, name: "볶음밥", price: 8000 },
  { menu_id: 7, restaurant_id: 1, name: "군만두", price: 6000 },
  { menu_id: 8, restaurant_id: 2, name: "클래식 버거", price: 6900 },
  { menu_id: 9, restaurant_id: 2, name: "베이컨 치즈버거", price: 8400 },
  { menu_id: 10, restaurant_id: 2, name: "감자튀김", price: 2900 },
  { menu_id: 11, restaurant_id: 2, name: "콜라", price: 2000 },
  { menu_id: 12, restaurant_id: 3, name: "기본김밥", price: 3500 },
  { menu_id: 13, restaurant_id: 3, name: "참치김밥", price: 4500 },
  { menu_id: 14, restaurant_id: 3, name: "라볶이", price: 6000 },
  { menu_id: 15, restaurant_id: 4, name: "떡볶이 1인분", price: 4500 },
  { menu_id: 16, restaurant_id: 4, name: "순대", price: 4000 },
  { menu_id: 17, restaurant_id: 4, name: "튀김 모둠", price: 5000 },
];

/** n분 전 ISO 시각 */
const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

function makeOrder(
  order_id: number,
  minutes: number,
  status: OwnerOrder["status"],
  order_address: string,
  lines: Array<[menuId: number, quantity: number]>,
  delivery: OwnerOrder["delivery"] = null,
): OwnerOrder {
  const items = lines.map(([menuId, quantity], i) => {
    const menu = menus.find((m) => m.menu_id === menuId)!;
    return { order_item_id: order_id * 10 + i, menu_id: menuId, menu_name: menu.name, quantity, unit_price: menu.price };
  });
  return {
    order_id,
    ordered_time: minutesAgo(minutes),
    status,
    order_address,
    total_amount: items.reduce((s, it) => s + it.quantity * it.unit_price, 0),
    delivery_fee: 3000,
    items,
    delivery,
  };
}

export const ownerOrders: OwnerOrder[] = [
  makeOrder(103, 2, "접수대기", "경기 수원시 영통구 광교중앙로 45, 101동 1203호", [[1, 2], [7, 1]]),
  makeOrder(102, 5, "접수대기", "경기 수원시 영통구 대학로 88, 302호", [[2, 1], [4, 1]]),
  makeOrder(101, 14, "조리중", "경기 수원시 영통구 광교호수로 12, 704호", [[6, 1], [2, 1]]),
  makeOrder(100, 29, "조리완료", "경기 수원시 영통구 도청로 30, 1502호", [[4, 1], [1, 2]], {
    delivery_id: 50,
    status: "픽업완료",
    rider_name: "박민수",
  }),
  makeOrder(99, 38, "조리완료", "경기 수원시 영통구 광교로 156, 203호", [[2, 2]]),
  makeOrder(98, 55, "거절", "경기 수원시 영통구 중부대로 9, 501호", [[1, 1]]),
];

/**
 * 데모용: 폴링이 동작하는지 볼 수 있게 시작 30초 뒤 새 주문 1건을 추가한다.
 */
const startedAt = Date.now();
let demoOrderAdded = false;

export function maybeAddDemoOrder() {
  if (demoOrderAdded || Date.now() - startedAt < 30_000) return;
  demoOrderAdded = true;
  ownerOrders.unshift(
    makeOrder(104, 0, "접수대기", "경기 수원시 영통구 광교중앙로 140, 2203호", [[3, 1], [5, 1]]),
  );
}

/**
 * 데모용: 조리완료 후 라이더 배정이 없는 주문은 20초 뒤 라이더가 수락한 것으로 처리
 */
const readyAt = new Map<number, number>();

export function markReady(orderId: number) {
  readyAt.set(orderId, Date.now());
}

export function maybeAssignRider() {
  for (const order of ownerOrders) {
    if (order.status !== "조리완료" || order.delivery) continue;
    const since = readyAt.get(order.order_id);
    if (since === undefined) {
      readyAt.set(order.order_id, Date.now());
    } else if (Date.now() - since > 20_000) {
      order.delivery = { delivery_id: 1000 + order.order_id, status: "배정완료", rider_name: "이준호" };
    }
  }
}
