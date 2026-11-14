# 배달앱 프론트엔드 (3조)

고객이 음식점 메뉴를 주문하면 점주가 조리하고, 라이더가 배달하고, 정산까지 이어지는 배달앱의 프론트엔드입니다.
**모든 화면(고객·점주·라이더)은 모바일 기준**으로 만듭니다.

- 백엔드(Express + MySQL)는 아직 없음 → **MSW로 가짜 API**를 띄워 개발
- DB 규칙은 `3조 DB 최종 규칙 정리`와 테이블 정의서를 따름

---

## 실행 방법

```bash
npm install            # 패키지가 추가됐으므로 처음 한 번 꼭 실행
cp .env.example .env.local   # Windows: copy .env.example .env.local (이미 있으면 생략)
npm run dev
```

| 주소 | 화면 |
|---|---|
| http://localhost:3000 | 고객 · 음식점 목록 |
| http://localhost:3000/restaurants/1 | 고객 · 메뉴 (홍콩반점) |
| http://localhost:3000/cart | 고객 · 장바구니 |
| http://localhost:3000/owner/orders | 점주 · 주문 관리 |

> 브라우저 개발자도구에서 모바일 화면(예: iPhone 14, 390px)으로 보는 것을 권장합니다.
> MSW 데모: 점주 주문 관리 화면을 켜 두면 **30초 뒤 새 주문**이 들어오고, 조리완료 주문은 **20초 뒤 라이더가 배정**됩니다. 새로고침하면 가짜 데이터가 초기화됩니다.

### 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (커밋 전 확인) |
| `npm run lint` | ESLint |
| `npx next typegen` | `PageProps`, `LayoutProps` 타입 생성 (dev/build 시 자동) |

### 환경변수 (`.env.local`)

| 이름 | 예시 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Express 서버 주소 (백엔드와 합의 후 수정) |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` / `disabled` | `enabled`면 MSW 가짜 API 사용 |

- `.env.local`은 Git에 올리지 않습니다. 공유용은 `.env.example`.
- `NEXT_PUBLIC_` 값은 빌드 시 코드에 들어가므로 **바꾸면 `npm run dev`를 재시작**해야 합니다.

---

## 기술 스택

| 분류 | 사용 | 버전 |
|---|---|---|
| 프레임워크 | Next.js (App Router, Turbopack, **Cache Components 켜짐**) | 16.4 |
| 언어 | TypeScript | 5 |
| 스타일 | Tailwind CSS (`@theme` 디자인 토큰) | 4.3 |
| 서버 상태 | TanStack Query | 5 |
| 클라이언트 상태 | Zustand (장바구니, 토스트) | 5 |
| HTTP | axios | 1 |
| 가짜 API | MSW | 3 |
| 아이콘 | lucide-react | 1 |
| 글꼴 | Pretendard (Variable, `next/font/local`) | 1.3 |
| 날짜 | date-fns | 4 |
| 폼 (설치만, 아직 미사용) | react-hook-form, zod, @hookform/resolvers | 7 / 4 / 7 |

> MSW 3은 2와 옵션 이름이 다릅니다: `onUnhandledRequest` → **`onUnhandledFrame`**

---

## 폴더 구조

`src/` 없이 `app/` 안에서 해결합니다. 밑줄(`_`)로 시작하는 폴더는 라우트가 되지 않습니다(Private Folder).

```
app/
├── _components/        # 전역 공통 컴포넌트 (Button, StatusBadge, BottomTabBar ...)
├── _hooks/queries/     # TanStack Query 훅 (useRestaurants, useOwnerOrders ...)
├── _lib/
│   ├── api/            # axios 인스턴스 + 도메인별 API 함수
│   ├── constants/      # status.ts(상태값), polling.ts(폴링 주기), queryKeys.ts
│   ├── types/          # DB 테이블 기준 타입
│   └── utils/          # formatWon, cn ...
├── _mocks/             # MSW (data.ts = 가짜 DB, handlers/)
├── _providers/         # QueryClient, MSW
├── _stores/            # Zustand (cartStore, toastStore)
│
├── (customer)/         # 고객 — URL에 (customer) 안 붙음
│   ├── page.tsx                    /                 음식점 목록
│   ├── restaurants/[id]/page.tsx   /restaurants/1    메뉴 + 장바구니 담기
│   ├── cart/page.tsx               /cart             장바구니
│   ├── orders/page.tsx             /orders           (다음 작업)
│   └── me/page.tsx                 /me               (다음 작업)
├── owner/              # 점주
│   ├── orders/page.tsx             /owner/orders     주문 관리
│   ├── menus/ settlements/ store/                    (다음 작업)
│   (/owner 접속 시 /owner/orders 로 이동 — next.config.ts redirects)
├── layout.tsx          # 폰트, viewport, Provider
└── globals.css         # 디자인 토큰
```

- 여러 화면이 같이 쓰는 것 → `app/_components`, `app/_lib`
- 한 화면에서만 쓰는 것 → 그 라우트 폴더 안 `_components` (예: `owner/orders/_components/OwnerOrderCard.tsx`)

---

## 컨벤션

### Git

**브랜치**: `main` + 작업 브랜치. 이름은 `타입/범위-내용` (소문자 kebab-case)

```
feat/owner-order-board
fix/customer-cart-total
ui/design-tokens
chore/msw-setup
```

- 브랜치 하나 = 화면 하나 또는 기능 하나
- 끝나면 main에 머지하고 브랜치 삭제

**커밋 메시지**

```
<타입>(<범위>): <제목>

