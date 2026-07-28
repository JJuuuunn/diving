# AIDA 대회 일정 Google Sheets 운영

AIDA 국내 대회는 다음 두 가지 방법으로 관리합니다.

1. 로컬에서 수집 명령을 직접 실행
2. Google Sheets의 `Competitions` 탭에 직접 입력

GitHub Actions는 AIDA를 크롤링하지 않습니다. `main` 브랜치 push 또는 수동 실행 시 시트 데이터를 정적 스냅샷으로 동기화하고 사이트를 배포하는 역할만 담당합니다.

## 최초 설정

1. Google Sheets를 만들고 `확장 프로그램 → Apps Script`를 엽니다.
2. `scripts/google-apps-script/Code.gs`를 Apps Script 편집기에 붙여 넣습니다.
3. 독립형 스크립트라면 프로젝트 속성에 `COMPETITION_SPREADSHEET_ID`를 등록합니다. 시트에 연결된 스크립트라면 생략할 수 있습니다.
4. 충분히 긴 임의 문자열을 Apps Script 프로젝트 속성 `COMPETITION_INGEST_SECRET`에 등록합니다.
5. `initializeCompetitionSheets`를 한 번 실행해 권한을 승인합니다.
6. 실행 사용자를 본인, 액세스 사용자를 `Anyone`으로 지정해 웹 앱을 배포합니다.
7. 배포 URL을 로컬 `.env.local`과 GitHub Secret의 `VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL`에 등록합니다.
8. 4번의 문자열을 로컬 `.env.local`의 `COMPETITION_INGEST_SECRET`에도 등록합니다. 이 값은 GitHub Actions에는 필요하지 않습니다.
9. Apps Script 코드를 변경할 때마다 웹 앱을 새 버전으로 다시 배포합니다.

기존 `scheduledAidaCompetitionSync` Apps Script 트리거가 있다면 삭제합니다.

## 로컬 수동 수집

```bash
npm run ingest:aida
```

명령을 실행한 시점에만 AIDA 페이지를 읽고 Apps Script의 보호된 `doPost`로 전송합니다. 성공하면 `Competitions`, `CrawlLogs`, `CrawlState`가 함께 갱신됩니다.
이 명령은 프로젝트 루트의 `.env.local`을 자동으로 읽습니다.

로컬 수집기는 AIDA 달력에서 대한민국 필터를 선택하고 올해·내년의 모든 페이지를 순회합니다. 이 전체 결과를 기준으로 신규·변경 대회를 반영하고 더 이상 확인되지 않는 기존 대회는 비활성화합니다.

필요한 로컬 환경변수:

```env
VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/.../exec
COMPETITION_INGEST_SECRET=충분히-긴-임의-문자열
```

## 시트 직접 입력

`Competitions` 탭에 행을 직접 추가할 때 다음 필드는 반드시 입력합니다.

```text
id                AIDA-5166
source            AIDA
sourceEventId     5166
title             공식 대회명
federation        AIDA
type              pool | depth | mixed | unknown
startDate         YYYY-MM-DD
endDate           YYYY-MM-DD
countryCode       KR
registrationStatus open | closed | unknown
officialUrl       AIDA 공식 상세 페이지 URL
sourceUrl         https://www.aidainternational.org/Events/
status            published
verifiedAt        YYYY-MM-DD
isActive          TRUE
```

`contentHash`, `firstSeenAt`, `lastSeenAt`, `updatedAt`은 직접 입력 방식에서는 비워도 됩니다. 이후 로컬 수집에서 같은 `AIDA-{eventId}`가 발견되면 자동으로 채워집니다.

시트에 직접 입력한 작업은 크롤링 실행이 아니므로 `CrawlLogs`와 `CrawlState`에는 기록되지 않습니다.

## 시트 구성

- `Competitions`: 대회 데이터와 활성 상태
- `CrawlLogs`: 로컬 수집 명령의 실행 이력
- `CrawlState`: 마지막 로컬 수집 상태

대회 기본 키는 `AIDA-{eventId}`입니다. 예를 들어 AIDA 이벤트 ID가 `5166`이면 `AIDA-5166`으로 저장합니다.

## API

```text
GET /exec?action=competitions
GET /exec?action=competition&id=AIDA-5166
GET /exec?action=crawl-status
GET /exec?action=crawl-history&limit=30
```

`doPost`는 로컬 수집 결과 적재 전용이며 `COMPETITION_INGEST_SECRET`을 검증합니다. 이 비밀값은 `VITE_` 환경변수로 만들거나 브라우저로 전달하지 않습니다.

## 사이트 반영

대회 화면은 공개 API에서 최신 데이터를 바로 조회합니다. `main` 브랜치 push 또는 `workflow_dispatch`가 실행되면 배포 직전에 시트 데이터를 `src/data/competition-feed.json`으로 내려받아 API 장애 시 사용할 스냅샷을 빌드 결과에 포함합니다. 이 JSON 변경은 저장소에 봇 커밋하지 않습니다.

```bash
npm run validate:competitions
VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL="https://script.google.com/macros/s/.../exec" npm run sync:competitions
```
