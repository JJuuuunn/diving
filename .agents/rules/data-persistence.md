# Data Persistence

## 언제 읽는가

Google Sheets, Pinia, 캐시, 히스토리, 설정, `localStorage`,
`sessionStorage`, 쿠키를 변경할 때 읽는다.

## 저장 위치 선택

- 사용자 간 공유 운영 데이터: Google Sheets + Google Apps Script
- 브라우저 재시작 후에도 유지할 비민감 개인 데이터: `localStorage` 또는 `useStorage`
- 현재 탭 흐름에만 필요한 임시 데이터: `sessionStorage`
- 원격 장애 대응 읽기 전용 데이터: 검증된 정적 JSON 또는 검증된 캐시

Pinia는 반응형 상태만 제공한다. 영속화는 Store 또는 Composable에서 명시적으로
브라우저 저장소와 동기화한다.

## 필수 규칙

- 공유 데이터의 원본은 Google Sheets다.
- 브라우저 저장소는 비민감 기기 로컬 기록과 설정에만 사용한다.
- 저장 키는 `diving:<feature>:<data>:v<schema>` 형식을 우선한다.
- 기존 키가 있다면 즉시 이름을 바꾸지 말고 마이그레이션을 제공한다.
- JSON 파싱 결과는 검증하고, 손상된 데이터는 안전하게 초기화하거나 복구한다.
- 저장 구조 변경 시 버전, 마이그레이션 또는 명시적 reset 전략을 둔다.
- 저장소 접근 거부와 용량 초과가 핵심 화면을 중단시키지 않게 처리한다.
- 캐시는 TTL, 강제 새로고침, fallback 우선순위를 정의한다.
- 브라우저 저장 데이터가 다른 기기로 동기화되거나 백업된다고 표현하지 않는다.
- 현재 쿠키는 사용하지 않는다. 서버 호환 요구가 명확할 때만 도입을 검토한다.

## Google Sheets 중단 기준

다음 요구가 생기면 Sheets를 확장하지 않고 별도 백엔드를 검토한다.

- 인증 또는 역할 기반 권한
- 결제, 원자적 트랜잭션, 강한 무결성
- 민감한 의료·개인정보
- 감사 로그 위변조 방지
- 높은 요청량, 관계형 조회, 복잡한 검색

## 허용 예외

- 지도 호출 횟수처럼 보안 판단에 사용하지 않는 기기 로컬 제한은
  `localStorage`에 둘 수 있다.
- 화면 간 일회성 전달은 URL이나 Pinia보다 `sessionStorage`가 단순할 수 있다.

## 검증

```bash
rg -n 'localStorage|sessionStorage|useStorage|document\.cookie' src
npm test
```

설계 배경은 [데이터 아키텍처](../../docs/data-architecture.md)를 참고한다.
