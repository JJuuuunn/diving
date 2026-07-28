# Diving

Vue 3 기반 다이빙 도구 모음입니다.

## 개발

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

국내 AIDA 대회 일정은 로컬 수집 명령 또는 Google Sheets 직접 입력으로 관리합니다. 화면은 읽기 전용 API에서 최신 목록을 조회하며, 장애 시 검증된 정적 스냅샷을 사용합니다. 읽기 전용 수집 현황은 일반 메뉴에 노출되지 않는 `/ops/aida-sync-history`에서 확인할 수 있습니다. 설정 및 운영 방법은 [대회 일정 Google Sheets 운영](docs/competition-sheets.md)을 참고하세요.

이 프로젝트는 별도 백엔드 서버 없이 정적으로 배포됩니다. Medical과
Competition처럼 사용자 간 공유가 필요한 데이터는 Google Sheets와 Google Apps
Script를 사용하고, 개인 히스토리와 설정은 Pinia 상태를 `localStorage` 또는
`sessionStorage`와 명시적으로 동기화합니다. 현재 쿠키는 사용하지 않습니다.
저장 위치 선택, 보안 한계 및 백엔드 도입 기준은
[데이터 아키텍처](docs/data-architecture.md)를 참고하세요.

## 개발 규칙

공통 개발 규칙은 [Frontend Rule Index](.agents/rules/frontend.md)에서 변경 범위별
상세 문서로 안내합니다. 코드 변경은 테스트, 타입 검사, 프로덕션 빌드와
`git diff --check` 통과를 완료 조건으로 합니다.
