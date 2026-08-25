export type DiveType = 'scuba' | 'freediving';
export type LogCardDesign = 'hud' | 'ticket' | 'sports' | 'classic' | 'ocean' | 'expedition' | 'coral' | 'minimal' | 'garmin';
export type FreedivingDiscipline = 'CWT' | 'CWTB' | 'CNF' | 'FIM' | 'STA' | 'DYN' | 'DYNB' | 'DNF';
export type EqualizingMethod = 'Frenzel' | 'Valsalva' | 'Mouthfill';

export type PhotoHudPreset = 'sporty-right' | 'left-minimal' | 'top-hero' | 'balanced';

export interface HudElementPosition {
  x: number;
  y: number;
  scale?: number;
}

export type GarminElementPosition = HudElementPosition;

export interface HudLayoutMap {
  heroStat?: HudElementPosition;
  subline?: HudElementPosition;
  brandBadge?: HudElementPosition;
  rightStats?: HudElementPosition;
}

export type GarminLayoutMap = HudLayoutMap;

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
  photoUrl?: string;
  design?: LogCardDesign;
  hudLayout?: HudLayoutMap;
  garminLayout?: HudLayoutMap;
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
  equalizingMethod?: EqualizingMethod;
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
