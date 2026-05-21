export interface DiveLog {
  id: string;
  date: string;
  location: string;
  maxDepth: number; // 수심 (m)
  diveTime: number; // 다이빙 시간 (분)
  temp: number; // 수온 (℃)
  entryPsi: number; // 입수 시 실린더 압력 (bar)
  exitPsi: number; // 출수 시 실린더 압력 (bar)
  buddyName: string;
  buddySignature: string; // Base64 서명 이미지 데이터
  notes: string;
}
