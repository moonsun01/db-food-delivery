# 배달앱 백엔드 실행 안내

Node.js와 Express로 API 명세서 v0.5의 36개 API를 구현했습니다. JSON·MySQL 저장을 지원하며, 결제와 정산 지급은 개발용 모의 처리입니다. 팀 DB의 13개 업무 테이블 구조와 상태값을 사용합니다.

## 1. 처음 실행

Node.js 24 이상과 npm이 필요합니다. Windows PowerShell에서 저장소의 `backend` 폴더로 이동합니다.

```powershell
cd backend
npm.cmd ci
npm.cmd run dev:setup
npm.cmd start
```

`dev:setup`은 `.env.example`을 바탕으로 개인 `.env`와 운영용 API 키를 만듭니다. 기존 설정과 키가 있으면 유지합니다. `.env`에는 실제 비밀번호가 들어가므로 Git에 올리지 않습니다.

- 서버 확인: http://localhost:4000/api/health → `{"status":"ok"}`
- 음식점 목록: http://localhost:4000/api/stores
- JSON 샘플 메뉴: http://localhost:4000/api/stores/10/menus
- 종료: 실행한 터미널에서 Ctrl+C

첫 실행은 `STORAGE_MODE=json`입니다. DB 설치 없이 API를 확인할 수 있으며 데이터는 무시되는 `storage/`에 저장됩니다. JSON 샘플 계정은 로그인용이 아니므로 회원가입 API로 고객·점주·라이더를 만들거나 아래 데모를 사용합니다.

## 2. 실제 MySQL 연결

MySQL 8.0.16 이상에서 팀 `db` 브랜치의 `schema.sql`, `data.sql`로 준비한 DB를 사용합니다. SQL 실행은 DB 담당자와 맞춥니다. 원본 schema.sql에는 기존 DB 삭제 문장이 있으므로 데이터가 들어 있는 DB에 그대로 재실행하지 않습니다.

`.env`에서 다음 값을 수정합니다. 아래 접속 계정·비밀번호는 DB 담당자에게 받은 값으로 입력합니다.

```dotenv
STORAGE_MODE=mysql
SEED_SAMPLE_DATA=false
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=본인_DB_계정
DB_PASSWORD="본인_DB_비밀번호"
DB_NAME=delivery_app
DB_RUNTIME_NAME=delivery_app_runtime
```

13개 업무 테이블은 그대로 사용합니다. 로그인 세션과 중복 요청 방지 기록을 보존하려고 별도의 보조 DB가 필요합니다. DB 관리 계정에서 다음을 한 번 실행합니다.

```sql
CREATE DATABASE IF NOT EXISTS delivery_app_runtime
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

API 접속 계정에 필요한 권한은 업무 DB의 SELECT·INSERT·UPDATE·DELETE, 보조 DB의 SELECT·INSERT·UPDATE·DELETE·CREATE입니다. 권한은 DB 담당자가 설정합니다. 보조 DB의 `api_state` 테이블은 API가 처음 시작할 때 생성합니다. 업무 ERD에 테이블이나 컬럼을 추가하지 않습니다.

```powershell
npm.cmd run db:check
npm.cmd start
```

설정을 수정한 뒤에는 서버를 다시 시작합니다. MySQL 모드에서는 팀 시연 SQL의 계정과 음식점·메뉴 ID를 사용합니다. 팀 SQL 기준 고객 `customer@test.com`, 점주 `owner@test.com`, 라이더 `rider@test.com`의 시연 비밀번호는 `test1234`입니다. 가게 1번은 처음에 영업종료이므로 해당 점주가 영업중으로 바꿔야 주문할 수 있습니다.

## 3. 프론트 연결

같은 컴퓨터에서 프론트는 3000번, 백엔드는 4000번으로 실행합니다. 프론트의 API 기본 주소를 `http://localhost:4000`으로 설정하고 임시 응답(MSW)을 끕니다. 프론트 개발 주소가 달라지면 `.env`의 `FRONTEND_ORIGINS`도 수정하고 백엔드를 재시작합니다.

- 경로: `/api/stores`, `/api/stores/{storeId}/menus`, `/api/orders` 등.
- ID·수량·금액은 JSON 숫자이고 필드는 camelCase입니다.
- 요청 본문: `Content-Type: application/json`.
- 인증: 로그인에서 받은 token을 `Authorization: Bearer <token>`으로 전달합니다. 쿠키 인증을 사용하지 않습니다.
- 오류 응답: `{"message":"오류 내용"}`.
- 단건은 객체, 목록은 배열, 빈 목록은 `[]`, 삭제·로그아웃 204는 본문이 없습니다.
- 프론트가 snake_case를 쓰면 API 연결 파일에서 변환합니다. 실제 DB의 컬럼명을 API 요청에 그대로 보내지 않습니다.

상세 요청·응답은 [API 명세](docs/api.md)를 참고합니다. 현재 서버는 로컬 연결용 127.0.0.1에서 실행됩니다.

## 4. 구현한 규칙

