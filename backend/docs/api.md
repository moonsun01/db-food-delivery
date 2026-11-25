<!-- 3조 배달앱 | v0.5 | 2026.11.19 | 최종 테이블 정의서 기준 API 협의 초안 -->

# 1. 회원 API

이 로컬 통합본의 API 주소는 http://localhost:4000이다. 주소의 {id} 자리에는 해당 숫자 ID를 넣는다. 실제 공동 연동 주소는 별도로 공유한다.

요청과 응답은 application/json이다. 필드는 camelCase, ID·금액·수량은 숫자다. 단건은 객체, 목록은 배열이며 빈 목록은 []다. 금액은 0~2,147,483,647원의 정수이며, 일시는 시간대를 포함한 ISO 형식이다. 예시 이름·금액·ID·시각은 설명용이다.

오류 응답은 아래 형식이다. 로그인 필요·만료는 401, 역할·소유 권한 오류는 403, 서버 처리 오류는 500이다. 추가 오류는 각 API에 표시한다.

```json
{
  "message": "요청을 처리할 수 없습니다."
}
```

## API 01 회원가입

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/auth/register |
| 권한 | 공개 |
| 요청 헤더 | Content-Type: application/json |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| role (Body) | string | 필수 | CUSTOMER / OWNER / RIDER |
| email (Body) | string | 필수 | 로그인 이메일. 100자 이내 |
| password (Body) | string | 필수 | 비밀번호. 8자 이상으로 제안 |
| name (Body) | string | 필수 | 이름. 1~30자 |
| phone (Body) | string | 조건부 | 고객·라이더 필수, 점주 생략. 1~20자 |

### 요청 본문 예시

```json
{
  "role": "CUSTOMER",
  "email": "customer@example.test",
  "password": "Example-password!",
  "name": "테스트 고객",
  "phone": "010-0000-0000"
}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "role": "CUSTOMER",
  "name": "테스트 고객",
  "email": "customer@example.test",
  "phone": "010-0000-0000"
}
```

고객·점주·라이더는 각 역할의 계정으로 가입한다. 점주 응답은 phone을 생략하고, 라이더 응답은 status를 추가하며 최초 값은 운행종료다. 비밀번호와 해시값은 응답에 포함하지 않는다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 입력값 오류 | 가입 정보를 확인해 주세요. |
| 409 | 같은 역할의 이메일 중복 | 이미 가입된 이메일입니다. |

## API 02 로그인

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/auth/login |
| 권한 | 공개 |
| 요청 헤더 | Content-Type: application/json |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| role (Body) | string | 필수 | CUSTOMER / OWNER / RIDER |
| email (Body) | string | 필수 | 가입한 이메일 |
| password (Body) | string | 필수 | 비밀번호 |

### 요청 본문 예시

```json
{
  "role": "CUSTOMER",
  "email": "customer@example.test",
  "password": "Example-password!"
}
```

### 응답 본문 예시

```json
{
  "token": "로그인으로_발급한_토큰",
  "tokenType": "Bearer",
  "expiresAt": "2026-11-15T23:00:00+09:00",
  "user": {
    "id": 1,
    "role": "CUSTOMER",
    "name": "테스트 고객",
    "email": "customer@example.test",
    "phone": "010-0000-0000"
  }
}
```

보호된 API는 응답 token을 Bearer 인증에 사용한다. user는 로그인한 역할의 계정이다. 계정은 role과 id를 함께 사용해 식별한다. expiresAt은 토큰 만료 시각이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 401 | 계정·비밀번호 불일치 | 이메일 또는 비밀번호를 확인해 주세요. |

## API 03 로그아웃

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/auth/logout |
| 권한 | 로그인 사용자 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 204 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

HTTP 204. 응답 본문 없음.

현재 로그인 토큰을 종료한다. HTTP 204 응답은 본문이 없다.

