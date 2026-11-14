/**
 * 폴링 주기 (ms). 실시간 연동이 없으므로 TanStack Query refetchInterval로 처리한다.
 * false = 폴링하지 않음 (화면 진입·상태 변경 시에만 조회)
 * 탭이 백그라운드면 자동으로 멈춘다 (refetchIntervalInBackground 기본값 false).
 */
export const POLLING = {
  /** 점주 주문 관리 — 새 주문을 놓치면 안 됨 */
  ownerOrders: 10_000,
  /** 라이더 수락 가능한 주문 — 선착순이라 가장 빠르게 */
  riderAvailableOrders: 5_000,
  /** 고객 주문 상세 — 끝난 주문(배달완료·거절·결제실패)이면 중지 */
  customerOrderDetail: 10_000,
  /** 라이더 진행 중 배달 — 라이더 본인이 상태를 바꾸므로 폴링 안 함 */
  riderActiveDelivery: false,
  customerOrders: false,
  settlements: false,
} as const;
