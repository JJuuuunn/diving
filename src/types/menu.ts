import { RouterName } from '@/mappings/enum';

/**
 * 서비스 메인 및 사이드바에서 사용하는 메뉴 아이템 인터페이스
 */
export interface MenuItem {
    title: string;    // 한글 명칭 (카드 표시용)
    label: string;    // 영문 명칭 (사이드바 표시용)
    desc?: string;    // 메뉴 설명
    icon: string;     // SVG raw string
    route: RouterName | string; // 이동할 라우트 이름
    active: boolean;  // 활성화 여부
}