- 주문·주문상세·결제를 한 트랜잭션으로 저장하며 저장 오류가 나면 모두 롤백합니다. 결제 실패 결과를 기록하는 것은 저장 오류와 구별합니다.
- 주문금액은 메뉴 합계, 결제금액은 메뉴 합계+배달비입니다. 주소·단가·배달비는 주문 순간 값으로 보존합니다.
- 고객 직접 취소와 실패 주문 재결제는 없습니다. 실패하면 새로 주문합니다. 점주가 접수대기 주문을 거절하면 같은 결제를 취소완료로 바꾸고 취소일자를 남깁니다.
- 점주 주문 목록에는 결제완료 주문과 거절·결제취소 주문을 포함합니다. 결제실패 주문은 접수 목록에서 제외합니다.
- 운행가능 라이더가 조리완료 주문을 선착순 수락합니다. 배달 1건과 배정완료 이력이 생기며 라이더는 배달중이 됩니다.
- 배정완료 → 픽업완료 → 배달중 → 배달완료 순서로만 진행합니다. 완료 후 라이더는 운행가능이 되며 주문상태는 조리완료를 유지합니다.
- 배달완료 시각을 기준으로 월~일 주간 정산을 만듭니다. 음식점 몫은 메뉴 합계, 라이더 몫은 주문 배달비이며 수수료는 없습니다.
- 정산 하나는 음식점 또는 라이더 하나만 대상으로 합니다. 정산상세의 `payTarget`은 지급대상구분(음식점/라이더)이며 FK가 아닙니다. 같은 주문의 같은 몫은 중복 정산하지 않습니다.
- MySQL 모드에서는 실제 SQL 트랜잭션과 행 잠금으로 동시에 들어온 주문·라이더 수락·정산을 처리합니다. 작은 팀 시연용으로 트랜잭션 안에서 업무 데이터를 읽고 변경된 행을 반영하는 방식입니다.

## 5. 결제·사진·품절 범위

외부 토스·카드 승인과 실제 송금은 연결하지 않았습니다. 결제수단은 카드/간편결제 구분만 저장하며 정상 모드에서는 성공으로 모의 처리합니다. 결제 실패 확인은 `.env`의 `MOCK_PAYMENT_RESULT=failure`로 바꾸고 재시작합니다. 실패 주문은 주문상태=결제실패, 결제상태=실패로 저장됩니다. 확인 후 success로 되돌립니다.

사진·품절 필드는 최종 DB와 현재 API에 없습니다. 사진 업로드나 품절 기능을 구현했다고 안내하지 않습니다. 리뷰·쿠폰·메뉴옵션도 범위에서 제외합니다.

## 6. 정산 운영 API

서버가 켜진 매주 월요일(한국 시간)에 지난주 월~일 배달완료 주문을 정산합니다. 서버가 월요일 내내 꺼져 있었다면 누락 주를 아래 API로 생성할 수 있습니다.

| 요청 | 본문 | 결과 |
| --- | --- | --- |
| POST /internal/settlements/generate | `{ "startDate": "2026-11-16" }` | 종료된 월~일 정산 생성. 날짜 생략 시 지난주 |
| POST /internal/settlements/{settlementId}/pay | `{}` | 개발용 지급완료 상태 기록 |

두 요청은 `.env`의 OPERATIONS_API_KEY를 `X-Operations-Key` 헤더로 보내야 합니다. 이 키는 프론트에 전달하지 않습니다. 실제 돈을 송금하지 않습니다.

## 7. 테스트

```powershell
npm.cmd test
```

기본 검사는 14건입니다. 메모리·임시 JSON·임시 HTTP 포트를 사용하여 36개 API 정상 경로, 권한, 중복 가입, 금액·스냅샷, 저장 롤백, 라이더 선착순 수락, 주간 정산과 재시작 보존을 검사합니다. MySQL 통합 검사는 기본 실행에서 건너뜁니다.

실행 중인 로컬 서버에 새 시연용 계정과 가게를 만들어 주문→배달완료를 확인하려면 다른 터미널에서 `npm.cmd run demo`를 실행합니다. 데모 데이터는 서버에 남습니다.

실제 MySQL 통합 검사는 **팀 시연 SQL을 넣은 별도 `_test` 이름의 DB**와 별도 보조 DB에서만 실행합니다. 예: `delivery_backend_test`와 `delivery_backend_test_runtime`. `.env`의 두 DB 이름과 접속 정보가 해당 테스트 DB를 가리키는지 확인합니다. 일반 업무 DB 이름이면 테스트가 시작 전에 중단됩니다.

```powershell
$env:RUN_MYSQL_TESTS = '1'
node.exe --test test/mysql.test.js
Remove-Item Env:RUN_MYSQL_TESTS
```

MySQL 검사는 임시 테스트 계정·가게를 만들고 주문·결제실패·거절·FK 오류 롤백·다중 서버 중복 요청·라이더 경합·정산·재연결을 확인합니다. 종료 시 해당 테스트 계정의 데이터만 정리합니다. 사전 스냅샷은 Git에서 제외된 저장소 루트 `.local/`에 기록합니다.

## 파일 구성

`routes/`: API 경로와 권한, `services/`: 주문·정산 규칙, `lib/mysql-storage.js`: 팀 SQL 연결과 트랜잭션, `lib/storage.js`: JSON·메모리 저장, `docs/`: 명세·DB 대응, `test/`: 자동 검사입니다. `.env.example`은 빈 설정 양식이며 실제 `.env`, node_modules, storage, .local은 커밋에서 제외합니다.