<본문 - 선택, "왜" 바꿨는지>
```

| 타입 | 언제 |
|---|---|
| `feat` | 새 기능, 새 화면 |
| `fix` | 버그 수정 |
| `ui` | 스타일·레이아웃만 변경 (동작 변화 없음) |
| `refactor` | 동작은 같고 코드 구조만 변경 |
| `mock` | MSW 핸들러, 가짜 데이터 |
| `chore` | 패키지, 설정 파일 |
| `docs` | 문서 |

- **범위**: `customer` `owner` `rider` `auth` `common` `api` `mock` `config`
- **제목**: 한글, 명사형으로 끝냄("추가", "수정", "변경", "삭제"), 50자 이내, 마침표 없음
- DB 규칙 때문에 일부러 그렇게 만든 코드면 본문에 근거를 남김
- 한 커밋 = 한 가지 변경. `npm run lint`, `npm run build` 통과 후 커밋

```
feat(owner): 주문 관리 탭·카드 화면 추가
fix(customer): 결제금액에 배달비 누락 수정
ui(common): StatusBadge 색상 토큰 적용

feat(customer): 주문 취소 버튼 제거

고객 직접 취소 기능은 범위에서 제외됨 (DB 최종 규칙 ③)
```

### 코드 이름

| 대상 | 규칙 | 예 |
|---|---|---|
| 라우트 폴더 | kebab-case | `app/owner/orders/` |
| 컴포넌트 파일 | PascalCase | `OwnerOrderCard.tsx` |
| 훅 | `use` + camelCase | `useOwnerOrders.ts` |
| 그 외 ts | camelCase | `ownerApi.ts`, `status.ts` |
| 상수 | UPPER_SNAKE | `ORDER_STATUS`, `POLLING` |
| 타입 | PascalCase, `I` 접두사 없음 | `OwnerOrder` |

### 코드 규칙

- **상태 문자열은 `_lib/constants/status.ts`에서만** 가져다 씀 ("접수대기" 직접 타이핑 금지)
- 금액 계산은 `_lib/utils/format.ts`의 `formatWon`, `getPaymentAmount` 사용
- 쿼리 키는 `_lib/constants/queryKeys.ts`에서만 생성
- 상태 변경(mutation) 후에는 폴링을 기다리지 않고 `invalidateQueries`로 즉시 재조회
- 동적 라우트(`[id]`)는 **Cache Components 규칙**에 따라 `page.tsx`에서 `params` Promise를 `<Suspense>` 안 클라이언트 컴포넌트로 넘기고 `use(params)`로 꺼냄 (`restaurants/[id]/page.tsx` 참고)
- `msw/browser`처럼 브라우저 전용 모듈은 `next/dynamic`의 `ssr: false`로 불러오고, **반드시 `<Suspense>`로 감쌈** (서버 번들에 들어가면 빌드 실패, 안 감싸면 instant 검증 에러)
- `usePathname()`, `useSearchParams()`, `useParams()`를 쓰는 클라이언트 컴포넌트가 레이아웃에 있으면 `<Suspense>`로 감쌈 (동적 라우트에서 요청 시점 값이라 정적 셸을 막음)
- 페이지 안에서 `redirect()`로 다른 주소로 보내지 않음 → `next.config.ts`의 `redirects()` 사용
- 개발 서버 터미널에 `Could not validate instant` / `outside of <Suspense>`가 뜨면 위 규칙 위반이므로 바로 고칠 것

### 폴링 주기 (`_lib/constants/polling.ts`)

| 화면 | 주기 |
|---|---|
| 점주 주문 관리 | 10초 |
| 라이더 수락 가능한 주문 | 5초 |
| 고객 주문 상세 | 10초, 끝난 주문(배달완료·거절·결제실패)이면 중지 |
| 라이더 진행 중 배달, 고객 주문 목록, 정산 | 폴링 안 함 |

탭이 백그라운드면 자동으로 멈춥니다.

---

## 디자인 규칙

### AI가 만든 티 안 나게 — 금지 목록

| 금지 | 대신 |
|---|---|
| 그라데이션, 그라데이션 글자 | 단색 |
| 이모지 아이콘 | `lucide-react`, `strokeWidth={1.75}` |
| 모든 카드에 그림자 | 카드는 **테두리만**. 그림자는 떠 있는 요소에만 |
| `rounded-2xl` 이상 | 버튼·입력 `rounded-md`, 카드 `rounded-lg`. 완전 둥근 건 배지·토글만 |
| `text-4xl font-extrabold` | 페이지 제목 `text-xl font-bold` 이하 |
| Tailwind 기본색 (`orange-500`, `blue-500` ...) | 아래 **색 토큰만** |
| 과장된 문구, 이모지 문구 | 담백한 실제 문구: "주문하기", "조리 완료" |
| Lorem ipsum, 테스트1 | 그럴듯한 실제 데이터 |
| hover 확대·튀는 애니메이션 | 색 변화만 |

### 색 토큰 (`app/globals.css`)

| 클래스 | 값 | 용도 |
|---|---|---|
| `brand` | `#E2462B` | 주요 버튼, 강조 숫자 — **한 화면에 한두 군데** |
| `brand-hover` | `#C93A21` | 버튼 눌림 |
| `brand-subtle` | `#FDF0EC` | 선택 항목 배경 |
| `ink` / `ink-2` / `ink-3` | `#1C1A17` / `#57524B` / `#8C867D` | 본문 / 보조 / 비활성 글자 |
| `line` | `#E6E2DC` | 테두리, 구분선 |
| `canvas` | `#F6F4F1` | 페이지 배경 (점주) |
| `fill` | `#EFECE8` | 비활성 버튼, 안내 박스 |

