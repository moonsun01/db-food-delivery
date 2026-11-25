# 최종 테이블과 API 대응

기준은 배달앱_테이블정의서_세로.pdf 최종본, API 명세서 v0.5 및 팀 db 브랜치 SQL입니다. MySQL 모드에서는 lib/mysql-storage.js가 아래 배열 형태를 13개 SQL 테이블과 연결합니다.

| 최종 테이블 | 현재 저장 배열 | 주요 API 대응 |
| --- | --- | --- |
| customer | users의 CUSTOMER | id, name, email, phone, passwordHash(응답 제외) |
| owner | users의 OWNER | id, name, email, passwordHash(응답 제외), phone 없음 |
| rider | users의 RIDER | id, name, email, phone, status, passwordHash(응답 제외) |
| address | addresses | id, customerId, address, detailAddress |
| restaurant | stores | id, ownerId, name, address, status, deliveryFee |
| menu | menus | id, storeId, name, price |
| orders | orders | id, customerId, storeId, addressId, addressSnapshot, status, createdAt, totalAmount, deliveryFee |
| order_item | orderItems | id, orderId, menuId, quantity, unitPrice |
| payment | payments | id, orderId, method, amount, status, canceledAt |
| delivery | deliveries | id, orderId, riderId, status |
| delivery_history | deliveryHistory | id, deliveryId, status, changedAt |
| settlement | settlements | id, storeId 또는 riderId, startDate, endDate, amount, status |
| settlement_item | settlementItems | id, settlementId, orderId, payTarget, payAmount |

payTarget은 지급대상구분(pay_target)이고 ID나 FK가 아닙니다. 정산상태 status는 settlement_status에 대응합니다.
DB의 restaurant_id는 프론트에서 storeId로 표기합니다. 주문의 ordered_time은 createdAt, order_address는 addressSnapshot입니다.
주문의 items[].menuName은 현재 메뉴명이고 lineTotal은 quantity × unitPrice입니다. 배달의 pickupAddress, addressSnapshot, deliveryFee, completedAt은 음식점·주문·배달완료 이력을 조합해 반환합니다.
각 계정 테이블의 ID가 겹칠 수 있으므로 로그인 세션에는 역할과 ID를 함께 저장합니다. 세션, 중복 요청 키, ID 카운터는 별도 runtime DB의 api_state에 보관합니다. 업무 테이블 수는 그대로 13개입니다.
팀 SQL의 계정별 이메일, 음식점의 owner_id, 배달·결제의 order_id, 이력의 (delivery_id, delivery_status), 정산상세의 (order_id, pay_target), 정산의 (대상ID, start_date) UNIQUE 제약을 그대로 사용합니다.
정산은 restaurant_id와 rider_id 중 정확히 하나만 채웁니다. 주문·상세·결제 생성, 거절·결제취소, 배달·이력·라이더 상태 변경, 정산·상세 생성은 각각 하나의 MySQL 트랜잭션으로 저장합니다. 작은 팀 시연용 구현으로, 트랜잭션에서 업무 데이터를 읽고 바뀐 행을 SQL에 반영하며 runtime 행 잠금과 업무 행 잠금으로 동시 변경을 직렬화합니다.
