# Frontend Security

## 언제 읽는가

사용자/Sheet 입력, HTML 생성, 외부 링크, URL 파라미터, CSV 다운로드,
환경변수 또는 운영 화면을 변경할 때 읽는다.

## 필수 규칙

- Sheet, Apps Script, URL, 브라우저 저장소, 사용자 입력은 모두 비신뢰 데이터다.
- 문자열을 `innerHTML`, 인라인 `onclick`, 동적 HTML 문자열에 삽입하지 않는다.
- 텍스트는 Vue interpolation 또는 DOM `textContent`로 렌더링한다.
- `v-html`은 빌드에 포함된 신뢰 가능한 정적 SVG 등 검토된 값에만 사용한다.
- `VITE_*` 환경변수는 브라우저 번들에 공개된다고 간주한다.
- 비밀번호, 관리자 키, 인증 토큰, 민감정보를 `VITE_*`, Sheet,
  브라우저 저장소에 넣지 않는다.
- 외부 새 창 링크는 `rel="noopener noreferrer"`를 사용한다.
- URL 파라미터와 router state는 타입·허용값을 검증한다.
- 숨겨진 URL이나 `noindex`는 인증 또는 접근 제어가 아니다.
- CSV 셀 값이 `=`, `+`, `-`, `@`로 시작하면 formula 실행을 막도록 escape한다.
- 오류 로그에 원본 개인정보나 전체 외부 응답을 남기지 않는다.

## 허용 예외

- 저장소에 포함된 정적 SVG를 `?raw`로 import해 `v-html`로 표시할 수 있다.
- 공개 읽기 전용 Apps Script URL은 노출될 수 있지만 쓰기 권한과 관리자 권한은
  URL의 은닉성에 의존하면 안 된다.

## 검증

```bash
rg -n 'innerHTML|onclick=|v-html|document\.cookie|VITE_' src
rg -n 'target="_blank"' src --glob '*.vue'
npm test
```
