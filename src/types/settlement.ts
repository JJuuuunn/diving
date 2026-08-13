// 다이빙 풀 정보 타입
export interface PoolInfo {
    name: string;
    weekday: number;
    weekend: number;
}

// 확장 모듈 종류 타입
export type SettlementExtensionType = 'base' | 'pool' | 'carpool' | 'meal' | 'tank' | 'custom';

// 확장 모듈 항목 인터페이스
export interface SettlementExtensionItem {
    id: string;
    type: SettlementExtensionType;
    title: string;
    amount: number;
    active: boolean;
    targetPersonIds?: number[];
    driverId?: number;
    excludeDriver?: boolean;
    poolKey?: string;
    dayType?: 'weekday' | 'weekend';
    basePriceStr?: string;
}

// 부가 정산 항목 (카카오 1/N 정산 방식)
export interface ExtraExpenseItem {
    id: string;
    name: string;
    amount: number;
}

// 부가 비용 타입 (하위 호환성 유지)
export interface ExtraCosts {
    carpoolFee?: number;
    extraTankFee?: number;
    mealFee?: number;
}

// 참여 인원 정보 타입
export interface Person {
    id: number;
    name: string;
    isBooker: boolean;
    isMember: boolean;
    prepaid: number;
    bank: string;
    account: string;
    myCost?: number;  // 정산 후 개별 부담금
    balance?: number; // 정산 후 차액 (받을 돈/줄 돈)
    isPaid?: boolean; // 송금 완료/미송금 체크리스트 필드
}

// 송금 내역 타입
export interface Settlement {
    from: string;
    to: string;
    amount: number;
    bank: string;
    account: string;
}

// 전체 설정 상태 타입
export interface SettlementSettings {
    currentDayType: 'weekday' | 'weekend';
    selectedPool: string;
    basePrice: string;
    baseSimpleAmount?: number;
    activeModules?: Record<string, boolean>;
    carpoolDetails?: {
        driverId?: number;
        excludeDriver?: boolean;
        amount?: number;
    };
    mealDetails?: {
        amount?: number;
        participantIds?: number[];
    };
    tankDetails?: {
        count?: number;
        pricePerTank?: number;
        amount?: number;
    };
    activeExtensions?: SettlementExtensionItem[];
    extraCosts?: ExtraCosts;
    customExpenses?: ExtraExpenseItem[];
}

export interface StructuredSettlementData {
  v: number;
  pool: string;
  price: number;
  dayType: 'weekday' | 'weekend';
  people: {
    n: string;
    b: boolean;
    m: boolean;
    p: number;
    bk: string;
    ac: string;
  }[];
}

// 정산 히스토리 아이템 타입
export interface SettlementHistoryItem {
  id: string;
  createdAt: string;
  title: string;
  settings: SettlementSettings;
  people: Person[];
  results: {
    memberCostDisplay: string;
    nonMemberCostDisplay: string;
    settlementList: Settlement[];
    detailTableBody: Person[];
  };
  globalResultText: string;
}
