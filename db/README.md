# DB (delivery_app) - 배달앱 플랫폼 3조

## 파일
| 파일 | 설명 |
|---|---|
| schema.sql | 테이블 정의서 기준 DB + 테이블 13개 생성 (ENUM, CHECK, UNIQUE, FK 포함). 실행하면 기존 delivery_app 삭제 후 새로 만듦 |
| data.sql | 시연(영상 촬영)용 데이터 (팀 시나리오 기준). 항상 schema.sql 직후에 실행. 날짜는 실행일 기준 자동 계산. 모든 계정 비밀번호 test1234 |

## 시연용 계정 (비밀번호 모두 test1234)
- 손님 customer@test.com / 사장님 owner@test.com (김밥천국 광교점) / 가게 없는 사장님 newowner@test.com
- 라이더 rider@test.com, rider2@test.com (동시 수락 테스트), rider3@test.com (배달중)
- 이메일 중복 테스트 taken@test.com

## 실행 순서
1. schema.sql 전체 실행
2. data.sql 전체 실행
- DB를 처음 상태로 되돌리고 싶으면 언제든 1 → 2 다시 실행

## 환경
- MySQL 8.0.16 이상 (CHECK 제약 동작), sql_mode에 STRICT_TRANS_TABLES 포함(기본값)
- 접속 정보 : host localhost / port 3306 / database delivery_app / user root
- 비밀번호는 각자 설정 (이 저장소에 올리지 않음)