상태 톤은 `<StatusBadge status="접수대기" />`로만 표시합니다.

| 톤 | 해당 상태 |
|---|---|
| waiting | 접수대기, 배정완료, 생성완료 |
| progress | 조리중, 픽업완료, 배달중 |
| success | 조리완료, 배달완료, 완료, 지급완료, 영업중, 운행가능 |
| danger | 거절, 결제실패, 실패, 취소완료 |
| neutral | 영업종료, 운행종료 |

### 글꼴·문구

- Pretendard 하나. 굵기는 400 / 600(`font-semibold`) / 700(`font-bold`)만
- 금액·수량·주문번호는 `tabular-nums`. 금액 표기는 `27,000원` (₩ 안 씀)
- 버튼은 동사로 끝냄: "주문하기", "수락하고 조리 시작"
- 에러는 무엇이 문제고 무엇을 하면 되는지: "이미 조리중 상태인 주문이에요. 목록을 새로고침했어요."
- 존댓말은 **"~해요"체**로 통일

### 모바일 규칙

| 항목 | 규칙 |
|---|---|
| 화면 폭 | `MobileShell`로 최대 480px 고정 (데스크톱에서도 가운데) |
| 화면 높이 | `min-h-dvh` (`h-screen` 금지 — 주소창 때문에 하단이 가려짐) |
| 안전 영역 | 하단 고정 요소에 `pb-[env(safe-area-inset-bottom)]` |
| 터치 영역 | 최소 44px, 주요 버튼 48px (`<Button size="lg">`) |
| 본문 글자 | 15px (`text-body`), 보조 13px (`text-caption`), 12px 미만 금지 |
| 입력창 | 16px 이상 (iOS 자동 확대 방지, `globals.css`에 적용됨) |
| 간격 | 4의 배수, 좌우 여백 16px (`px-4`) |
| hover | 쓰지 않음. 눌림 피드백은 `active:` |
| 선택 UI | 바텀시트. 되돌릴 수 없는 작업(거절 등)만 `ConfirmDialog` |
| 토스트 | 하단 탭 바 바로 위 (`toast("...")`) |
| 하단 CTA가 있는 화면 | 하단 탭 바 숨김 (`BottomTabBar`의 `hideOn`) |
| 숫자 입력 | `type="number"` 대신 `inputMode="numeric"` |

