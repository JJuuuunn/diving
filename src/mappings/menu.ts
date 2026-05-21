import type { MenuItem } from '@/types/menu';
import { RouterName } from '@/mappings/enum';
import homeIcon from '@/assets/icons/home.svg?raw';
import calculatorIcon from '@/assets/icons/calculator.svg?raw';
import bookIcon from '@/assets/icons/book.svg?raw';
import divingMaskIcon from '@/assets/icons/diving-mask.svg?raw';

export const MENU_ITEMS: MenuItem[] = [
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
        title: '아이디어 로그',
        label: 'Ideas',
        desc: '새로운 기능 구상 중...',
        icon: divingMaskIcon,
        route: '',
        active: false,
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