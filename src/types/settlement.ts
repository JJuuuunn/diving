// 다이빙 풀 정보 타입
export interface PoolInfo {
    name: string;
    weekday: number;
    weekend: number;
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
