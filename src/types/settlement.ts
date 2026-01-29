interface Person {
    id: number;
    name: string;
    isBooker: boolean;
    isMember: boolean;
    prepaid: number;
    bank: string;
    account: string;
    myCost?: number;
    balance?: number;
}

interface PoolInfo {
    name: string;
    weekday: number;
    weekend: number;
}

type PoolPrices = Record<string, PoolInfo>;

interface Settlement {
    from: string;
    to: string;
    amount: number;
    bank: string;
    account: string;
}