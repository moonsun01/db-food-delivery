-- =====================================================================
--  배달앱 플랫폼 DB 스키마 (schema.sql)
--  기준 : 테이블 정의서 최종본 (3조)
--  DBMS : MySQL 8.0.16 이상 (CHECK 제약 동작), strict 모드(기본값)
--  실행 : 이 파일 전체를 한 번에 실행하면 DB와 테이블 13개가 만들어짐
--         다시 실행하면 기존 DB를 지우고 처음부터 새로 만듦 (주의)
-- =====================================================================

DROP DATABASE IF EXISTS delivery_app;
CREATE DATABASE delivery_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE delivery_app;

-- ---------------------------------------------------------------------
-- 1. 고객·주문 모듈 (1) : 고객, 배송지
-- ---------------------------------------------------------------------

-- 고객 : 서비스에 가입한 고객의 계정 정보
CREATE TABLE customer (
    customer_id    INT          NOT NULL AUTO_INCREMENT COMMENT '고객ID',
    name           VARCHAR(30)  NOT NULL COMMENT '고객이름',
    email          VARCHAR(100) NOT NULL COMMENT '고객이메일 (로그인 아이디)',
    phone          VARCHAR(20)  NOT NULL COMMENT '고객전화번호',
    password_hash  VARCHAR(255) NOT NULL COMMENT '고객비밀번호해시',
    PRIMARY KEY (customer_id),
    UNIQUE KEY uq_customer_email (email)                 -- 대체키 : 이메일 중복 불가
) COMMENT '고객';

-- 배송지 : 고객이 등록한 배송 주소 (고객 1 : N 배송지)
CREATE TABLE address (
    address_id     INT          NOT NULL AUTO_INCREMENT COMMENT '배송지ID',
    customer_id    INT          NOT NULL COMMENT '고객ID',
    address        VARCHAR(200) NOT NULL COMMENT '배송주소',
    address_detail VARCHAR(100) NULL     COMMENT '상세주소 (없을 수 있음)',
    PRIMARY KEY (address_id),
    CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
) COMMENT '배송지';

-- ---------------------------------------------------------------------
-- 2. 음식점·메뉴 모듈 : 점주계정, 음식점, 메뉴
-- ---------------------------------------------------------------------

-- 점주계정 : 점주의 로그인 계정
CREATE TABLE owner (
    owner_id       INT          NOT NULL AUTO_INCREMENT COMMENT '점주계정ID',
    email          VARCHAR(100) NOT NULL COMMENT '점주이메일 (로그인 아이디)',
    password_hash  VARCHAR(255) NOT NULL COMMENT '점주비밀번호해시',
    name           VARCHAR(30)  NOT NULL COMMENT '점주이름',
    PRIMARY KEY (owner_id),
    UNIQUE KEY uq_owner_email (email)                    -- 대체키 : 이메일 중복 불가
) COMMENT '점주계정';

-- 음식점 : 점주계정 1 : 음식점 0..1
CREATE TABLE restaurant (
    restaurant_id   INT          NOT NULL AUTO_INCREMENT COMMENT '음식점ID',
    name            VARCHAR(50)  NOT NULL COMMENT '상호명',
    address         VARCHAR(200) NOT NULL COMMENT '음식점주소 (픽업 위치)',
    business_status ENUM('영업중','영업종료') NOT NULL DEFAULT '영업종료' COMMENT '영업상태 (영업중일 때만 주문 가능)',
    owner_id        INT          NOT NULL COMMENT '점주계정ID',
    delivery_fee    INT          NOT NULL DEFAULT 0 COMMENT '배달비 (음식점별 고정)',
    PRIMARY KEY (restaurant_id),
    UNIQUE KEY uq_restaurant_owner (owner_id),           -- 대체키 : 점주 1명당 가게 1개 (1:1)
    CONSTRAINT fk_restaurant_owner FOREIGN KEY (owner_id) REFERENCES owner (owner_id),
    CONSTRAINT ck_restaurant_fee CHECK (delivery_fee >= 0)
) COMMENT '음식점';

-- 메뉴 : 음식점 1 : N 메뉴
CREATE TABLE menu (
    menu_id        INT          NOT NULL AUTO_INCREMENT COMMENT '메뉴ID',
    restaurant_id  INT          NOT NULL COMMENT '음식점ID',
    name           VARCHAR(50)  NOT NULL COMMENT '메뉴명',
    price          INT          NOT NULL COMMENT '메뉴가격 (현재 가격)',
    PRIMARY KEY (menu_id),
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
    CONSTRAINT ck_menu_price CHECK (price >= 0)
) COMMENT '메뉴';

