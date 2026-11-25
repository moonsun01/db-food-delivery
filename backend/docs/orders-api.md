# 주문 요청

POST /api/orders에 storeId, addressId, items[{menuId, quantity}], payment{method}를 보냅니다. 모든 ID와 수량은 숫자이며 결제수단은 카드 또는 간편결제입니다. 고객 Bearer 토큰이 필요합니다.
주문·주문상세·결제를 하나의 저장 트랜잭션으로 기록합니다. totalAmount는 메뉴 합계, payment.amount는 totalAmount + deliveryFee입니다.
성공은 201입니다. 결제실패 결과를 정상 기록한 경우도 201이며 주문상태와 결제상태로 실패 여부를 구분합니다. 저장 자체가 실패하면 어느 행도 남기지 않습니다.
선택 헤더 Idempotency-Key를 같은 역할·계정의 같은 주문 요청에 재사용하면 최초 생성 응답과 200을 반환합니다. 다른 요청에 같은 키를 사용하면 409입니다. 새 주문에는 새 키를 사용합니다. 현재 상태는 GET /api/orders/{orderId}에서 조회합니다.
PATCH /api/orders/{orderId}/status는 해당 점주만 호출합니다. 접수대기 → 조리중 또는 거절, 조리중 → 조리완료 순서입니다. 거절은 기존 결제의 상태와 취소일자를 같은 트랜잭션으로 갱신합니다.
고객 직접 취소, 별도 결제 생성, 실패 주문 재결제, 라이더 재배정 API는 제공하지 않습니다.