## API 04 내 정보 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/me |
| 권한 | 로그인 사용자 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 1,
  "role": "CUSTOMER",
  "name": "테스트 고객",
  "email": "customer@example.test",
  "phone": "010-0000-0000"
}
```

토큰으로 본인을 식별한다. 고객은 예시와 같고 점주는 phone을 생략하며, 라이더는 운행상태 status를 추가한다.

## API 05 내 정보 수정

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/me |
| 권한 | 로그인 사용자 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name (Body) | string | 선택 | 변경할 이름. 1~30자 |
| phone (Body) | string | 선택 | 고객·라이더의 연락처. 1~20자 |

### 요청 본문 예시

```json
{
  "name": "수정 고객"
}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "role": "CUSTOMER",
  "name": "수정 고객",
  "email": "customer@example.test",
  "phone": "010-0000-0000"
}
```

변경값을 한 개 이상 보낸다. 점주는 name을 수정한다. 생략한 필드는 유지한다. role과 email은 이 API의 수정 항목에서 제외한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 수정값 없음·형식 오류 | 수정할 회원정보를 확인해 주세요. |


<!-- pagebreak -->

# 2. 배송지 API

## API 06 배송지 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/addresses |
| 권한 | 고객 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 1,
    "customerId": 1,
    "address": "서울시 성북구 예시로 1",
    "detailAddress": "101호"
  }
]
```

로그인 고객의 배송지만 반환한다. 등록된 배송지가 없으면 []를 반환한다. id는 주소 선택·수정·삭제에 사용한다.

## API 07 배송지 등록

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/addresses |
| 권한 | 고객 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| address (Body) | string | 필수 | 배송주소. 1~200자 |
| detailAddress (Body) | string 또는 null | 선택 | 상세주소. 100자 이내, 생략하면 null |

### 요청 본문 예시

```json
{
  "address": "서울시 성북구 예시로 1",
  "detailAddress": "101호"
}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "customerId": 1,
  "address": "서울시 성북구 예시로 1",
  "detailAddress": "101호"
}
```

customerId는 토큰에서 결정한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 주소 형식·길이 오류 | 배송주소를 확인해 주세요. |

## API 08 배송지 상세 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/addresses/{addressId} |
| 권한 | 해당 고객 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| addressId (Path) | integer | 필수 | 배송지ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 1,
  "customerId": 1,
  "address": "서울시 성북구 예시로 1",
  "detailAddress": "101호"
}
```

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 배송지 없음 | 배송지를 찾을 수 없습니다. |

## API 09 배송지 수정

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/addresses/{addressId} |
| 권한 | 해당 고객 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| addressId (Path) | integer | 필수 | 배송지ID. 양의 정수 |
| address (Body) | string | 선택 | 변경할 주소. 1~200자 |
| detailAddress (Body) | string 또는 null | 선택 | 상세주소. 100자 이내, null로 비울 수 있음 |

### 요청 본문 예시

```json
{
  "detailAddress": "202호"
}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "customerId": 1,
  "address": "서울시 성북구 예시로 1",
  "detailAddress": "202호"
}
```

변경값을 한 개 이상 보낸다. 수정해도 기존 주문의 addressSnapshot은 주문 당시 주소를 유지한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 수정값 오류 | 수정할 배송지를 확인해 주세요. |
| 404 | 배송지 없음 | 배송지를 찾을 수 없습니다. |

## API 10 배송지 삭제

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | DELETE /api/addresses/{addressId} |
| 권한 | 해당 고객 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 204 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| addressId (Path) | integer | 필수 | 배송지ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

HTTP 204. 응답 본문 없음.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 배송지 없음 | 배송지를 찾을 수 없습니다. |
| 409 | 주문이 참조하는 배송지 | 주문에 사용된 배송지는 삭제할 수 없습니다. |


<!-- pagebreak -->

# 3. 음식점 API

## API 11 음식점 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/stores |
| 권한 | 공개 |
| 요청 헤더 | 추가 헤더 없음 |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| q (Query) | string | 선택 | 상호명 검색어 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 10,
    "ownerId": 1,
    "name": "예시 중국집",
    "address": "서울시 성북구 예시로 10",
    "status": "영업중",
    "deliveryFee": 3000
  }
]
```

가게 id 오름차순으로 반환한다. 검색 결과가 없으면 []다. 주문 가능 여부는 status로 표시한다.

## API 12 음식점 상세 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/stores/{storeId} |
| 권한 | 공개 |
| 요청 헤더 | 추가 헤더 없음 |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Path) | integer | 필수 | 음식점ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 10,
  "ownerId": 1,
  "name": "예시 중국집",
  "address": "서울시 성북구 예시로 10",
  "status": "영업중",
  "deliveryFee": 3000
}
```

storeId는 최종 정의서의 restaurant_id다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 음식점 없음 | 음식점을 찾을 수 없습니다. |

## API 13 점주 내 음식점 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/me/stores |
| 권한 | 점주 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 10,
    "ownerId": 1,
    "name": "예시 중국집",
    "address": "서울시 성북구 예시로 10",
    "status": "영업중",
    "deliveryFee": 3000
  }
]
```

