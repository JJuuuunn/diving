import type { Person } from '@/types/settlement';

// 구조화된 최신 스키마 타입
interface StructuredSettlementData {
  v: number;       // 스키마 버전 (예: 2)
  pool: string;    // 풀장 식별자
  price: number;   // 입장료
  dayType: 'weekday' | 'weekend';
  people: {
    n: string;     // name
    b: boolean;    // isBooker
    m: boolean;    // isMember
    p: number;     // prepaid
    bk: string;    // bank
    ac: string;    // account
  }[];
}

/**
 * 정산 데이터를 압축된 Base64 객체 문자열로 내보냅니다. (버전 2 객체형)
 */
export function serializeSettlement(
  pool: string,
  price: number,
  people: Person[],
  dayType: 'weekday' | 'weekend'
): string {
  try {
    const data: StructuredSettlementData = {
      v: 2,
      pool,
      price,
      dayType,
      people: people.map(p => ({
        n: p.name,
        b: p.isBooker,
        m: p.isMember,
        p: p.prepaid,
        bk: p.bank,
        ac: p.account
      }))
    };
    const jsonString = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error("Failed to serialize settlement data:", error);
    return "";
  }
}

/**
 * URL 인코딩 문자열로부터 정산 데이터를 복구합니다.
 * 레거시 버전 1(배열 튜플) 및 최신 버전 2(구조화 객체) 형태를 자동 판별하여 하위 호환 복구를 완벽 지원합니다.
 */
export function deserializeSettlement(encodedData: string): {
  pool: string;
  price: number;
  people: Person[];
  dayType: 'weekday' | 'weekend';
} | null {
  try {
    const decodedJson = decodeURIComponent(atob(encodedData));
    const rawData = JSON.parse(decodedJson);
    
    if (!rawData || typeof rawData !== 'object') {
      throw new Error("Invalid format");
    }

    // --- CASE 1: 최신 구조화 객체 스키마 (버전 2) ---
    if (!Array.isArray(rawData) && rawData.v === 2) {
      const data = rawData as StructuredSettlementData;
      
      // 인원 데이터 안정성 검증 가드
      const peopleList: Person[] = Array.isArray(data.people)
        ? data.people.map((p, idx) => ({
            id: idx + Date.now(),
            name: String(p.n || `참석자 ${idx + 1}`),
            isBooker: Boolean(p.b),
            isMember: Boolean(p.m),
            prepaid: Number(p.p) || 0,
            bank: String(p.bk || '선택 안함'),
            account: String(p.ac || '')
          }))
        : [];

      return {
        pool: String(data.pool || 'custom'),
        price: Number(data.price) || 0,
        dayType: data.dayType === 'weekend' ? 'weekend' : 'weekday',
        people: peopleList
      };
    }

    // --- CASE 2: 레거시 배열 튜플 스키마 (버전 1) ---
    if (Array.isArray(rawData)) {
      const [pool, price, peopleArr, dayType] = rawData;
      
      const peopleList: Person[] = Array.isArray(peopleArr)
        ? peopleArr.map((p, idx) => ({
            id: idx + Date.now(),
            name: String(p[0] || `참석자 ${idx + 1}`),
            isBooker: p[1] === 1,
            isMember: p[2] === 1,
            prepaid: Number(p[3]) || 0,
            bank: String(p[4] || '선택 안함'),
            account: String(p[5] || '')
          }))
        : [];

      return {
        pool: String(pool || 'custom'),
        price: Number(price) || 0,
        dayType: dayType === 'weekend' ? 'weekend' : 'weekday',
        people: peopleList
      };
    }

    throw new Error("Unknown data schema version");
  } catch (error) {
    console.error("Failed to deserialize settlement data:", error);
    return null;
  }
}
