# Architecture

## 언제 읽는가

Vue 화면, Pinia Store, Composable, API, 타입 또는 파일 구조를 변경할 때 읽는다.

## 필수 규칙

- 기본 의존 방향은 `Vue → Composable/Store → API → Types`다.
- Vue 컴포넌트는 UI 조합, 바인딩, 화면 이벤트 연결을 담당한다.
- 계산, 필터, 변환, 비동기 흐름은 Composable 또는 순수 utility로 분리한다.
- 여러 화면이 공유하거나 영속화해야 하는 상태는 Pinia Store에 둔다.
- HTTP 요청은 `src/api/`에만 둔다.
- 재사용되는 인터페이스와 도메인 타입은 `src/types/`에 둔다.
- 순수 파싱, 검증, 직렬화는 `src/utils/`에 둔다.
- 하위 계층은 Vue 컴포넌트나 화면 파일을 import하지 않는다.
- 기능 파일명은 `useFeature.ts`, `featureApi.ts`, `PascalCase.vue` 형식을 따른다.
- boolean 이름은 가능하면 `is`, `has`, `can`, `should`로 시작한다.
- **도메인 범위**: 본 프로젝트의 핵심 도메인은 프리다이빙(Freediving)이며, 스쿠버 다이빙 기능은 배제한다 (추후 확장 시에도 퀴즈 문제은행으로만 한정).

## Store와 Composable 구분

- Store: 여러 화면에서 공유되는 상태, 영속화 상태, 전역 상태 전이
- Composable: 한 기능의 계산, UI 독립 비동기 흐름, 재사용 가능한 반응형 로직
- Utility: Vue 반응성이 필요 없는 순수 함수

## 허용 예외

- 한 컴포넌트에서만 쓰이는 단순 `computed`와 이벤트 위임은 컴포넌트에 둘 수 있다.
- DOM API가 필요한 캔버스, 지도, focus 처리는 전용 Composable에 둘 수 있다.
- API 응답 전용 타입도 재사용되거나 도메인 의미가 있으면 `src/types/`에 둔다.

## 검증

```bash
rg -n '\bfetch\(' src --glob '!src/api/**'
rg -n '^interface |^type [A-Z]' src --glob '*.vue'
npm run typecheck
```
