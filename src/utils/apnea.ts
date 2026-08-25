import type {
  ApneaCustomTablePreset,
  ApneaHistoryItem,
  ApneaRoundPlan,
  ApneaSettings,
  ApneaStats,
  ApneaTableConfig,
  ApneaTrainingType
} from '@/types/apnea';

/**
 * Format seconds into mm:ss string.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format seconds into human readable text (e.g. 2분 30초 or 45초).
 */
export function formatDurationKorean(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0초';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0 && secs > 0) {
    return `${mins}분 ${secs}초`;
  }
  if (mins > 0) {
    return `${mins}분`;
  }
  return `${secs}초`;
}

/**
 * Generate standard CO2 and O2 round plans based on PB or custom parameters.
 */
export function generateTablePlan(
  type: 'co2' | 'o2',
  pbSec: number,
  rounds = 8,
  customConfig?: Partial<ApneaTableConfig>
): ApneaRoundPlan[] {
  const safeRounds = Math.max(2, Math.min(12, Math.round(rounds)));
  const safePb = Math.max(30, pbSec || 180);
  const plans: ApneaRoundPlan[] = [];

  if (type === 'co2') {
    // CO2 Table: Fixed Hold (typically 50% PB), Decreasing Rest (starts at 120s, -15s each round)
    const holdSec = customConfig?.baseHoldSec ?? Math.max(30, Math.round((safePb * 0.5) / 5) * 5);
    const startRest = customConfig?.baseRestSec ?? 120;
    const decrement = customConfig?.restDecrementSec ?? 15;

    for (let i = 0; i < safeRounds; i++) {
      const rest = Math.max(15, startRest - i * decrement);
      plans.push({
        roundNumber: i + 1,
        restDurationSec: rest,
        holdDurationSec: holdSec
      });
    }
  } else {
    // O2 Table: Fixed Rest (typically 120s), Increasing Hold (starts at ~35-40% PB, +15s each round)
    const fixedRest = customConfig?.baseRestSec ?? 120;
    const startHold = customConfig?.baseHoldSec ?? Math.max(30, Math.round((safePb * 0.35) / 5) * 5);
    const increment = customConfig?.holdIncrementSec ?? 15;

    for (let i = 0; i < safeRounds; i++) {
      const hold = startHold + i * increment;
      plans.push({
        roundNumber: i + 1,
        restDurationSec: fixedRest,
        holdDurationSec: hold
      });
    }
  }

  return plans;
}

/**
 * Generate Pyramid training plan (Hold climbs to a peak then descends).
 */
export function generatePyramidPlan(
  peakHoldSec: number,
  baseRestSec = 60,
  rounds = 6
): ApneaRoundPlan[] {
  const safeRounds = Math.max(3, Math.min(12, Math.round(rounds)));
  const half = Math.floor(safeRounds / 2);
  const step = Math.max(10, Math.round((peakHoldSec * 0.4) / half / 5) * 5);
  const startHold = Math.max(20, peakHoldSec - half * step);
  const plans: ApneaRoundPlan[] = [];

  for (let i = 0; i < safeRounds; i++) {
    const distanceFromPeak = Math.abs(i - half);
    const hold = peakHoldSec - distanceFromPeak * step;
    plans.push({
      roundNumber: i + 1,
      restDurationSec: baseRestSec,
      holdDurationSec: Math.max(20, hold)
    });
  }

  return plans;
}

/**
 * Generate One-Breath table (Short fixed recovery rest 15s with progressive or fixed hold).
 */
export function generateOneBreathPlan(
  holdSec: number,
  restSec = 15,
  rounds = 6
): ApneaRoundPlan[] {
  const safeRounds = Math.max(2, Math.min(10, Math.round(rounds)));
  const plans: ApneaRoundPlan[] = [];

  for (let i = 0; i < safeRounds; i++) {
    plans.push({
      roundNumber: i + 1,
      restDurationSec: restSec,
      holdDurationSec: holdSec
    });
  }

  return plans;
}

/**
 * Calculate total table duration in seconds.
 */
export function calculateTotalPlanDuration(plans: ApneaRoundPlan[], prepareDurationSec = 0): number {
  return plans.reduce(
    (acc, cur) => acc + cur.restDurationSec + cur.holdDurationSec,
    prepareDurationSec
  );
}

/**
 * Compute overall statistics from history records.
 */
export function calculateApneaStats(
  histories: ApneaHistoryItem[],
  pbHoldSec: number
): ApneaStats {
  const totalSessions = histories.length;
  let totalHoldSec = 0;
  let maxPb = pbHoldSec || 0;
  const firstContractions: number[] = [];

  for (const item of histories) {
    if (item.maxHoldSec > maxPb) {
      maxPb = item.maxHoldSec;
    }
    if (item.firstContractionSec && item.firstContractionSec > 0) {
      firstContractions.push(item.firstContractionSec);
    }
    if (item.rounds && Array.isArray(item.rounds)) {
      for (const r of item.rounds) {
        totalHoldSec += r.actualHoldSec || 0;
      }
    } else if (item.type === 'free') {
      totalHoldSec += item.maxHoldSec || 0;
    }
  }

  // Calculate average of the latest up to 5 first contractions
  const recentContractions = firstContractions.slice(0, 5);
  const recentAvgFirstContractionSec =
    recentContractions.length > 0
      ? Math.round(recentContractions.reduce((a, b) => a + b, 0) / recentContractions.length)
      : 0;

  return {
    totalSessions,
    totalHoldSec,
    maxPbSec: maxPb,
    recentAvgFirstContractionSec
  };
}

/**
 * Runtime validation for imported backup JSON.
 */
export function validateApneaBackup(
  data: unknown
): data is {
  histories: ApneaHistoryItem[];
  settings?: Partial<ApneaSettings>;
  pbHoldSec?: number;
  customPresets?: ApneaCustomTablePreset[];
} {
  if (!data || typeof data !== 'object') return false;
  const payload = data as Record<string, unknown>;

  if (!Array.isArray(payload.histories)) return false;

  for (const item of payload.histories) {
    if (!item || typeof item !== 'object') return false;
    if (typeof item.id !== 'string') return false;
    if (typeof item.date !== 'string') return false;
    if (!['co2', 'o2', 'free', 'custom', 'pyramid', 'one-breath'].includes(item.type)) return false;
    if (typeof item.maxHoldSec !== 'number') return false;
  }

  return true;
}