본인 음식점만 배열로 반환한다. 점주 한 계정당 0~1개이며 가게 등록 전에는 []다.

## API 14 음식점 등록

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/stores |
| 권한 | 점주 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name (Body) | string | 필수 | 상호명. 1~50자 |
| address (Body) | string | 필수 | 음식점 주소. 1~200자 |
| status (Body) | string | 선택 | 영업중 / 영업종료. 기본 영업종료 |
| deliveryFee (Body) | integer | 선택 | 배달비. 0원 이상, 기본 0 |

### 요청 본문 예시

```json
{
  "name": "예시 중국집",
  "address": "서울시 성북구 예시로 10",
  "status": "영업중",
  "deliveryFee": 3000
}
```

### 응답 본문 예시

```json
{
  "id": 10,
  "ownerId": 1,
  "name": "예시 중국집",
  "address": "서울시 성북구 예시로 10",
  "status": "영업중",
  "deliveryFee": 3000
}
```

ownerId는 로그인 점주로 정한다. 음식점별 배달비는 한 개이며 주문 시 복사된다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 등록값 오류 | 음식점 정보를 확인해 주세요. |
| 409 | 본인 음식점이 이미 있음 | 이미 등록한 음식점이 있습니다. |

## API 15 음식점 수정과 영업상태 변경

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/stores/{storeId} |
| 권한 | 해당 점주 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Path) | integer | 필수 | 음식점ID. 양의 정수 |
| name (Body) | string | 선택 | 상호명. 1~50자 |
| address (Body) | string | 선택 | 음식점 주소. 1~200자 |
| status (Body) | string | 선택 | 영업중 / 영업종료 |
| deliveryFee (Body) | integer | 선택 | 변경할 배달비. 0원 이상 |

### 요청 본문 예시

```json
{
  "status": "영업종료"
}
```

### 응답 본문 예시

```json
{
  "id": 10,
  "ownerId": 1,
  "name": "예시 중국집",
  "address": "서울시 성북구 예시로 10",
  "status": "영업종료",
  "deliveryFee": 3000
}
```

변경값을 한 개 이상 보낸다. 기존 주문에는 복사해 둔 배달비를 사용한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 수정값 오류 | 수정할 음식점 정보를 확인해 주세요. |
| 404 | 음식점 없음 | 음식점을 찾을 수 없습니다. |


<!-- pagebreak -->

# 4. 메뉴 API

