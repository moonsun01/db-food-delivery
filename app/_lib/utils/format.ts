import { format } from "date-fns";

/** 27000 → "27,000원" (₩ 기호 쓰지 않음) */
export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** ISO 문자열 → "18:42" */
export function formatTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

/** 결제금액 = 주문금액 + 배달비 (DB 규칙 ⑤) */
export function getPaymentAmount(totalAmount: number, deliveryFee: number) {
  return totalAmount + deliveryFee;
}
