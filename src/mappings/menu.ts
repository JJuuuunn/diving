import type { MenuItem } from '@/types/menu';
import { RouterName } from '@/mappings/enum';
import homeIcon from '@/assets/icons/home.svg?raw';
import calculatorIcon from '@/assets/icons/calculator.svg?raw';
import bookIcon from '@/assets/icons/book.svg?raw';
import divingMaskIcon from '@/assets/icons/diving-mask.svg?raw';
import hospitalIcon from '@/assets/icons/hospital.svg?raw';
import calendarIcon from '@/assets/icons/calendar.svg?raw';

// 1. 기본 메뉴 아이템 정의 (Playground 포함)
const ALL_MENU_ITEMS: MenuItem[] = [
    {
        title: '홈',
        label: 'Home',
        desc: '작업실 메인으로 돌아가기',
        icon: homeIcon,
        route: RouterName.Main,
        active: true,
    },
    {
        title: '정산 요정',
        label: 'Settlement',
        desc: '풀장 입장료 & 투어비 정산하기',
        icon: calculatorIcon,
        route: RouterName.Settlement,
        active: true,
    },
    {
        title: '다이빙 성향 찾기',
        label: 'DPTI',
        desc: '다이빙 성향 테스트로 나에게 맞는 다이빙 스타일 찾기',
        icon: bookIcon,
        route: RouterName.Dpti,
        active: true,
    },
    {
        title: '다이빙 로그북',
        label: 'Logbook',
        desc: '나의 다이빙 기록을 기록하고 공유하기',
        icon: bookIcon,
        route: RouterName.Logbook,
        active: true,
    },
    {
        title: '다이빙 문제 은행',
        label: 'Quiz',
        desc: '다이빙 물리, 생리 및 특수기체 이론 퀴즈 도전하기',
        icon: bookIcon,
        route: RouterName.QuizDashboard,
        active: true,
    },
    {
        title: '프리다이빙 대회 일정',
        label: 'Competition',
        desc: '국내외 프리다이빙 대회 일정 및 공식 접수 정보 확인하기',
        icon: calendarIcon,
        route: RouterName.Competition,
        active: true,
    },
    {
        title: '메디컬 스탬프 파인더',
        label: 'Medical',
        desc: '대회 참가에 필수적인 메디컬 스탬프 발급 병원 찾기 (내 주변 정렬)',
        icon: hospitalIcon,
        route: RouterName.MedicalFinder,
        active: true,
    },
    {
        title: '스태틱 앱니아 트레이너',
        label: 'Apnea',
        desc: 'CO₂/O₂ 훈련 테이블 생성 및 숨참기 측정 타이머',
        icon: divingMaskIcon,
        route: RouterName.Apnea,
        active: true,
    },
    {
        title: '컴포넌트 플레이그라운드',
        label: 'Playground',
        desc: '커스텀 컴포넌트, 지도 SDK, UI 인터랙션 통합 테스트 공간',
        icon: divingMaskIcon,
        route: RouterName.ComponentPlayground,
        active: true, // 하단 filter에서 개발모드가 아니면 걸러집니다.
    },
    {
        title: '아이디어 로그',
        label: 'Ideas',
        desc: '새로운 기능 구상 중...',
        icon: divingMaskIcon,
        route: '',
        active: false,
    }
];

// 2. 개발 모드(npm run dev)인지 확인
// Vite 프로젝트 기준: import.meta.env.DEV는 개발 모드일 때 true, 배포 빌드 시 false가 됩니다.
const isDev = import.meta.env.DEV;

// 3. 배포 환경일 경우 Playground 메뉴를 제외하고 export
export const MENU_ITEMS: MenuItem[] = ALL_MENU_ITEMS.filter((item) => {
    if (item.route === RouterName.ComponentPlayground) {
        return isDev; // 개발 모드일 때만 포함
    }
    return true; // 다른 메뉴는 항상 포함
});