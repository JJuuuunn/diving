export interface BaseDiveLog {
  id: string;
  type: 'scuba' | 'freediving'; // 다이빙 타입 구분자
  date: string;
  location: string;
  maxDepth: number; // 최대 수심 (m)
  diveTime: number; // 다이빙 시간 (스쿠버: 분, 프리다이빙: 세션 총 다이빙 횟수)
  temp: number; // 수온 (℃)
  buddyName: string;
  buddySignature: string; // Base64 서명 이미지 데이터
  notes: string;
}

// 스쿠버다이빙 전용 인터페이스
export interface ScubaDiveLog extends BaseDiveLog {
  type: 'scuba';
  entryPsi?: number; // 입수 시 실린더 압력 (bar)
  exitPsi?: number;  // 출수 시 실린더 압력 (bar)
}

// 프리다이빙 전용 인터페이스
export interface FreedivingDiveLog extends BaseDiveLog {
  type: 'freediving';
  apneaTime?: string;   // 최대 무호흡 시간 (예: "01:45" 또는 "105초")
  discipline?: string;  // 시도 종목 (CWT, FIM, CNF, STA, DYN 등)
  weight?: number;      // 웨이트 무게 (kg)
  eqType?: string;      // 이퀄라이징 방식 (Frenzel, Valsalva, Mouthfill)
}

// 식별 가능한 유니온 (Discriminated Union) 타입으로 통합
export type DiveLog = ScubaDiveLog | FreedivingDiveLog;

