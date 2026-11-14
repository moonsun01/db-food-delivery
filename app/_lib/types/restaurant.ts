import type { StoreStatus } from "@/app/_lib/constants/status";

/**
 * API 응답 필드명은 DB 컬럼명(snake_case)을 그대로 따른다.
 * → 백엔드와 표기 방식 합의 후 변경될 수 있음 (README "백엔드와 합의할 것")
 */

/** restaurant 테이블 */
export interface Restaurant {
  restaurant_id: number;
  name: string;
  address: string;
  status: StoreStatus;
  /** 현재 배달비 설정값. 주문 시 orders.delivery_fee로 복사됨 */
  delivery_fee: number;
}

/** menu 테이블 — 설명·사진 컬럼 없음 */
export interface Menu {
  menu_id: number;
  restaurant_id: number;
  name: string;
  price: number;
}