## API 16 음식점 메뉴 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/stores/{storeId}/menus |
| 권한 | 공개 |
| 요청 헤더 | 추가 헤더 없음 |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Path) | integer | 필수 | 음식점ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 101,
    "storeId": 10,
    "name": "짜장면·탕수육 세트",
    "price": 27000
  }
]
```

메뉴 id 오름차순이며, 메뉴가 없으면 []다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 음식점 없음 | 음식점을 찾을 수 없습니다. |

## API 17 메뉴 등록

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/stores/{storeId}/menus |
| 권한 | 해당 점주 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Path) | integer | 필수 | 음식점ID. 양의 정수 |
| name (Body) | string | 필수 | 메뉴명. 1~50자 |
| price (Body) | integer | 필수 | 메뉴가격. 0원 이상 |

### 요청 본문 예시

```json
{
  "name": "짜장면·탕수육 세트",
  "price": 27000
}
```

### 응답 본문 예시

```json
{
  "id": 101,
  "storeId": 10,
  "name": "짜장면·탕수육 세트",
  "price": 27000
}
```

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 입력값 오류 | 메뉴명과 가격을 확인해 주세요. |
| 404 | 음식점 없음 | 음식점을 찾을 수 없습니다. |

## API 18 메뉴 수정

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/stores/{storeId}/menus/{menuId} |
| 권한 | 해당 점주 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Path) | integer | 필수 | 음식점ID. 양의 정수 |
| menuId (Path) | integer | 필수 | 메뉴ID. 양의 정수 |
| name (Body) | string | 선택 | 메뉴명. 1~50자 |
| price (Body) | integer | 선택 | 메뉴가격. 0원 이상 |

### 요청 본문 예시

```json
{
  "price": 28000
}
```

### 응답 본문 예시

```json
{
  "id": 101,
  "storeId": 10,
  "name": "짜장면·탕수육 세트",
  "price": 28000
}
```

변경값을 한 개 이상 보낸다. 과거 주문의 unitPrice는 주문 당시 가격을 유지한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 수정값 오류 | 수정할 메뉴 정보를 확인해 주세요. |
| 404 | 해당 가게의 메뉴 없음 | 메뉴를 찾을 수 없습니다. |


<!-- pagebreak -->

# 5. 주문 API

## API 19 주문과 결제 생성

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/orders |
| 권한 | 고객 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token><br>Idempotency-Key: <주문 시도별 키> (선택) |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| storeId (Body) | integer | 필수 | 주문할 음식점ID. 양의 정수 |
| addressId (Body) | integer | 필수 | 본인 배송지ID. 양의 정수 |
| items (Body) | array | 필수 | 주문 메뉴 목록. 1개 이상 |
| items[].menuId (Body) | integer | 필수 | 해당 음식점 메뉴ID |
| items[].quantity (Body) | integer | 필수 | 1 이상의 정수 |
| payment (Body) | object | 필수 | 결제정보 |
| payment.method (Body) | string | 필수 | 카드 / 간편결제 |

### 요청 본문 예시

```json
{
  "storeId": 10,
  "addressId": 1,
  "items": [
    {
      "menuId": 101,
      "quantity": 1
    }
  ],
  "payment": {
    "method": "카드"
  }
}
```

### 응답 본문 예시

```json
{
  "id": 100,
  "customerId": 1,
  "storeId": 10,
  "addressId": 1,
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "status": "접수대기",
  "createdAt": "2026-11-15T18:00:00+09:00",
  "totalAmount": 27000,
  "deliveryFee": 3000,
  "items": [
    {
      "id": 1,
      "orderId": 100,
      "menuId": 101,
      "menuName": "짜장면·탕수육 세트",
      "quantity": 1,
      "unitPrice": 27000,
      "lineTotal": 27000
    }
  ],
  "payment": {
    "id": 1,
    "orderId": 100,
    "method": "카드",
    "amount": 30000,
    "status": "완료",
    "canceledAt": null
  },
  "delivery": null
}
```

주문·주문상세·결제를 함께 생성한다. 외부 결제 연동 없이 결제 결과를 기록한다. totalAmount는 메뉴 합계이고 payment.amount는 totalAmount + deliveryFee다. 단가·배달비·주소는 주문 시점 값으로 복사한다. 중복 menuId는 수량을 합치는 안이다. 결제실패 결과를 저장한 경우도 201이며 order.status는 결제실패, payment.status는 실패다. 저장 자체가 실패하면 전체 저장을 취소하고 오류를 반환한다. 응답 delivery는 수락 전 null, 수락 후 배달 API와 같은 객체다. items의 menuName은 현재 메뉴명이고 lineTotal은 quantity × unitPrice다.

선택 헤더 Idempotency-Key는 1~200자다. 같은 역할·계정의 같은 키와 같은 요청은 처음 생성한 Order의 복사본과 200을 반환한다. 다른 요청에 같은 키를 쓰면 409다. 통신 오류 재전송에는 같은 키, 결제실패 후 새 주문에는 새 키를 사용한다. 현재 상태는 주문 조회로 확인한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 수량·메뉴·배송지 오류 | 주문 정보를 확인해 주세요. |
| 404 | 음식점·메뉴·배송지 없음 | 주문할 데이터를 찾을 수 없습니다. |
| 409 | 영업종료 또는 같은 재전송 키에 다른 요청 | 주문할 수 없는 상태입니다. |

## API 20 주문 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/orders |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| status (Query) | string | 선택 | 주문상태로 필터. 결제실패 / 접수대기 / 조리중 / 조리완료 / 거절 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 100,
    "customerId": 1,
    "storeId": 10,
    "addressId": 1,
    "addressSnapshot": "서울시 성북구 예시로 1 101호",
    "status": "접수대기",
    "createdAt": "2026-11-15T18:00:00+09:00",
    "totalAmount": 27000,
    "deliveryFee": 3000,
    "items": [
      {
        "id": 1,
        "orderId": 100,
        "menuId": 101,
        "menuName": "짜장면·탕수육 세트",
        "quantity": 1,
        "unitPrice": 27000,
        "lineTotal": 27000
      }
    ],
    "payment": {
      "id": 1,
      "orderId": 100,
      "method": "카드",
      "amount": 30000,
      "status": "완료",
      "canceledAt": null
    },
    "delivery": null
  }
]
```

