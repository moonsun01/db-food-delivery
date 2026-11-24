-- =====================================================================
--  배달앱 플랫폼 시연(영상 촬영)용 데이터 (data.sql v2)
--  기준 : 팀 시연 시나리오(mk1) + schema.sql (테이블 정의서 그대로)
--  ※ 가게·메뉴 사진은 DB에 없음 → ID 기반 파일 이름 규칙 (프론트/백엔드)
--  ※ 품절은 DB에 없음 → 백엔드 soldout.json 으로 관리 (예: 돈까스김밥 menu_id 3)
--  ※ 반드시 schema.sql을 먼저 실행해서 빈 DB를 만든 뒤 실행
--  ※ 날짜는 "실행한 날" 기준으로 자동 계산됨 (촬영 당일 실행 권장)
--     지난주 = 실행일 기준 지난주 월~일 / 2주 전 = 그 전주 월~일
--  ※ 모든 계정 비밀번호 : test1234 (bcrypt, cost 10)
--
--  [시작 상태 요약]
--   손님 customer@test.com : 배송지 2개, 내 주문 3건 (배달완료·거절·배달중)
--   사장님 owner@test.com   : 김밥천국 광교점 (시작 시 영업종료 → 장면0에서 영업 켜기)
--                             신규(접수대기) 1건, 조리중 1건, 정산 2주치
--   사장님 newowner@test.com: 가게 없음 (로그인하면 가게 등록부터)
--   라이더 rider@test.com   : 시작 시 운행종료 (장면0에서 출근). 수락 가능한 주문 2건
--   라이더 rider2@test.com  : 운행종료 (동시 수락 예외 장면용 두 번째 라이더)
--   라이더 rider3@test.com  : 손님 주문을 배달중
--   중복 테스트 taken@test.com : 이미 가입된 손님 (가입 시 409)
-- =====================================================================
USE delivery_app;

-- 기준 날짜 계산
SET @this_mon = CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY;   -- 이번 주 월요일
SET @w1 = @this_mon - INTERVAL 7 DAY;                           -- 지난주 월요일
SET @w2 = @this_mon - INTERVAL 14 DAY;                          -- 2주 전 월요일
SET @pw = '$2b$10$LzJ.yTykma4CwrIi43Y12OLnk2U5yq1stRZ0mV6YeqyE7FoarhCU.';  -- test1234

-- ---------------------------------------------------------------------
-- 1. 손님 4명, 배송지 5개
-- ---------------------------------------------------------------------
INSERT INTO customer (customer_id, name, email, phone, password_hash) VALUES
 (1, '김손님', 'customer@test.com', '010-1000-0001', @pw),   -- 시연 주인공
 (2, '박광교', 'guest2@test.com',   '010-1000-0002', @pw),
 (3, '이수원', 'guest3@test.com',   '010-1000-0003', @pw),
 (4, '정중복', 'taken@test.com',    '010-1000-0004', @pw);   -- 이메일 중복 테스트용

INSERT INTO address (address_id, customer_id, address, address_detail) VALUES
 (1, 1, '경기 수원시 영통구 광교중앙로 140', '광교아파트 101동 1203호'),  -- 손님 집 (마지막 주문 배송지)
 (2, 1, '경기 수원시 영통구 대학로 55',      '광교테크노밸리 3층'),        -- 손님 회사
 (3, 2, '경기 수원시 영통구 광교호수로 20',  '205호'),
 (4, 3, '경기 용인시 수지구 광교마을로 12',  NULL),
 (5, 4, '경기 수원시 팔달구 효원로 1',       NULL);

-- ---------------------------------------------------------------------
-- 2. 사장님 4명 (newowner는 가게 없음), 가게 3곳, 메뉴 9개
-- ---------------------------------------------------------------------
INSERT INTO owner (owner_id, email, password_hash, name) VALUES
 (1, 'owner@test.com',    @pw, '최사장'),   -- 김밥천국 광교점
 (2, 'owner2@test.com',   @pw, '한사장'),   -- 광교떡볶이
 (3, 'owner3@test.com',   @pw, '윤사장'),   -- 광교치킨
 (4, 'newowner@test.com', @pw, '신사장');   -- 가게 없음

INSERT INTO restaurant (restaurant_id, name, address, business_status, owner_id, delivery_fee) VALUES
 (1, '김밥천국 광교점', '경기 수원시 영통구 광교중앙로 100', '영업종료', 1, 3000),     -- 장면0에서 영업 켜기
 (2, '광교떡볶이',      '경기 수원시 영통구 광교로 30',      '영업중',   2,    0), -- 배달비 무료
 (3, '광교치킨',        '경기 수원시 영통구 법조로 15',      '영업종료', 3, 2500);    -- "준비중" 표시용

