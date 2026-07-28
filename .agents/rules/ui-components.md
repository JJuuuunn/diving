# UI Components and Accessibility

## 언제 읽는가

버튼, 입력, 셀렉트, 모달, skeleton, toast 또는 공용 스타일을 변경할 때 읽는다.

## 필수 규칙

- 운영 화면의 버튼은 `CustomButton`을 사용한다.
- text, search, email, tel, password, number 계열은 목적에 맞는
  `CustomInput` 또는 `CustomNumberInput`을 사용한다.
- select, textarea, switch, date는 기존 `Custom*` 컴포넌트를 우선 사용한다.
- 공용 컴포넌트는 HTML 속성, class, 이벤트, `v-model`을 예측 가능하게 전달한다.
- 비동기 액션은 loading과 disabled를 제공하고 중복 실행을 막는다.
- 오류 입력은 `aria-invalid`와 연결된 오류 설명을 제공한다.
- 아이콘만 있는 버튼에는 `aria-label`을 제공한다.
- 모든 조작은 키보드로 가능해야 하며 focus 표시를 제거하지 않는다.
- 비동기 상태는 `role="status"`, 오류는 필요한 경우 `role="alert"`로 알린다.
- 애니메이션은 `prefers-reduced-motion`을 고려한다.
- 공용 컴포넌트에 특정 페이지의 업무명이나 페이지 전용 스타일을 넣지 않는다.
- 색상을 추가하거나 변경할 때는 [컬러 시스템](../../docs/color-system.md)의 의미
  토큰을 사용하고, 상태를 색상만으로 전달하지 않는다.
- 배경색과 글자색은 같은 의미 토큰의 `-bg`, `-text` 쌍으로 적용한다. 밝은 배경에
  상속된 다크모드 글자색이 올라가지 않도록 한쪽만 지정하지 않는다.
- 기능 추가와 리팩터링을 완료하기 전에 라이트·다크 모드에서 본문, 보조 문구,
  상태 라벨, disabled, hover, focus 대비를 함께 점검한다.

## 허용 예외

- checkbox, radio, file, color 같은 고유 의미의 input은 네이티브 사용이 가능하다.
- 공용 UI 컴포넌트 내부 구현은 네이티브 HTML 요소를 사용한다.
- canvas나 지도 SDK가 요구하는 DOM은 전용 컴포넌트/Composable 내부에서 사용한다.
- 값에 따라 변하는 너비·좌표 같은 동적 style binding은 허용하되 정적 style은
  SCSS로 이동한다.

## 공용 컴포넌트 변경 조건

- disabled, loading, error, keyboard, ARIA 동작의 회귀 테스트를 추가한다.
- 기존 class와 속성 전달을 깨는 wrapper 추가를 피한다.
- breaking prop/event 변경은 모든 사용처를 함께 수정한다.

## UI 렌더링 검증

- UI 컴포넌트, 스타일, 반응형 레이아웃을 변경하면 코드 검사뿐 아니라 실제 화면을
  렌더링해 확인한다.
- 데스크톱과 모바일, 라이트모드와 다크모드를 모두 확인한다.
- 기본, hover, focus, active, disabled 상태를 확인한다.
- 긴 텍스트, 빈 데이터, 최대 데이터에서 줄바꿈, overflow, z-index와 팝업 겹침을
  확인한다.
- 키보드 조작과 focus 표시를 확인한다.
- 공용 컴포넌트는 Playground와 실제 사용 화면을 모두 확인한다.
- 브라우저나 렌더링 도구를 사용할 수 없으면 확인했다고 간주하지 않고, 확인하지
  못한 화면과 사유를 최종 보고에 명시한다.

## 검증

```bash
rg -n '<button\b|<input[^>]+type="(text|search|email|tel|password|number)"' \
  src/views src/layouts src/App.vue --glob '*.vue'
npm test
npm run typecheck
```
