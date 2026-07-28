# Routing and Static Deployment

## 언제 읽는가

라우트, 링크, asset URL, 환경변수, Vite 설정 또는 배포 방식을 변경할 때 읽는다.

## 필수 규칙

- 이 앱은 `/diving/` 하위 경로에 정적으로 배포된다.
- Vite `base`와 Vue Router history base를 일치시킨다.
- asset과 내부 URL을 루트 `/` 기준 문자열로 임의 조립하지 않는다.
- 가능한 경우 router API와 `import.meta.env.BASE_URL`을 사용한다.
- 새 라우트는 `RouterName`에 이름을 추가하고 lazy import를 사용한다.
- 동적 route parameter와 query는 허용값을 검증한다.
- 개발 도구와 playground 라우트는 `import.meta.env.DEV`에서만 등록한다.
- 정적 호스팅의 직접 진입을 위해 빌드 시 `404.html` fallback을 유지한다.
- 배포 환경의 `VITE_*` 값은 공개 설정이며 비밀정보가 아니다.

## 변경 시 확인

- 앱 내부 이동과 브라우저 새로고침이 모두 동작하는지 확인한다.
- `/diving/`이 중복되거나 빠진 URL이 없는지 확인한다.
- 존재하지 않는 경로가 NotFound 또는 정적 fallback으로 처리되는지 확인한다.
- 개발 전용 라우트가 프로덕션 번들에서 접근되지 않는지 확인한다.

## 허용 예외

- 공식 외부 링크는 router를 사용하지 않는다.
- 다운로드 Blob URL과 지도 SDK URL은 각 전용 경계에서 생성할 수 있다.

## 검증

```bash
npm run build
rg -n "createWebHistory|base:|BASE_URL|import\.meta\.env\.DEV" src vite.config.js
```