INSERT INTO menu (menu_id, restaurant_id, name, price) VALUES
 (1, 1, '참치김밥',     5000),
 (2, 1, '원조김밥',     3500),
 (3, 1, '돈까스김밥',   5500),     -- 장면1 품절 메뉴 (soldout.json에 3 등록)
 (4, 1, '라볶이',       5500),
 (5, 1, '떡볶이',       4500),
 (6, 2, '국물떡볶이',   4000),
 (7, 2, '순대',         4000),
 (8, 2, '모듬튀김',     3000),
 (9, 3, '후라이드치킨', 18000);

-- ---------------------------------------------------------------------
-- 3. 라이더 3명
-- ---------------------------------------------------------------------
INSERT INTO rider (rider_id, name, phone, rider_status, email, password_hash) VALUES
 (1, '김라이더', '010-7000-0001', '운행종료', 'rider@test.com',  @pw),  -- 시연 주인공 (장면0 출근)
 (2, '박라이더', '010-7000-0002', '운행종료', 'rider2@test.com', @pw),  -- 동시 수락 예외용
 (3, '최라이더', '010-7000-0003', '배달중',   'rider3@test.com', @pw);  -- 손님 주문 배달중

-- ---------------------------------------------------------------------
-- 4. 주문 + 주문상세 + 결제 (주문마다 한 트랜잭션)
--    주문금액 = Σ(수량×단가), 결제금액 = 주문금액 + 배달비
-- ---------------------------------------------------------------------