본인 관련 주문만 최신순으로 반환한다. 점주의 목록은 결제완료 주문과 거절로 결제취소된 주문을 대상으로 하며 결제실패 주문은 제외한다. 빈 목록은 []다. payment와 delivery를 포함하는 형식으로 제안한다.

## API 21 주문 상세 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/orders/{orderId} |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| orderId (Path) | integer | 필수 | 주문ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 100,
  "customerId": 1,
  "storeId": 10,
  "addressId": 1,
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "status": "접수대기",
  "createdAt": "2026-11-15T18:00:00+09:00",
  "totalAmount": 27000,
  "deliveryFee": 3000,
  "items": [
    {
      "id": 1,
      "orderId": 100,
      "menuId": 101,
      "menuName": "짜장면·탕수육 세트",
      "quantity": 1,
      "unitPrice": 27000,
      "lineTotal": 27000
    }
  ],
  "payment": {
    "id": 1,
    "orderId": 100,
    "method": "카드",
    "amount": 30000,
    "status": "완료",
    "canceledAt": null
  },
  "delivery": null
}
```

주문상태는 status, 배달 진행은 delivery.status로 표시한다. 수락 전 delivery는 null이다. 주소와 금액은 주문 당시 값이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 주문 없음 | 주문을 찾을 수 없습니다. |

## API 22 점주 주문 상태 변경

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/orders/{orderId}/status |
| 권한 | 해당 점주 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| orderId (Path) | integer | 필수 | 주문ID. 양의 정수 |
| status (Body) | string | 필수 | 조리중 / 조리완료 / 거절 |

### 요청 본문 예시

```json
{
  "status": "조리중"
}
```

### 응답 본문 예시

```json
{
  "id": 100,
  "customerId": 1,
  "storeId": 10,
  "addressId": 1,
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "status": "조리중",
  "createdAt": "2026-11-15T18:00:00+09:00",
  "totalAmount": 27000,
  "deliveryFee": 3000,
  "items": [
    {
      "id": 1,
      "orderId": 100,
      "menuId": 101,
      "menuName": "짜장면·탕수육 세트",
      "quantity": 1,
      "unitPrice": 27000,
      "lineTotal": 27000
    }
  ],
  "payment": {
    "id": 1,
    "orderId": 100,
    "method": "카드",
    "amount": 30000,
    "status": "완료",
    "canceledAt": null
  },
  "delivery": null
}
```

접수대기에서 조리중 또는 거절, 조리중에서 조리완료로 변경하는 안이다. 거절 시 주문은 거절, payment.status는 취소완료, canceledAt은 취소 시각으로 함께 반영한다. 같은 현재 상태 재요청은 200이다. 결제실패 후 새 주문은 새 orderId와 paymentId를 사용한다. 고객 직접 취소와 실패 주문 재결제 API는 제공 범위에서 제외한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 주문 없음 | 주문을 찾을 수 없습니다. |
| 409 | 허용되지 않는 상태 변경 | 현재 주문상태에서 변경할 수 없습니다. |


<!-- pagebreak -->

# 6. 결제 조회 API

## API 23 주문 결제 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/orders/{orderId}/payments |
| 권한 | 해당 고객·점주 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| orderId (Path) | integer | 필수 | 주문ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 1,
    "orderId": 100,
    "method": "카드",
    "amount": 30000,
    "status": "완료",
    "canceledAt": null
  }
]
```

주문당 결제는 한 건이며, 한 객체를 담은 배열로 반환한다. 결제는 주문 생성 요청에 포함된다. canceledAt은 취소완료일 때 일시, 그 외에는 null이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 주문 없음 | 주문을 찾을 수 없습니다. |

## API 24 결제 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/payments |
| 권한 | 고객·점주 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 1,
    "orderId": 100,
    "method": "카드",
    "amount": 30000,
    "status": "완료",
    "canceledAt": null
  }
]
```

고객은 본인 주문, 점주는 본인 음식점 주문의 결제만 조회한다. 결제 id 내림차순이며 없으면 []다. status는 완료 / 실패 / 취소완료다.

## API 25 결제 상세 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/payments/{paymentId} |
| 권한 | 해당 고객·점주 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| paymentId (Path) | integer | 필수 | 결제ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 1,
  "orderId": 100,
  "method": "카드",
  "amount": 30000,
  "status": "완료",
  "canceledAt": null
}
```