---

## 가짜 API (MSW) — 프론트가 가정한 명세

> 백엔드와 합의 전 **임시 명세**입니다. 응답 필드명은 DB 컬럼명(snake_case)을 그대로 씁니다.

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/restaurants` | 음식점 목록 |
| GET | `/restaurants/:id` | 음식점 상세 |
| GET | `/restaurants/:id/menus` | 메뉴 목록 |
| GET | `/owner/restaurant` | 로그인한 점주의 가게 |
| PATCH | `/owner/restaurant/status` | 영업상태 변경 `{ status: "영업중" \| "영업종료" }` |
| GET | `/owner/orders` | 점주 주문 목록 (주문상세 + 배달 요약 포함) |
| PATCH | `/owner/orders/:id/status` | 접수대기→조리중, 조리중→조리완료 `{ status }` |
| POST | `/owner/orders/:id/reject` | 거절 (주문상태 거절 + 결제상태 취소완료) |

에러 응답(가정): `{ "code": "INVALID_ORDER_STATUS", "message": "..." }` + HTTP 상태코드

### 백엔드와 합의할 것

- [ ] API 필드명 표기 (snake_case 유지 vs camelCase)
- [ ] 에러 응답 형식, 상태코드 (이메일 중복·선착순 실패 409 등)
- [ ] 인증 방식 (JWT 쿠키/헤더, 로그인 API 1개 vs 역할별 3개) → 이후 `proxy.ts`로 역할별 접근 제어
- [ ] 주문 생성 API: 프론트는 메뉴ID·수량·배송지ID·결제수단만 보내고 금액은 서버가 계산
- [ ] 주문 상세 응답에 배달 정보 포함 여부
- [ ] 메뉴 설명·사진, 메뉴 판매중지(`is_active`) 컬럼 추가 여부 / 주문된 메뉴·배송지 삭제 처리
- [ ] 결제 실패 재현 방법, 정산 지급완료 처리 주체, 정산 수동 생성 API

---

## 작업 내역

### 2026-11-14 — 프로젝트 기반 + 고객 메뉴·점주 주문 관리 화면

**기반**
- 패키지 추가: TanStack Query, axios, Zustand, MSW 3, lucide-react, Pretendard, date-fns, react-hook-form, zod
- 디자인 토큰(`globals.css @theme`), Pretendard 로컬 폰트, 모바일 viewport(`viewportFit: cover`)
- QueryClient Provider, MSW Provider(`NEXT_PUBLIC_API_MOCKING`으로 on/off)
- `.env.example` 추가, `.gitignore`에서 `.env.example`만 예외 처리
- ESLint에서 MSW 생성 파일(`public/mockServiceWorker.js`) 제외
- 기본 템플릿 `app/page.tsx` 삭제 (고객 홈은 `(customer)/page.tsx`)

**공통**
- 상태값 상수·톤 매핑(`status.ts`), 폴링 주기(`polling.ts`), 쿼리 키(`queryKeys.ts`)
- DB 테이블 기준 타입(`Restaurant`, `Menu`, `OwnerOrder`, `OrderItem`)
- axios 클라이언트 + `ApiError` (에러 문구 통일)
- 장바구니 스토어: 한 주문 = 한 음식점, 다른 가게 메뉴 담으면 `"conflict"` 반환, localStorage 저장
- 뒤로가기: 링크로 바로 들어와 앱 안 이동 기록이 없으면 앱 밖으로 나가지 않고 홈으로 이동 (`NavigationTracker`)
- 공통 컴포넌트: `MobileShell`, `AppHeader`, `BottomTabBar`, `StatusBadge`, `Button`, `ConfirmDialog`, `Toaster`, `EmptyState`, `LoadingList`, `QuantityStepper`, `PriceSummary`, `ToggleSwitch`

**고객**
- 음식점 목록: 영업중 우선 정렬, 영업상태 배지, 배달비(0원이면 "무료")
- 메뉴 화면: 메뉴명·가격만 표시(DB에 설명·사진 없음), 담기/수량 조절, 영업종료면 담기 불가
- 다른 가게 메뉴를 담으면 "장바구니를 비울까요?" 확인
- 하단 고정 바: 주문금액·배달비 분리 표시, 버튼에 결제금액(주문금액 + 배달비)
- 장바구니에 다른 가게 메뉴가 있으면 하단 바에 금액 대신 "○○ 메뉴가 담겨 있어요" 안내 (다른 가게 금액이 이 가게 금액처럼 보이는 문제 방지)
- 장바구니: 수량 조절, 금액 3줄 요약. 주문하기는 API 합의 전이라 비활성

**점주**
- 공통 상단 바: 가게명 + 영업상태 토글 (변경 시 고객 음식점 목록도 갱신)
- 하단 탭(주문·메뉴·정산·가게), 주문 탭에 접수대기 건수 배지
- 주문 관리: 상태 탭(접수대기·조리중·조리완료 + 건수) + 카드 리스트, 10초 폴링
- 상태별로 가능한 버튼만 노출, 누르는 동안 비활성화(중복 클릭 방지)
- 거절: 취소될 결제금액을 보여 주는 확인 다이얼로그
- 조리완료 카드: 라이더 배정 전 "기다리는 중", 배정 후 라이더명·배달상태
- 새 주문이 들어오면 진동 + 토스트, 거절된 주문은 하단 링크로 따로 보기

**검증**: `tsc --noEmit`, `npm run lint`, `npm run build` 통과 + 모바일 화면(390px) 헤드리스 브라우저로 주요 흐름 확인
(음식점 목록 → 메뉴 담기 → 다른 가게 담기 확인창 → 영업종료 가게 → 장바구니 금액 / 점주 수락 → 거절 다이얼로그 → 탭 이동 → 영업상태 토글)

#### 커밋 제안 (위 작업을 컨벤션대로 나눈 순서)

```
chore(config): TanStack Query, Zustand, MSW 등 패키지 설치
chore(config): 환경변수 예시 파일 추가 및 ESLint 제외 경로 설정
ui(common): 디자인 토큰과 Pretendard 폰트, 모바일 viewport 적용
feat(common): 상태값·폴링·쿼리키 상수와 DB 기준 타입 추가
feat(api): axios 클라이언트와 음식점·점주 API 함수 추가
mock(common): MSW 워커와 음식점·점주 주문 가짜 데이터 추가
feat(common): 모바일 공통 컴포넌트 추가
feat(customer): 음식점 목록·메뉴·장바구니 화면 추가
feat(owner): 주문 관리 탭·카드 화면과 영업상태 토글 추가
docs: README에 실행 방법·컨벤션·작업 내역 정리
```

### 2026-11-14 — Cache Components `instant` 검증 에러 수정

개발 서버에서 `Route "/": Could not validate instant ...` 에러가 나던 문제 수정.

| 원인 | 수정 |
|---|---|
| `ssr: false`로 불러온 `MswStarter`가 서버에서 "브라우저 전용" 신호를 던지는데, 루트 레이아웃에 `<Suspense>`가 없어 검증이 멈춤 | `MswStarter`를 `<Suspense fallback={null}>`로 감쌈 |
| MSW 준비 전까지 `children`을 아예 안 그려서 서버 렌더링 결과가 빈 화면 | `children`은 항상 그리고, API 요청만 워커 준비까지 대기 (`client.ts`의 `mockReady` + 요청 인터셉터) |
| 고쳐지자 드러난 추가 경고: `/restaurants/[id]`에서 `usePathname()`이 `<Suspense>` 밖 (`NavigationTracker`, 하단 탭 바) | 각각 `<Suspense fallback={null}>`로 감쌈 |
| `/owner` 페이지의 `redirect()`가 렌더링 중 에러로 잡힘 | `app/owner/page.tsx` 삭제, `next.config.ts`의 `redirects()`로 이동 |

**검증**: `.next` 캐시 삭제 후 `tsc`, `lint`, `build` 통과. 개발 서버에서 전체 화면 12개 접속 시 에러·경고 0건

```
fix(common): Cache Components instant 검증 에러 수정

- MswStarter(ssr:false)와 usePathname 사용 컴포넌트를 Suspense로 감쌈
- MSW 준비 전 화면을 막지 않고 API 요청만 대기하도록 변경
- /owner 리다이렉트를 페이지 redirect()에서 next.config redirects로 이동
```

### 다음 작업

- 고객: 배송지 관리, 주문하기(배송지·결제수단 선택), 주문 상세(진행 바), 주문 내역
- 점주: 메뉴 관리(바텀시트 등록·수정), 가게 설정(배달비), 정산 내역
- 라이더: 운행상태, 수락 가능한 주문(5초 폴링), 배달 진행(다음 단계 버튼)
- 로그인·회원가입, `proxy.ts` 역할별 접근 제어 (인증 방식 합의 후)