-- [2주 전] 주문1 : 박광교, 김밥천국, 참치김밥2 = 10,000 + 3,000 → 배달완료 (김라이더)
START TRANSACTION;
INSERT INTO orders VALUES (1, 2, 1, TIMESTAMP(@w2 + INTERVAL 1 DAY, '12:10:00'), '조리완료', 3, '경기 수원시 영통구 광교호수로 20 205호', 10000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (1, 1, 2, 5000);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (1, '카드', 13000, '완료');
COMMIT;

-- [2주 전] 주문2 : 이수원, 김밥천국, 원조김밥2 + 떡볶이1 = 11,500 + 3,000 → 배달완료 (김라이더)
START TRANSACTION;
INSERT INTO orders VALUES (2, 3, 1, TIMESTAMP(@w2 + INTERVAL 3 DAY, '18:20:00'), '조리완료', 4, '경기 용인시 수지구 광교마을로 12', 11500, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (2, 2, 2, 3500), (2, 5, 1, 4500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (2, '간편결제', 14500, '완료');
COMMIT;

-- [지난주] 주문3 : 이수원, 김밥천국, 라볶이2 = 11,000 + 3,000 → 배달완료 (김라이더)
START TRANSACTION;
INSERT INTO orders VALUES (3, 3, 1, TIMESTAMP(@w1, '12:30:00'), '조리완료', 4, '경기 용인시 수지구 광교마을로 12', 11000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (3, 4, 2, 5500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (3, '카드', 14000, '완료');
COMMIT;

-- [지난주] 주문4 : 김손님(집), 김밥천국, 참치김밥1 + 라볶이1 = 10,500 + 3,000 → 배달완료 (손님 예시 주문 ①)
START TRANSACTION;
INSERT INTO orders VALUES (4, 1, 1, TIMESTAMP(@w1 + INTERVAL 2 DAY, '19:00:00'), '조리완료', 1, '경기 수원시 영통구 광교중앙로 140 광교아파트 101동 1203호', 10500, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (4, 1, 1, 5000), (4, 4, 1, 5500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (4, '카드', 13500, '완료');
COMMIT;

-- [지난주] 주문5 : 박광교, 김밥천국, 참치김밥3 = 15,000 + 3,000 → 배달완료 (김라이더)
START TRANSACTION;
INSERT INTO orders VALUES (5, 2, 1, TIMESTAMP(@w1 + INTERVAL 5 DAY, '13:00:00'), '조리완료', 3, '경기 수원시 영통구 광교호수로 20 205호', 15000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (5, 1, 3, 5000);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (5, '간편결제', 18000, '완료');
COMMIT;

-- [어제] 주문6 : 김손님(회사), 광교떡볶이, 국물떡볶이2 + 모듬튀김1 = 11,000 + 0 → 거절 → 결제 취소완료 (손님 예시 주문 ②)
START TRANSACTION;
INSERT INTO orders VALUES (6, 1, 2, NOW() - INTERVAL 1 DAY, '거절', 2, '경기 수원시 영통구 대학로 55 광교테크노밸리 3층', 11000, 0);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (6, 6, 2, 4000), (6, 8, 1, 3000);
INSERT INTO payment (order_id, method, amount, payment_status, canceled_at) VALUES (6, '카드', 11000, '취소완료', NOW() - INTERVAL 1 DAY + INTERVAL 3 MINUTE);
COMMIT;

-- [오늘] 주문7 : 박광교, 김밥천국, 원조김밥3 = 10,500 + 3,000 → 조리완료, 라이더 수락 대기 ①
START TRANSACTION;
INSERT INTO orders VALUES (7, 2, 1, NOW() - INTERVAL 40 MINUTE, '조리완료', 3, '경기 수원시 영통구 광교호수로 20 205호', 10500, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (7, 2, 3, 3500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (7, '카드', 13500, '완료');
COMMIT;

-- [오늘] 주문8 : 김손님(집), 김밥천국, 참치김밥1 + 떡볶이1 = 9,500 + 3,000 → 배달중 (최라이더) (손님 예시 주문 ③)
START TRANSACTION;
INSERT INTO orders VALUES (8, 1, 1, NOW() - INTERVAL 35 MINUTE, '조리완료', 1, '경기 수원시 영통구 광교중앙로 140 광교아파트 101동 1203호', 9500, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (8, 1, 1, 5000), (8, 5, 1, 4500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (8, '간편결제', 12500, '완료');
COMMIT;

-- [오늘] 주문9 : 이수원, 김밥천국, 라볶이1 + 원조김밥1 = 9,000 + 3,000 → 조리완료, 라이더 수락 대기 ②
START TRANSACTION;
INSERT INTO orders VALUES (9, 3, 1, NOW() - INTERVAL 25 MINUTE, '조리완료', 4, '경기 용인시 수지구 광교마을로 12', 9000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (9, 4, 1, 5500), (9, 2, 1, 3500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (9, '카드', 12000, '완료');
COMMIT;

-- [오늘] 주문10 : 박광교, 김밥천국, 참치김밥2 = 10,000 + 3,000 → 조리중
START TRANSACTION;
INSERT INTO orders VALUES (10, 2, 1, NOW() - INTERVAL 15 MINUTE, '조리중', 3, '경기 수원시 영통구 광교호수로 20 205호', 10000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (10, 1, 2, 5000);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (10, '카드', 13000, '완료');
COMMIT;

-- [오늘] 주문11 : 이수원, 김밥천국, 떡볶이2 = 9,000 + 3,000 → 접수대기 (장면3 거절 예외용)
START TRANSACTION;
INSERT INTO orders VALUES (11, 3, 1, NOW() - INTERVAL 5 MINUTE, '접수대기', 4, '경기 용인시 수지구 광교마을로 12', 9000, 3000);
INSERT INTO order_item (order_id, menu_id, quantity, unit_price) VALUES (11, 5, 2, 4500);
INSERT INTO payment (order_id, method, amount, payment_status) VALUES (11, '간편결제', 12000, '완료');
COMMIT;

-- ---------------------------------------------------------------------
-- 5. 배달 + 배달상태이력
--    [픽업 완료] 버튼 한 번 = 픽업완료 + 배달중 이력이 같은 시각에 기록
-- ---------------------------------------------------------------------
INSERT INTO delivery (delivery_id, order_id, rider_id, delivery_status) VALUES
 (1, 1, 1, '배달완료'),
 (2, 2, 1, '배달완료'),
 (3, 3, 1, '배달완료'),
 (4, 4, 1, '배달완료'),
 (5, 5, 1, '배달완료'),
 (6, 8, 3, '배달중');      -- 오늘, 손님 주문 배달중

INSERT INTO delivery_history (delivery_id, delivery_status, changed_at) VALUES
 (1, '배정완료', TIMESTAMP(@w2 + INTERVAL 1 DAY, '12:25:00')), (1, '픽업완료', TIMESTAMP(@w2 + INTERVAL 1 DAY, '12:35:00')),
 (1, '배달중',   TIMESTAMP(@w2 + INTERVAL 1 DAY, '12:35:00')), (1, '배달완료', TIMESTAMP(@w2 + INTERVAL 1 DAY, '12:50:00')),
 (2, '배정완료', TIMESTAMP(@w2 + INTERVAL 3 DAY, '18:40:00')), (2, '픽업완료', TIMESTAMP(@w2 + INTERVAL 3 DAY, '18:50:00')),
 (2, '배달중',   TIMESTAMP(@w2 + INTERVAL 3 DAY, '18:50:00')), (2, '배달완료', TIMESTAMP(@w2 + INTERVAL 3 DAY, '19:10:00')),
 (3, '배정완료', TIMESTAMP(@w1, '12:45:00')),                  (3, '픽업완료', TIMESTAMP(@w1, '12:55:00')),
 (3, '배달중',   TIMESTAMP(@w1, '12:55:00')),                  (3, '배달완료', TIMESTAMP(@w1, '13:15:00')),
 (4, '배정완료', TIMESTAMP(@w1 + INTERVAL 2 DAY, '19:20:00')), (4, '픽업완료', TIMESTAMP(@w1 + INTERVAL 2 DAY, '19:30:00')),
 (4, '배달중',   TIMESTAMP(@w1 + INTERVAL 2 DAY, '19:30:00')), (4, '배달완료', TIMESTAMP(@w1 + INTERVAL 2 DAY, '19:50:00')),
 (5, '배정완료', TIMESTAMP(@w1 + INTERVAL 5 DAY, '13:15:00')), (5, '픽업완료', TIMESTAMP(@w1 + INTERVAL 5 DAY, '13:25:00')),
 (5, '배달중',   TIMESTAMP(@w1 + INTERVAL 5 DAY, '13:25:00')), (5, '배달완료', TIMESTAMP(@w1 + INTERVAL 5 DAY, '13:45:00')),
 (6, '배정완료', NOW() - INTERVAL 20 MINUTE),
 (6, '픽업완료', NOW() - INTERVAL 10 MINUTE),
 (6, '배달중',   NOW() - INTERVAL 10 MINUTE);

-- ---------------------------------------------------------------------
-- 6. 정산 2주치 (김밥천국, 김라이더)
--    2주 전 = 지급완료 / 지난주 = 생성완료(화면 표시 "지급 예정")
--    금액은 정산상세 합계로 자동 계산
-- ---------------------------------------------------------------------
INSERT INTO settlement (settlement_id, restaurant_id, rider_id, start_date, end_date, amount, settlement_status) VALUES
 (1, 1,    NULL, @w2, @w2 + INTERVAL 6 DAY, 0, '지급완료'),
 (2, NULL, 1,    @w2, @w2 + INTERVAL 6 DAY, 0, '지급완료'),
 (3, 1,    NULL, @w1, @w1 + INTERVAL 6 DAY, 0, '생성완료'),
 (4, NULL, 1,    @w1, @w1 + INTERVAL 6 DAY, 0, '생성완료');

INSERT INTO settlement_item (settlement_id, order_id, pay_target, pay_amount) VALUES
 (1, 1, '음식점', 10000), (1, 2, '음식점', 11500),
 (2, 1, '라이더',  3000), (2, 2, '라이더',  3000),
 (3, 3, '음식점', 11000), (3, 4, '음식점', 10500), (3, 5, '음식점', 15000),
 (4, 3, '라이더',  3000), (4, 4, '라이더',  3000), (4, 5, '라이더',  3000);

UPDATE settlement s
SET s.amount = (SELECT SUM(si.pay_amount) FROM settlement_item si WHERE si.settlement_id = s.settlement_id);

-- ---------------------------------------------------------------------
-- 7. 확인용 조회
-- ---------------------------------------------------------------------
-- 주문별 상태 (손님 화면 5단계 타임라인 기준 포함)
SELECT o.order_id AS 주문, LPAD(o.order_id, 4, '0') AS 주문번호, c.name AS 손님, r.name AS 가게,
       o.order_status AS 주문상태, p.payment_status AS 결제상태, d.delivery_status AS 배달상태,
       o.total_amount AS 주문금액, o.delivery_fee AS 배달비, p.amount AS 결제금액, o.ordered_time AS 주문시각
FROM orders o
JOIN customer c   ON c.customer_id = o.customer_id
JOIN restaurant r ON r.restaurant_id = o.restaurant_id
JOIN payment p    ON p.order_id = o.order_id
LEFT JOIN delivery d ON d.order_id = o.order_id
ORDER BY o.order_id;

-- 라이더가 수락 가능한 주문 (조리완료 + 배달 없음) → 2건이어야 함
SELECT o.order_id AS 주문, r.name AS 픽업지, o.order_address AS 배달지, o.delivery_fee AS 배달비
FROM orders o
JOIN restaurant r ON r.restaurant_id = o.restaurant_id
LEFT JOIN delivery d ON d.order_id = o.order_id
WHERE o.order_status = '조리완료' AND d.delivery_id IS NULL;

-- 정산 (정산금액 = 상세 합계)
SELECT s.settlement_id AS 정산, COALESCE(r.name, rd.name) AS 대상, s.start_date AS 시작, s.end_date AS 종료,
       s.amount AS 정산금액, SUM(si.pay_amount) AS 상세합계, s.settlement_status AS 상태
FROM settlement s
LEFT JOIN restaurant r ON r.restaurant_id = s.restaurant_id
LEFT JOIN rider rd     ON rd.rider_id = s.rider_id
JOIN settlement_item si ON si.settlement_id = s.settlement_id
GROUP BY s.settlement_id, r.name, rd.name, s.start_date, s.end_date, s.amount, s.settlement_status;
