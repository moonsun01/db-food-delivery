# 배달앱 백엔드

Node.js · Express · MySQL 기반 배달앱 백엔드입니다. API 명세서 v0.5의 36개 API를 구현했습니다.

- [설치·실행·MySQL 연결](backend/README.md)
- [API 요청·응답 명세](backend/docs/api.md)
- [JSON 형식 API 목록](backend/docs/api-contract.json)
- [최종 테이블과 API 필드 대응](backend/docs/erd-mapping.md)

Windows PowerShell에서 `backend` 폴더로 이동한 뒤 실행합니다.

```powershell
cd backend
npm.cmd ci
npm.cmd run dev:setup
npm.cmd start
```

서버 확인: http://localhost:4000/api/health

처음에는 DB 없이 확인할 수 있는 JSON 모드로 실행됩니다. 실제 MySQL 저장은 backend/README.md의 설정을 적용합니다. DB 생성·시연 데이터 SQL은 팀 저장소의 `db` 브랜치, 화면 코드는 `front` 브랜치에서 관리합니다.
