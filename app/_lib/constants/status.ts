/**
 * 상태값 — DB 최종 규칙 기준. DB에 한글 VARCHAR로 저장되므로 한글 그대로 사용한다.
 * 상태 문자열은 반드시 이 파일의 상수/타입을 통해서만 사용할 것 (직접 "접수대기" 타이핑 금지).
 */

export const ORDER_STATUS = ["결제실패", "접수대기", "조리중", "조리완료", "거절"] as const;
export const PAYMENT_STATUS = ["완료", "실패", "취소완료"] as const;
export const PAYMENT_METHOD = ["카드", "간편결제"] as const;
export const DELIVERY_STATUS = ["배정완료", "픽업완료", "배달중", "배달완료"] as const;
export const RIDER_STATUS = ["운행가능", "배달중", "운행종료"] as const;
export const STORE_STATUS = ["영업중", "영업종료"] as const;
export const SETTLEMENT_STATUS = ["생성완료", "지급완료"] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];
export type RiderStatus = (typeof RIDER_STATUS)[number];
export type StoreStatus = (typeof STORE_STATUS)[number];
export type SettlementStatus = (typeof SETTLEMENT_STATUS)[number];

/** 점주가 직접 바꿀 수 있는 다음 주문상태 (거절은 별도 API) */
export const NEXT_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  접수대기: "조리중",
  조리중: "조리완료",
};

/** 배달상태는 순서대로만 변경 (재배정·역행 없음) */
export const NEXT_DELIVERY_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  배정완료: "픽업완료",
  픽업완료: "배달중",
  배달중: "배달완료",
};

/** 상태 → 색 톤 (StatusBadge에서 사용) */
export type StatusTone = "waiting" | "progress" | "success" | "danger" | "neutral";

export const STATUS_TONE: Record<
  OrderStatus | PaymentStatus | DeliveryStatus | RiderStatus | StoreStatus | SettlementStatus,
  StatusTone
> = {
  // 주문
  결제실패: "danger",
  접수대기: "waiting",
  조리중: "progress",
  조리완료: "success",
  거절: "danger",
  // 결제
  완료: "success",
  실패: "danger",
  취소완료: "danger",
  // 배달 (배달중은 라이더 운행상태와 같은 문자열 → progress)
  배정완료: "waiting",
  픽업완료: "progress",
  배달중: "progress",
  배달완료: "success",
  // 라이더
  운행가능: "success",
  운행종료: "neutral",
  // 음식점
  영업중: "success",
  영업종료: "neutral",
  // 정산
  생성완료: "waiting",
  지급완료: "success",
};
