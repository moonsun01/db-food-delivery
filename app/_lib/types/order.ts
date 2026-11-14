import type { DeliveryStatus, OrderStatus } from "@/app/_lib/constants/status";

/** order_item + 메뉴명 (메뉴명은 menu 조인 값으로 가정) */
export interface OrderItem {
  order_item_id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  /** 주문 시점 메뉴가격 복사본 */
  unit_price: number;
}

/** 배달 요약 (delivery + rider 이름). 라이더가 수락하기 전이면 null */
export interface DeliverySummary {
  delivery_id: number;
  status: DeliveryStatus;
  rider_name: string;
}

/** 점주 주문 관리 화면용 주문 (orders + order_item + delivery) */
export interface OwnerOrder {
  order_id: number;
  /** ISO 문자열 */
  ordered_time: string;
  status: OrderStatus;
  /** 주문 시점 배송주소+상세주소 복사본 */
  order_address: string;
  /** 메뉴 금액 합계 (배달비 제외) */
  total_amount: number;
  /** 주문 시점 배달비 복사본 */
  delivery_fee: number;
  items: OrderItem[];
  delivery: DeliverySummary | null;
}
