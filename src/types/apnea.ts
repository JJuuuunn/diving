export type ApneaTrainingType = 'co2' | 'o2' | 'free' | 'custom' | 'pyramid' | 'one-breath' | 'flat';

export type ApneaPhase = 'prepare' | 'hold' | 'rest' | 'recovery' | 'finished';

export type ApneaTimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface ApneaRoundPlan {
  roundNumber: number;
  restDurationSec: number;
  holdDurationSec: number;
}

export interface ApneaTableConfig {
  type: ApneaTrainingType;
  rounds: number;
  baseHoldSec: number;
  baseRestSec: number;
  restDecrementSec: number; // for CO2
  holdIncrementSec: number; // for O2
  prepareDurationSec: number; // initial breathe-up
}

export interface ApneaContraction {
  timestampSec: number; // seconds elapsed into current hold
  absoluteTime: string; // ISO string
}

export interface ApneaRoundResult {
  roundNumber: number;
  targetHoldSec: number;
  actualHoldSec: number;
  actualRestSec: number;
  contractions: ApneaContraction[];
  firstContractionSec?: number;
}

export interface ApneaHistoryItem {
  id: string;
  date: string; // ISO string
  type: ApneaTrainingType;
  totalDurationSec: number;
  completedRounds: number;
  totalRounds: number;
  rounds: ApneaRoundResult[];
  maxHoldSec: number;
  firstContractionSec?: number;
  note?: string;
}

export interface ApneaSettings {
  pbHoldSec: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  countdownBeeps: boolean;
  defaultPrepareDurationSec: number;
  co2BaseHoldPercent: number; // % of PB (default: 50)
  o2StartHoldPercent: number; // % of PB (default: 40)
}

export interface ApneaStats {
  totalSessions: number;
  totalHoldSec: number;
  maxPbSec: number;
  recentAvgFirstContractionSec: number;
}

export interface ApneaCustomTablePreset {
  id: string;
  name: string;
  type: 'co2' | 'o2' | 'custom' | 'pyramid' | 'one-breath' | 'flat';
  rounds: number;
  plans: ApneaRoundPlan[];
  createdAt: string;
}

export interface ApneaFreeOptions {
  hasTimeLimit: boolean; // 끝나는 시간 유무 선택
  targetHoldSec: number; // 목표 숨참기 시간 (초)
  noticeIntervalSec: number; // 특정 타임 알림 주기 (0: 없음, 15, 30, 60, 120)
  prepareDurationSec: number;
}