-- ---------------------------------------------------------------------
-- 3. 라이더 (배달 모듈 중 먼저 필요한 테이블)
-- ---------------------------------------------------------------------

CREATE TABLE rider (
    rider_id       INT          NOT NULL AUTO_INCREMENT COMMENT '라이더ID',
    name           VARCHAR(30)  NOT NULL COMMENT '라이더이름',
    phone          VARCHAR(20)  NOT NULL COMMENT '라이더전화번호',
    rider_status   ENUM('운행가능','배달중','운행종료') NOT NULL DEFAULT '운행종료' COMMENT '운행상태 (운행가능일 때만 수락)',
    email          VARCHAR(100) NOT NULL COMMENT '라이더이메일 (로그인 아이디)',
    password_hash  VARCHAR(255) NOT NULL COMMENT '라이더비밀번호해시',
    PRIMARY KEY (rider_id),
    UNIQUE KEY uq_rider_email (email)                    -- 대체키 : 이메일 중복 불가
) COMMENT '라이더';

-- ---------------------------------------------------------------------
-- 4. 고객·주문 모듈 (2) : 주문, 주문상세
-- ---------------------------------------------------------------------

-- 주문 : ORDER는 SQL 예약어라서 orders 사용
CREATE TABLE orders (
    order_id       INT          NOT NULL AUTO_INCREMENT COMMENT '주문ID',
    customer_id    INT          NOT NULL COMMENT '고객ID',
    restaurant_id  INT          NOT NULL COMMENT '음식점ID (한 주문 = 한 음식점)',
    ordered_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '주문일시',
    order_status   ENUM('결제실패','접수대기','조리중','조리완료','거절') NOT NULL COMMENT '주문상태',
    address_id     INT          NOT NULL COMMENT '배송지ID',
    order_address  VARCHAR(300) NOT NULL COMMENT '주문시주소 (주문 시점 주소 복사본)',
    total_amount   INT          NOT NULL COMMENT '주문금액 (메뉴 합계, 배달비 제외)',
    delivery_fee   INT          NOT NULL COMMENT '배달비 (주문 시점 음식점 배달비 복사본)',
    PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_customer   FOREIGN KEY (customer_id)   REFERENCES customer (customer_id),
    CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
    CONSTRAINT fk_orders_address    FOREIGN KEY (address_id)    REFERENCES address (address_id),
    CONSTRAINT ck_orders_amount CHECK (total_amount >= 0 AND delivery_fee >= 0)
) COMMENT '주문';

-- 주문상세 : 주문과 메뉴의 M:N 관계 해소, 주문 1건에 1줄 이상
CREATE TABLE order_item (
    order_item_id  INT          NOT NULL AUTO_INCREMENT COMMENT '주문상세ID',
    order_id       INT          NOT NULL COMMENT '주문ID',
    menu_id        INT          NOT NULL COMMENT '메뉴ID',
    quantity       INT          NOT NULL COMMENT '수량',
    unit_price     INT          NOT NULL COMMENT '주문시단가 (주문 시점 가격 복사본)',
    PRIMARY KEY (order_item_id),
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT fk_item_menu  FOREIGN KEY (menu_id)  REFERENCES menu (menu_id),
    CONSTRAINT ck_item_qty   CHECK (quantity >= 1),
    CONSTRAINT ck_item_price CHECK (unit_price >= 0)
) COMMENT '주문상세';

-- ---------------------------------------------------------------------
-- 5. 라이더·배달 모듈 : 배달, 배달상태이력
-- ---------------------------------------------------------------------

-- 배달 : 주문 1 : 배달 0..1 (재배정 없음, 선착순)
CREATE TABLE delivery (
    delivery_id     INT NOT NULL AUTO_INCREMENT COMMENT '배달ID',
    order_id        INT NOT NULL COMMENT '주문ID',
    rider_id        INT NOT NULL COMMENT '라이더ID',
    delivery_status ENUM('배정완료','픽업완료','배달중','배달완료') NOT NULL DEFAULT '배정완료' COMMENT '현재배달상태',
    PRIMARY KEY (delivery_id),
    UNIQUE KEY uq_delivery_order (order_id),             -- 대체키 : 주문 1건당 배달 1건 (선착순 보장)
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT fk_delivery_rider FOREIGN KEY (rider_id) REFERENCES rider (rider_id)
) COMMENT '배달';