amount는 주문금액과 배달비의 합이다. 결제수단 method는 카드 / 간편결제다. 음식점 거절 시 같은 결제의 상태와 취소일자를 갱신한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 결제 없음 | 결제를 찾을 수 없습니다. |


<!-- pagebreak -->

# 7. 라이더 배달 API

## API 26 라이더 운행상태 변경

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/riders/me/status |
| 권한 | 라이더 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| status (Body) | string | 필수 | 운행가능 / 운행종료 |

### 요청 본문 예시

```json
{
  "status": "운행가능"
}
```

### 응답 본문 예시

```json
{
  "id": 7,
  "role": "RIDER",
  "name": "테스트 라이더",
  "email": "rider@example.test",
  "phone": "010-0000-0007",
  "status": "운행가능"
}
```

배달 수락 시 배달중, 배달완료 후 운행가능으로 자동 변경된다. response는 라이더 User 객체다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 409 | 진행 중인 배달이 있음 | 배달 중에는 운행상태를 변경할 수 없습니다. |

## API 27 수락 가능한 주문 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/deliveries/available |
| 권한 | 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "orderId": 100,
    "storeId": 10,
    "storeName": "예시 중국집",
    "pickupAddress": "서울시 성북구 예시로 10",
    "deliveryFee": 3000
  }
]
```

조리완료이며 아직 배정되지 않은 주문이다. orderId 오름차순으로 반환한다. 수락 전에는 픽업 장소와 배달비를 제공하며 고객 배송주소는 수락 후 조회한다.

## API 28 라이더 배달 수락

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | POST /api/orders/{orderId}/delivery/accept |
| 권한 | 라이더 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 201 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| orderId (Path) | integer | 필수 | 수락할 주문ID. 양의 정수 |

### 요청 본문 예시

```json
{}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "orderId": 100,
  "riderId": 7,
  "status": "배정완료",
  "pickupAddress": "서울시 성북구 예시로 10",
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "deliveryFee": 3000,
  "completedAt": null
}
```

운행가능 라이더가 선착순 수락한다. 수락 시 배달과 배정완료 이력을 생성하고 라이더는 배달중이 된다. 같은 라이더의 같은 주문 재요청은 기존 Delivery와 200을 반환하는 안이다. 재배정은 없다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 주문 없음 | 주문을 찾을 수 없습니다. |
| 409 | 이미 다른 라이더가 수락·운행 불가·조리완료 전 | 현재 이 주문을 수락할 수 없습니다. |

## API 29 주문 배달 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/orders/{orderId}/delivery |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| orderId (Path) | integer | 필수 | 주문ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 1,
  "orderId": 100,
  "riderId": 7,
  "status": "배정완료",
  "pickupAddress": "서울시 성북구 예시로 10",
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "deliveryFee": 3000,
  "completedAt": null
}
```

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 주문 없음 또는 수락 전 | 배달 정보가 아직 없거나 주문을 찾을 수 없습니다. |

## API 30 배달 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/deliveries |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 1,
    "orderId": 100,
    "riderId": 7,
    "status": "배정완료",
    "pickupAddress": "서울시 성북구 예시로 10",
    "addressSnapshot": "서울시 성북구 예시로 1 101호",
    "deliveryFee": 3000,
    "completedAt": null
  }
]
```

본인 관련 배달만 id 내림차순으로 반환한다. 없으면 []다. 수락 후 생성된 배달만 목록에 포함된다.

## API 31 배달 상세 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/deliveries/{deliveryId} |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| deliveryId (Path) | integer | 필수 | 배달ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 1,
  "orderId": 100,
  "riderId": 7,
  "status": "배정완료",
  "pickupAddress": "서울시 성북구 예시로 10",
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "deliveryFee": 3000,
  "completedAt": null
}
```

pickupAddress는 음식점 주소, addressSnapshot은 주문시주소, deliveryFee는 주문 배달비다. completedAt은 배달완료 이력 시각이며 완료 전에는 null이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 배달 없음 | 배달을 찾을 수 없습니다. |

