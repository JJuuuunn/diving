export type DiveType = 'scuba' | 'freediving';
export type LogCardDesign = 'ocean' | 'expedition' | 'coral' | 'minimal';
export type FreedivingDiscipline = 'CWT' | 'FIM' | 'CNF' | 'STA' | 'DYN';
export type EqualizingMethod = 'Frenzel' | 'Valsalva' | 'Mouthfill';

export interface BaseDiveLog {
  id: string;
  type: DiveType;
  date: string;
  location: string;
  maxDepth: number;
  temp: number;
  buddyName: string;
  buddySignature: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScubaDiveLog extends BaseDiveLog {
  type: 'scuba';
  durationMinutes: number;
  entryPressureBar: number;
  exitPressureBar: number;
}

export interface FreedivingDiveLog extends BaseDiveLog {
  type: 'freediving';
  diveCount: number;
  apneaSeconds: number;
  discipline: FreedivingDiscipline;
  weightKg: number;
  equalizingMethod: EqualizingMethod;
}

export type DiveLog = ScubaDiveLog | FreedivingDiveLog;
export type DiveLogDraft =
  | Omit<ScubaDiveLog, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<FreedivingDiveLog, 'id' | 'createdAt' | 'updatedAt'>;

export interface LogbookBackup {
  schemaVersion: 1;
  exportedAt: string;
  logs: DiveLog[];
}

export interface LogbookParseResult {
  logs: DiveLog[];
  discarded: number;
  migrated: boolean;
}
