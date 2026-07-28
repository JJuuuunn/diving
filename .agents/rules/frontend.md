---
trigger: always_on
---

# Frontend Rule Index

이 파일은 항상 적용되는 최소 규칙과 상세 규칙의 라우터다. 작업을 시작하기 전에
변경 범위에 해당하는 문서를 읽고 따른다.

## 변경 범위별 필수 문서

- Vue, Pinia, Composable, 타입, 파일 배치:
  [architecture.md](./architecture.md)
- Google Sheets, Pinia 영속화, 브라우저 저장소, 캐시:
  [data-persistence.md](./data-persistence.md)
- 버튼, 입력, 모달, 스타일, 접근성:
  [ui-components.md](./ui-components.md)
- HTTP 요청, Apps Script, 외부 응답, 비동기 상태:
  [api-and-validation.md](./api-and-validation.md)
- 사용자 입력, 외부 링크, HTML, CSV, 환경변수:
  [security.md](./security.md)
- 라우트, URL, base path, 정적 배포:
  [routing-and-deployment.md](./routing-and-deployment.md)
- 모든 코드 변경:
  [testing.md](./testing.md)

## 항상 적용되는 최소 규칙

- Vue 화면과 Pinia Store에서 `fetch`를 직접 호출하지 않는다.
- 외부 데이터는 런타임 검증을 통과한 뒤 사용한다.
- 운영 화면의 버튼과 text 계열 input은 공용 UI 컴포넌트를 사용한다.
- 비밀정보와 민감정보를 브라우저 저장소, 공개 Sheet, `VITE_*`에 저장하지 않는다.
- 변경 후 최소 `npm test`, `npm run typecheck`, `npm run build`,
  `git diff --check`를 통과한다.

상세한 설계 배경과 운영 설명은 [데이터 아키텍처](../../docs/data-architecture.md)
같은 `docs/` 문서를 참고한다. `.agents/rules/`에는 실행 가능한 규칙만 둔다.