-- 배달상태이력 : 배달 1 : 이력 1..N (배정완료부터 기록)
CREATE TABLE delivery_history (
    history_id      INT      NOT NULL AUTO_INCREMENT COMMENT '이력ID',
    delivery_id     INT      NOT NULL COMMENT '배달ID',
    delivery_status ENUM('배정완료','픽업완료','배달중','배달완료') NOT NULL COMMENT '배달상태',
    changed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '변경시각',
    PRIMARY KEY (history_id),
    UNIQUE KEY uq_history_status (delivery_id, delivery_status),   -- 같은 배달에 같은 상태 2번 불가
    CONSTRAINT fk_history_delivery FOREIGN KEY (delivery_id) REFERENCES delivery (delivery_id)
) COMMENT '배달상태이력';

-- ---------------------------------------------------------------------
-- 6. 결제·정산 모듈 : 결제, 정산, 정산상세
-- ---------------------------------------------------------------------

-- 결제 : 주문 1 : 결제 1 (주문과 동시에 생성, 재결제 없음)
CREATE TABLE payment (
    payment_id     INT      NOT NULL AUTO_INCREMENT COMMENT '결제ID',
    order_id       INT      NOT NULL COMMENT '주문ID',
    method         ENUM('카드','간편결제') NOT NULL COMMENT '결제수단',
    amount         INT      NOT NULL COMMENT '결제금액 = 주문금액 + 배달비',
    payment_status ENUM('완료','실패','취소완료') NOT NULL COMMENT '결제상태',
    canceled_at    DATETIME NULL COMMENT '취소일자 (취소완료일 때만)',
    PRIMARY KEY (payment_id),
    UNIQUE KEY uq_payment_order (order_id),              -- 대체키 : 주문 1건당 결제 1건
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
    CONSTRAINT ck_payment_amount CHECK (amount >= 0),
    CONSTRAINT ck_payment_cancel CHECK ((payment_status = '취소완료') = (canceled_at IS NOT NULL))
) COMMENT '결제';

-- 정산 : 음식점 또는 라이더에게 주간(월~일) 지급할 금액 요약
CREATE TABLE settlement (
    settlement_id     INT  NOT NULL AUTO_INCREMENT COMMENT '정산ID',
    restaurant_id     INT  NULL COMMENT '음식점ID (음식점 정산일 때만)',
    rider_id          INT  NULL COMMENT '라이더ID (라이더 정산일 때만)',
    start_date        DATE NOT NULL COMMENT '정산시작일 (월요일)',
    end_date          DATE NOT NULL COMMENT '정산종료일 (일요일)',
    amount            INT  NOT NULL COMMENT '정산금액 = 정산상세 지급금액 합계',
    settlement_status ENUM('생성완료','지급완료') NOT NULL DEFAULT '생성완료' COMMENT '정산상태',
    PRIMARY KEY (settlement_id),
    UNIQUE KEY uq_settle_restaurant_week (restaurant_id, start_date),  -- 같은 음식점 같은 주 1번
    UNIQUE KEY uq_settle_rider_week (rider_id, start_date),            -- 같은 라이더 같은 주 1번
    CONSTRAINT fk_settle_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
    CONSTRAINT fk_settle_rider      FOREIGN KEY (rider_id)      REFERENCES rider (rider_id),
    CONSTRAINT ck_settle_target CHECK ((restaurant_id IS NULL) <> (rider_id IS NULL)),  -- 둘 중 하나만
    CONSTRAINT ck_settle_period CHECK (start_date <= end_date),
    CONSTRAINT ck_settle_amount CHECK (amount >= 0)
) COMMENT '정산';

-- 정산상세 : 정산 1 : 정산상세 1..N, 주문 1건 → 음식점 몫 + 라이더 몫
CREATE TABLE settlement_item (
    settlement_item_id INT NOT NULL AUTO_INCREMENT COMMENT '정산상세ID',
    settlement_id      INT NOT NULL COMMENT '정산ID',
    order_id           INT NOT NULL COMMENT '주문ID (지급 근거)',
    pay_target         ENUM('음식점','라이더') NOT NULL COMMENT '지급대상구분 (FK 아님)',
    pay_amount         INT NOT NULL COMMENT '지급금액 (음식점=주문금액, 라이더=배달비)',
    PRIMARY KEY (settlement_item_id),
    UNIQUE KEY uq_item_order_target (order_id, pay_target),  -- 같은 주문의 같은 몫 2번 불가
    CONSTRAINT fk_sitem_settlement FOREIGN KEY (settlement_id) REFERENCES settlement (settlement_id),
    CONSTRAINT fk_sitem_order      FOREIGN KEY (order_id)      REFERENCES orders (order_id),
    CONSTRAINT ck_sitem_amount CHECK (pay_amount >= 0)
) COMMENT '정산상세';

-- 확인 : 테이블 13개가 보이면 성공
SHOW TABLES;