## API 32 배달 상태이력 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/deliveries/{deliveryId}/history |
| 권한 | 관련 고객·점주·배정 라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| deliveryId (Path) | integer | 필수 | 배달ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 1,
    "deliveryId": 1,
    "status": "배정완료",
    "changedAt": "2026-11-15T18:25:00+09:00"
  }
]
```

배정완료부터 기록하며 changedAt 오름차순이다. 동일 배달의 동일 상태는 한 번만 기록한다. 예시는 수락 직후 이력이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 배달 없음 | 배달을 찾을 수 없습니다. |

## API 33 배달 상태 변경

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | PATCH /api/deliveries/{deliveryId}/status |
| 권한 | 배정된 라이더 |
| 요청 헤더 | Content-Type: application/json<br>Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| deliveryId (Path) | integer | 필수 | 배달ID. 양의 정수 |
| status (Body) | string | 필수 | 픽업완료 / 배달중 / 배달완료 |

### 요청 본문 예시

```json
{
  "status": "픽업완료"
}
```

### 응답 본문 예시

```json
{
  "id": 1,
  "orderId": 100,
  "riderId": 7,
  "status": "픽업완료",
  "pickupAddress": "서울시 성북구 예시로 10",
  "addressSnapshot": "서울시 성북구 예시로 1 101호",
  "deliveryFee": 3000,
  "completedAt": null
}
```

배정완료 → 픽업완료 → 배달중 → 배달완료 순서로 변경한다. 같은 현재 상태 재요청은 200이며 이력을 추가하지 않는다. 완료 시 completedAt을 반환하고 라이더는 운행가능이 된다. 주문상태는 조리완료를 유지한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 배달 없음 | 배달을 찾을 수 없습니다. |
| 409 | 상태 순서가 맞지 않음 | 현재 배달상태에서 변경할 수 없습니다. |


<!-- pagebreak -->

# 8. 정산 조회 API

## API 34 주간 정산 목록 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/settlements |
| 권한 | 점주·라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| startDate (Query) | string | 선택 | 월요일 YYYY-MM-DD. 해당 주 필터 |

요청 본문 없음.

### 응답 본문 예시

```json
[
  {
    "id": 2,
    "storeId": null,
    "riderId": 7,
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "amount": 3000,
    "status": "생성완료"
  }
]
```

점주는 본인 음식점, 라이더는 본인 정산만 반환한다. startDate 최신순이며 없으면 []다. 정산기간은 월~일이고 amount는 정산상세 지급금액 합계다. status는 생성완료 / 지급완료다. 음식점 정산은 storeId에 값이 있고 riderId는 null이다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 400 | 날짜 형식·요일 오류 | 정산시작일은 월요일 날짜로 입력해 주세요. |

## API 35 정산 상세와 주문별 지급 내역 조회

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/settlements/{settlementId} |
| 권한 | 해당 점주·라이더 |
| 요청 헤더 | Authorization: Bearer <token> |
| 성공 상태 | 200 |

### 요청 항목

| 항목 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| settlementId (Path) | integer | 필수 | 정산ID. 양의 정수 |

요청 본문 없음.

### 응답 본문 예시

```json
{
  "id": 2,
  "storeId": null,
  "riderId": 7,
  "startDate": "2026-11-09",
  "endDate": "2026-11-15",
  "amount": 3000,
  "status": "생성완료",
  "items": [
    {
      "id": 2,
      "settlementId": 2,
      "orderId": 100,
      "payTarget": "라이더",
      "payAmount": 3000
    }
  ]
}
```

items의 payTarget은 지급대상구분이며 음식점 / 라이더다. 음식점 몫은 주문금액, 라이더 몫은 주문 배달비이고 수수료는 없다. 같은 주문의 같은 몫은 한 번만 정산한다. 정산은 한 대상만 포함하며 storeId와 riderId 중 하나만 값이 있다. DB의 pay_target과 settlement_status에 대응한다. 매주 월요일에 지난주 배달완료 시각을 기준으로 정산을 생성한다.

### 추가 오류

| HTTP | 상황 | message 예시 |
| --- | --- | --- |
| 404 | 정산 없음 | 정산을 찾을 수 없습니다. |


<!-- pagebreak -->

# 9. 서버 확인 API

## API 36 서버 상태 확인

| 항목 | 내용 |
| --- | --- |
| HTTP 메서드와 URL | GET /api/health |
| 권한 | 공개 |
| 요청 헤더 | 추가 헤더 없음 |
| 성공 상태 | 200 |

### 요청 항목

추가 입력 항목 없음.

요청 본문 없음.

### 응답 본문 예시

```json
{
  "status": "ok"
}
```

서버의 요청 응답 여부를 확인한다.
