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
