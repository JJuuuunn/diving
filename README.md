# 🌊 FreeDiver (프리다이빙 올인원 플랫폼)

> **"프리다이버의 모든 기록과 훈련, 그리고 커뮤니티 경험을 하나로"**
> **FreeDiver**는 프리다이빙(Freediving) 라이프를 위해 설계된 고성능 클라이언트 중심의 모던 웹 플랫폼입니다.

---

## 📌 목차
- [1. 프로젝트 개요](#1-프로젝트-개요)
- [2. 핵심 기능 상세](#2-핵심-기능-상세)
  - [📸 인터랙티브 비주얼 로그북 (Logbook)](#-인터랙티브-비주얼-로그북-logbook)
  - [⏱️ 압네아 숨참기 트레이너 (Apnea Trainer)](#️-압네아-숨참기-트레이너-apnea-trainer)
  - [💰 다이빙 풀 & 트레이닝 정산기 (Settlement)](#-다이빙-풀--트레이닝-정산기-settlement)
  - [🧠 DPTI 프리다이버 성향 검사](#-dpti-프리다이버-성향-검사)
  - [🏆 대회 일정 & 캘린더 피드 (Competition)](#-대회-일정--캘린더-피드-competition)
  - [📚 프리다이빙 이론 퀴즈 & 오답노트 (Quiz)](#-프리다이빙-이론-퀴즈--오답노트-quiz)
  - [🏥 다이빙 전문 이비인후과 & 챔버 병원 찾기 (Medical Finder)](#-다이빙-전문-이비인후과--챔버-병원-찾기-medical-finder)
- [3. 기술 스택](#3-기술-스택)
- [4. 사전 요구사항 (Prerequisites)](#4-사전-요구사항-prerequisites)
- [5. 시작하기 (Getting Started)](#5-시작하기-getting-started)
- [6. 시스템 아키텍처 & 데이터 흐름](#6-시스템-아키텍처--데이터-흐름)
  - [디렉토리 구조](#디렉토리-구조)
  - [로컬 우선(Local-First) 데이터 저장소 스키마](#로컬-우선local-first-데이터-저장소-스키마)
  - [위젯 제스처 & 캡처 파이프라인](#위젯-제스처--캡처-파이프라인)
- [7. 환경 변수 및 외부 서비스 설정](#7-환경-변수-및-외부-서비스-설정)
- [8. 사용 가능한 스크립트 (Available Scripts)](#8-사용-가능한-스크립트-available-scripts)
- [9. 테스트 가이드 (Testing Guide)](#9-테스트-가이드-testing-guide)
- [10. 배포 가이드 (Deployment Guide)](#10-배포-가이드-deployment-guide)
  - [GitHub Pages 정적 배포](#github-pages-정적-배포)
  - [Vercel / Netlify / Nginx 배포](#vercel--netlify--nginx-배포)
- [11. 트러블슈팅 (Troubleshooting FAQ)](#11-트러블슈팅-troubleshooting-faq)
- [12. 개발 규칙 & 기여 가이드라인](#12-개발-규칙--기여-가이드라인)

---

## 1. 프로젝트 개요

FreeDiver는 **프리다이빙(Freediving) 전용 플랫폼**입니다.
스쿠버 다이빙(공기통/잔압 관리, 감압 정지 등)과 완전히 분리된 프리다이빙 고유의 생리학적 지표(무호흡 시간, 수심, 종목, 웨이트, 버디 세이프티, CO2/O2 내성 등)에 특화되어 있습니다.

### 주요 설계 철학
1. **Local-First & 프라이버시 최우선**: 개인 다이빙 기록, 전자 서명, 훈련 통계가 외부 중앙 서버에 저장되지 않고 사용자 브라우저 로컬 저장소에서 안전하게 관리됩니다.
2. **반응형 인터랙티브 비주얼**: SNS(인스타그램 스토리) 공유에 최적화된 9:16 포토 HUD 카드, 16:9 와이드 항공권 보딩패스, 스포츠 계기판 디자인을 지원하며, 핀치 줌/마우스 휠 줌 제스처를 제공합니다.
3. **오프라인 회복 탄력성**: 대회 일정 및 병원 정보는 Google Sheets API 기반으로 동작하며, 네트워크 장애 시에도 검증된 빌드타임 스냅샷을 통해 무중단 서빙됩니다.

---

## 2. 핵심 기능 상세

### 📸 인터랙티브 비주얼 로그북 (Logbook)
다이빙 기록을 인스타그램 스토리, 항공권, 스포츠 계기판 감성의 고해상도 그래픽 카드로 렌더링하고 편집합니다.
- **포토 HUD 카드 (9:16 비율)**:
  - 수중 사진 업로드 및 자동 가독성 오버레이 적용
  - **터치 & 휠 제스처 조작**:
    - **위젯 자유 이동**: 화면 내 위젯을 터치/드래그하여 원하는 위치로 배치
    - **모바일 핀치 줌 (Pinch-to-Zoom)**: 두 손가락으로 위젯을 벌리거나 오므려 실시간 크기 조절
    - **PC 마우스 휠 줌**: 마우스 휠 스크롤로 50% ~ 220% 크기 미세 조절
    - **중심점(`center`) 기준 확대/축소**: 크기 변경 시 위치 왜곡 없이 균형 유지
  - **4대 원클릭 레이아웃 프리셋**: 스포티 우측 정렬(`sporty-right`), 좌측 미니멀(`left-minimal`), 상단 히어로(`top-hero`), 균형 배치(`balanced`)
- **다이빙 보딩패스 카드 (16:9 비율)**:
  - 항공권 티켓 감성의 가로형 와이드 레이아웃 (출발지, 목표 수심, 게이트, 탑승 바코드, 버디 서명)
  - 최대 1280px 와이드 뷰포트 지원
- **스포츠 텔레메트리 & 클래식 저널 카드**:
  - 네온 디지털 컴퓨터 및 다이어리 스탬프 감성의 카드 뷰
- **버디 전자 서명**: HTML5 Canvas 기반의 세이프티 버디 즉석 전자 서명 및 다크모드 투명 잉크 반전 지원
- **초고해상도 무손실 캡처**: FHD(1920×1080) / 스토리(1080×1920) 규격 이미지 다운로드 및 공유 (`useCapture`)
- **데이터 관리**: AIDA 공인 8대 종목(`CWT`, `CWTB`, `CNF`, `FIM`, `STA`, `DYN`, `DYNB`, `DNF`) 필터링, 정렬, JSON 백업 및 복원

---

### ⏱️ 압네아 숨참기 트레이너 (Apnea Trainer)
AIDA 표준 프로토콜 기반의 인터벌 트레이닝 시스템입니다.
- **CO2 적응 테이블**: 숨참기 시간(Hold) 고정 + 휴식 시간(Rest) 라운드별 점진적 감소 (호흡 충동 극복)
- **O2 적응 테이블**: 휴식 시간(Rest) 고정 + 숨참기 시간(Hold) 라운드별 점진적 증가 (저산소 내성 강화)
- **Free Apnea (자유 스태틱)**: 스톱워치 기반의 개인 최고 기록(PB) 측정
- **Web Audio API 카운트다운**: 3, 2, 1 카운트다운 비프음 및 휴식/숨참기 전환 알림 사운드
- **Screen Wake Lock API**: 훈련 중 모바일 브라우저 화면 꺼짐 방지
- **훈련 통계 차트**: 훈련 이력 기록, 누적 훈련 시간 및 최고 기록 추이 시각화

---

### 💰 다이빙 풀 & 트레이닝 정산기 (Settlement)
다이빙 풀장 입장료, 장비 렌탈, 강습/버디비, 카풀/주차비를 투명하게 계산합니다.
- **3단계 마법사 프로세스**:
  1. `정산 내용 입력`: 기본 입장료 및 커스텀 추가 지출 항목(장비, 식비, 주차비 등) 설정
  2. `인원/계좌 설정`: 다이버별 면제/할인 토글 및 입금 계좌/카카오페이 링크 입력
  3. `정산 결과 생성`: 1인당 금액 계산, 맞춤 송금 딥링크 생성
- **간편 송금 연동**: 카카오페이 / 토스 송금 딥링크 즉시 연결
- **1초 원클릭 복사**: 단톡방 공유용 텍스트 메시지 클립보드 복사
- **영수증 이미지 캡처**: 정산 내역서 카드 이미지 저장

---

### 🧠 DPTI (프리다이버 성향 검사)
16문항의 검사를 통해 프리다이버의 성향 유형을 16가지로 분류합니다.
- **지표 분석**: 탐험형 vs 기록형, 감각파 vs 테크니컬파 등 4대 축 분석
- **맞춤 가이드**: 성향별 강점, 추천 훈련법, 주의해야 할 안전 수칙 제시
- **버디 케미스트리**: 찰떡궁합 버디 유형 추천 및 결과 카드 SNS 공유

---

### 🏆 대회 일정 & 캘린더 피드 (Competition)
국내외 AIDA 공인 프리다이빙 대회 일정을 실시간으로 집계하여 제공합니다.
- **상태별 필터**: 접수중, 예정, 종료 상태별 필터링 및 종목별 검색
- **캘린더 뷰**: 월간 달력 기반의 직관적인 대회 일정 탐색
- **관심 대회 북마크**: 로컬 저장소 기반 북마크 관리
- **AIDA 스크래퍼 & Google Sheets 동기화**: 자동 수집 스크립트 및 무중단 스냅샷 서빙

---

### 📚 프리다이빙 이론 퀴즈 & 오답노트 (Quiz)
AIDA, SSI, PADI 레벨별(초급/중급/고급) 물리학, 생리학, 안전 지식 문제은행을 제공합니다.
- **실전 퀴즈 모드**: 즉각적인 정답/해설 피드백
- **스마트 오답노트**: 틀린 문제를 자동으로 수집하여 취약점 집중 복습
- **학습 대시보드**: 정답률 통계 및 레벨별 마스터 진행도 확인

---

### 🏥 다이빙 전문 이비인후과 & 챔버 병원 찾기 (Medical Finder)
압착증(Barotrauma), 이퀄라이징 장애, 감압병(DCS) 치료가 가능한 전국 병원을 안내합니다.
- **카카오맵(Kakao Maps SDK) 연동**: 전국 다이빙 특화 이비인후과 및 고압산소 챔버 병원 위치 시각화
- **내 위치 기반 검색**: 반경 내 가까운 병원 정렬 및 카카오맵 길찾기 바로가기
- **의학 가이드 & 서식**: 다이빙 전 건강 검진 서식(Medical Questionnaire) 다운로드

---

## 3. 기술 스택

| 분류 | 기술 및 라이브러리 | 용도 |
| :--- | :--- | :--- |
| **Core Framework** | `Vue 3.5+` (Composition API, `<script setup>`) | 반응형 UI 컴포넌트 아키텍처 |
| **Language** | `TypeScript 5.9+` | 정적 타입 안전성 및 인터페이스 명세 |
| **Build & Bundler** | `Vite` (Rolldown 기반), `vue-tsc` | 고속 번들링, HMR, 타입 검사 |
| **State Management** | `Pinia 3.0+` | 전역 상태 관리 및 로컬 저장소 동기화 |
| **Routing** | `Vue Router 4.6+` | SPA 라우팅, 스크롤 복원, 히스토리 모드 |
| **Styling** | `SCSS (Sass)` | BEM 네이밍, CSS 변수 디자인 토큰, 다크 모드 |
| **Data Visualization** | `Chart.js 4.5+`, `vue-chartjs` | 압네아 훈련 추이 및 통계 시각화 |
| **Graphics & Capture** | `HTML5 Canvas`, `html-to-image` / `useCapture` | 카드 이미지 캡처, 버디 전자 서명 |
| **Browser Device APIs** | `Web Audio API`, `Screen Wake Lock API` | 타이머 비프 사운드, 모바일 화면 꺼짐 방지 |
| **Maps SDK** | `Kakao Maps API` | 전국 병원 위치 렌더링 및 길찾기 연동 |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert`) | 127개+ 고속 단위/통합 테스트 |

---

## 4. 사전 요구사항 (Prerequisites)

- **Node.js**: `v24.0.0` 이상 (Node.js 내장 테스트 러너 및 최신 모듈 해석 지원)
- **npm**: `v10.0.0` 이상
- **브라우저**: 최신 버전의 Chrome, Safari, Edge, Firefox (Pinch-to-zoom, PointerEvent, WakeLock 지원)

---

## 5. 시작하기 (Getting Started)

### 1. 저장소 복제 (Clone)
```bash
git clone https://github.com/JJuuuunn/diving.git
cd diving
```

### 2. 의존성 설치 (Install)
```bash
npm ci
```

### 3. 개발 서버 실행 (Local Dev Server)
```bash
npm run dev
```
브라우저에서 `http://localhost:5173/diving/` 접속 (Base path: `/diving/`)

---

## 6. 시스템 아키텍처 & 데이터 흐름

### 디렉토리 구조
```
diving/
├── .agents/                 # AI 어시스턴트 및 개발자 코딩 규칙
│   └── rules/               # 프론트엔드, 아키텍처, UI, 보안 규칙
├── docs/                    # 데이터 아키텍처, 디자인 토큰, 시트 연동 문서
├── public/                  # 정적 에셋 (이미지, 아이콘, 404.html)
├── scripts/                 # AIDA 대회 크롤러 & Google Sheets 동기화 스크립트
├── src/
│   ├── assets/              # SCSS 스타일시트, 폰트, 이미지
│   │   └── scss/
│   │       ├── abstracts/   # 색상 변수, 반응형 믹스인, z-index 토큰
│   │       ├── components/  # 공용 UI 컴포넌트 스타일
│   │       ├── layout/      # 헤더, 푸터, 사이드바 레이아웃
│   │       └── pages/       # 페이지별 전용 스타일 (_logbook.scss 등)
│   ├── components/          # 디자인 시스템 공용 UI 컴포넌트
│   │   ├── CustomButton.vue
│   │   ├── CustomInput.vue
│   │   ├── CustomSelect.vue
│   │   └── ...
│   ├── composables/         # 재사용 가능한 비즈니스 로직 (Hooks)
│   │   ├── useApneaTimer.ts # 압네아 인터벌 타이머
│   │   ├── useAudioBeep.ts  # Web Audio 비프 사운드
│   │   ├── useCapture.ts    # 고해상도 카드 캡처
│   │   ├── useHudDrag.ts    # HUD 위젯 제스처(드래그, 핀치, 휠)
│   │   └── useWakeLock.ts   # 화면 꺼짐 방지
│   ├── data/                # 기본 정적 데이터 (퀴즈 문제, 병원 스냅샷 등)
│   ├── mappings/            # 라우트 Enum, 메뉴 매핑
│   ├── router/              # Vue Router 설정
│   ├── stores/              # Pinia 상태 저장소 (logbook, apnea, quiz, etc.)
│   ├── types/               # TypeScript 인터페이스 & 타입 정의
│   ├── utils/               # 순수 유틸리티 함수 (날짜, 시간, 검증)
│   └── views/               # 페이지 뷰 컴포넌트
│       ├── apnea/           # 숨참기 트레이닝 뷰
│       ├── competition/     # 대회 일정 뷰
│       ├── dpti/            # 다이버 성향 검사 뷰
│       ├── logbook/         # 로그북 목록, 상세, 폼, 카드 컴포넌트
│       ├── medical/         # 병원 찾기 뷰
│       ├── quiz/            # 퀴즈 대시보드 및 플레이 뷰
│       └── settlement/      # 정산기 뷰
└── test/                    # Node.js 테스트 파일 (127개 테스트)
```

### 로컬 우선(Local-First) 데이터 저장소 스키마
모든 클라이언트 저장 키는 충돌 방지 및 마이그레이션을 위해 표준화된 접두사 네이밍 규칙(`diving:<domain>:<name>:<version>`)을 따릅니다:

| 스토리지 키 | 저장 위치 | 설명 |
| :--- | :--- | :--- |
| `diving:logbook:entries:v1` | `localStorage` | 프리다이빙 로그북 기록 목록 |
| `diving:apnea:records:v1` | `localStorage` | 압네아 훈련 세션 기록 및 최고 기록(PB) |
| `diving:quiz:wrong_notes:v1` | `localStorage` | 퀴즈 오답노트 수집 항목 |
| `diving:quiz:bookmarks:v1` | `localStorage` | 퀴즈 북마크 목록 |
| `diving:competition:bookmarks:v1` | `localStorage` | 관심 대회 북마크 |
| `diving:theme:mode:v1` | `localStorage` | 다크/라이트 테마 설정 |
| `diving:settlement:draft:v1` | `sessionStorage` | 작성 중인 정산서 임시 데이터 |

### 위젯 제스처 & 캡처 파이프라인
```
[사용자 입력 (Touch / Wheel / Pointer)]
               │
               ▼
   [useHudDrag Composable]
   ├─ 단일 터치/포인터 → 위치 X/Y % 계산 (경계값 2% ~ 88% 클램핑)
   ├─ 멀티 터치 (2개 이상) → Math.hypot 거리 비율로 Scale 계산 (0.5x ~ 2.2x)
   └─ 마우스 휠 → deltaY 기반 Scale 부드러운 스텝 증감
               │
               ▼
   [LogCardHud 렌더러] (transformOrigin: 'center center')
               │
               ▼
   [useCapture Composable]
   ├─ 카드 디자인 판별 (Ticket 16:9 / Story 9:16 / Classic 3:4)
   ├─ targetPixelRatio 계산 (FHD 1920x1080 무손실 스케일링)
   └─ Canvas 변환 및 Blob/PNG 다운로드 생성
```

---

## 7. 환경 변수 및 외부 서비스 설정

선택적으로 외부 서비스 연동이 필요한 경우 프로젝트 루트에 `.env.local` 파일을 생성하여 설정합니다:

| 변수명 | 필수 여부 | 기본값 | 설명 |
| :--- | :---: | :--- | :--- |
| `VITE_KAKAO_MAP_KEY` | 선택 | - | 카카오맵 지도 렌더링용 Javascript API 키 |
| `AIDA_CRAWLER_AUTH` | 선택 | - | AIDA 대회 일정 크롤러 자동 동기화용 인증 토큰 |

> **보안 주의사항**: `VITE_*` 환경 변수는 클라이언트 번들에 포함되므로 시크릿 키나 민감정보를 절대 커밋하지 마십시오.

---

## 8. 사용 가능한 스크립트 (Available Scripts)

```bash
# 개발 서버 시작 (포트: 5173, Base: /diving/)
npm run dev

# 전체 단위/통합 테스트 실행 (127개 테스트)
npm test

# TypeScript 타입 오류 검사 (빌드 없이 검증)
npm run typecheck

# 프로덕션 빌드 (dist/ 및 dist/404.html 생성)
npm run build

# 빌드 결과물 로컬 미리보기
npm run preview

# 대회 일정 Google Sheets 유효성 검증
npm run validate:competitions

# 대회 일정 동기화 실행
npm run sync:competitions

# AIDA 공식 대회 피드 스크래핑
npm run ingest:aida
```

---

## 9. 테스트 가이드 (Testing Guide)

본 프로젝트는 Node.js 내장 테스트 러너(`node:test`)를 사용하여 서드파티 의존성 없이 빠르고 안정적인 테스트를 수행합니다.

### 테스트 실행
```bash
# 전체 테스트 실행
npm test

# 특정 테스트 파일 실행
node --test test/logbook.test.mjs
node --test test/apnea.test.mjs
node --test test/hud-drag.test.mjs
```

### 테스트 커버리지 영역
- **`test/logbook.test.mjs`**: 로그북 날짜 검증, 종목별 유효성 검증, 구버전 데이터 마이그레이션
- **`test/hud-drag.test.mjs`**: HUD 레이아웃 초기화, 프리셋 적용, 핀치/휠 스케일 클램핑(0.5~2.2) 검증
- **`test/apnea.test.mjs`**: CO2/O2 테이블 라운드 생성 로직, 인터벌 계산 무결성
- **`test/custom-components.test.mjs`**: 접근성(ARIA), 키보드 탐색, 폼 컴포넌트 동작
- **`test/settlement.test.mjs`**: N분의 1 정산 공식, 커스텀 항목 지출 분배, 딥링크 포맷 검증

---

## 10. 배포 가이드 (Deployment Guide)

### GitHub Pages 정적 배포
본 프로젝트는 GitHub Pages에 정적으로 배포되도록 최적화되어 있습니다.
1. `vite.config.js`의 `base: '/diving/'` 설정
2. `npm run build` 시 `cp dist/index.html dist/404.html`이 자동으로 실행되어 새로고침 시 SPA 라우팅 404 이슈를 방지합니다.

### Vercel / Netlify / Nginx 배포
- **Vercel / Netlify**: 루트 `base`를 `/`로 변경하거나 리다이렉트 규칙(`/* -> /index.html 200`)을 적용합니다.
- **Nginx**:
```nginx
location /diving/ {
    alias /var/www/diving/dist/;
    try_files $uri $uri/ /diving/index.html;
}
```

---

## 11. 트러블슈팅 (Troubleshooting FAQ)

### Q1. 모바일에서 숨참기 훈련 중 화면이 자꾸 꺼집니다.
**원인**: 브라우저 절전 모드 또는 Wake Lock API 권한 문제입니다.
**해결**: FreeDiver는 `useWakeLock`을 통해 훈련 시작 시 자동으로 화면 유지를 요청합니다. Safari/Chrome 브라우저 설정에서 화면 자동 잠금 권한이 허용되어 있는지 확인하세요.

### Q2. 카드 캡처 이미지를 다운로드할 때 텍스트나 사진 위치가 어긋납니다.
**원인**: 외부 이미지 CORS 이슈 또는 렌더링 타이밍 문제입니다.
**해결**: `useCapture.ts`는 대상 카드의 실제 aspect-ratio(16:9 / 9:16 / 3:4)를 자동 감지하여 가상 캔버스에 1920px 정밀 스케일링을 수행합니다. 수중 사진 업로드 시 브라우저 로컬 DataURL/Blob으로 처리되어 외부 CORS 간섭 없이 완벽히 캡처됩니다.

### Q3. 카카오맵 지도가 화면에 나오지 않습니다.
**원인**: 카카오 개발자 콘솔의 사이트 도메인 미등록 또는 API 키 문제입니다.
**해결**: 로컬 개발 시 `http://localhost:5173`을 카카오 개발자 플랫폼 웹 도메인 목록에 등록해야 지도가 정상 로드됩니다.

---

## 12. 개발 규칙 & 기여 가이드라인

- **프리다이빙 전용 플랫폼 원칙**: 스쿠버 다이빙 기능(잔압/공기탱크, WRSTC 스쿠버 서식 등)은 배제합니다.
- **공용 UI 컴포넌트 필수 사용**: 일반 `<button>`, `<input>` 대신 디자인 시스템 컴포넌트(`CustomButton`, `CustomInput`, `CustomSelect` 등)를 사용합니다.
- **검증 4단계 준수**: 모든 코드 커밋 전 아래 4단계를 통과해야 합니다.
  ```bash
  npm test && npm run typecheck && npm run build && git diff --check
  ```

---

<div align="center">
  <sub>Designed with 💙 for All Freedivers around the World.</sub>
</div>
