import { ref, computed, onUnmounted } from 'vue';
import type {
  ApneaContraction,
  ApneaHistoryItem,
  ApneaPhase,
  ApneaRoundPlan,
  ApneaRoundResult,
  ApneaTimerStatus,
  ApneaTrainingType
} from '@/types/apnea';
import { useAudioBeep } from './useAudioBeep';
import { useWakeLock } from './useWakeLock';

export interface UseApneaTimerOptions {
  type: ApneaTrainingType;
  roundPlans: ApneaRoundPlan[];
  prepareDurationSec: number;
  soundEnabled: boolean;
  hasTimeLimit?: boolean;
  targetHoldSec?: number;
  noticeIntervalSec?: number;
  onFinish?: (historyItem: ApneaHistoryItem) => void;
}

export function useApneaTimer() {
  const {
    playCountdownBeep,
    playPhaseStartBeep,
    playContractionBeep,
    playFinishedChime,
    playIntervalNoticeBeep
  } = useAudioBeep();
  const { requestLock, releaseLock } = useWakeLock();

  const status = ref<ApneaTimerStatus>('idle');
  const phase = ref<ApneaPhase>('prepare');
  const trainingType = ref<ApneaTrainingType>('co2');

  const roundPlans = ref<ApneaRoundPlan[]>([]);
  const currentRoundIndex = ref<number>(0);

  // Time tracking (in integer seconds for UI, plus precise high-res tracker)
  const phaseElapsedSec = ref<number>(0);
  const phaseTargetSec = ref<number>(0);
  const totalElapsedSec = ref<number>(0);

  // Free STA specific settings
  const freeHasTimeLimit = ref<boolean>(false);
  const freeTargetHoldSec = ref<number>(180);
  const noticeIntervalSec = ref<number>(0);

  // Contraction tracking for current hold
  const currentHoldContractions = ref<ApneaContraction[]>([]);
  const currentFirstContractionSec = ref<number | undefined>(undefined);

  // Round results accumulator
  const roundResults = ref<ApneaRoundResult[]>([]);

  // Timer interval references
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let lastTimestamp = 0;
  let phaseElapsedExact = 0;
  let lastBeepSec = -1;
  let lastNoticeSec = -1;
  let soundActive = true;
  let onFinishCallback: ((historyItem: ApneaHistoryItem) => void) | undefined;

  const currentRoundNumber = computed(() => currentRoundIndex.value + 1);
  const totalRounds = computed(() => (trainingType.value === 'free' ? 1 : roundPlans.value.length));

  const phaseRemainingSec = computed(() => {
    if (trainingType.value === 'free' && phase.value === 'hold' && !freeHasTimeLimit.value) {
      return 0; // Count up indefinitely in free unlimited mode
    }
    return Math.max(0, phaseTargetSec.value - phaseElapsedSec.value);
  });

  const progressPercent = computed(() => {
    if (trainingType.value === 'free' && phase.value === 'hold' && !freeHasTimeLimit.value) {
      return 100;
    }
    if (phaseTargetSec.value <= 0) return 0;
    return Math.min(100, Math.max(0, (phaseElapsedSec.value / phaseTargetSec.value) * 100));
  });

  const isHoldPhase = computed(() => phase.value === 'hold');

  // Clean up timer interval
  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  // Start / Init session
  const startSession = (options: UseApneaTimerOptions) => {
    clearTimer();
    trainingType.value = options.type;
    roundPlans.value = options.roundPlans;
    soundActive = options.soundEnabled;
    onFinishCallback = options.onFinish;

    freeHasTimeLimit.value = !!options.hasTimeLimit;
    freeTargetHoldSec.value = options.targetHoldSec || 180;
    noticeIntervalSec.value = options.noticeIntervalSec || 0;

    currentRoundIndex.value = 0;
    roundResults.value = [];
    currentHoldContractions.value = [];
    currentFirstContractionSec.value = undefined;
    totalElapsedSec.value = 0;

    // Start with prepare phase
    phase.value = 'prepare';
    phaseTargetSec.value = options.prepareDurationSec;
    phaseElapsedSec.value = 0;
    phaseElapsedExact = 0;
    lastBeepSec = -1;
    lastNoticeSec = -1;

    status.value = 'running';
    lastTimestamp = performance.now();
    requestLock();

    timerInterval = setInterval(tick, 100);
  };

  // Switch to next phase
  const nextPhase = () => {
    lastBeepSec = -1;
    lastNoticeSec = -1;
    phaseElapsedExact = 0;
    phaseElapsedSec.value = 0;

    if (trainingType.value === 'free') {
      if (phase.value === 'prepare') {
        // Prepare -> Free Hold
        phase.value = 'hold';
        phaseTargetSec.value = freeHasTimeLimit.value ? freeTargetHoldSec.value : 0;
        currentHoldContractions.value = [];
        currentFirstContractionSec.value = undefined;
        if (soundActive) playPhaseStartBeep();
      } else if (phase.value === 'hold') {
        // Free Hold -> Recovery
        const holdDuration = phaseElapsedSec.value;
        roundResults.value.push({
          roundNumber: 1,
          targetHoldSec: freeHasTimeLimit.value ? freeTargetHoldSec.value : holdDuration,
          actualHoldSec: holdDuration,
          actualRestSec: 0,
          contractions: [...currentHoldContractions.value],
          firstContractionSec: currentFirstContractionSec.value
        });

        phase.value = 'recovery';
        phaseTargetSec.value = 60; // 1 min recovery breathing
        if (soundActive) playPhaseStartBeep();
      } else {
        // Recovery -> Finished
        finishSession();
      }
      return;
    }

    // Table Mode (CO2 / O2 / Custom)
    const currentPlan = roundPlans.value[currentRoundIndex.value];

    if (phase.value === 'prepare') {
      // Prepare -> Round 1 Hold
      phase.value = 'hold';
      phaseTargetSec.value = currentPlan ? currentPlan.holdDurationSec : 60;
      currentHoldContractions.value = [];
      currentFirstContractionSec.value = undefined;
      if (soundActive) playPhaseStartBeep();
    } else if (phase.value === 'hold') {
      // Hold -> Save Round Result & go to Rest or Finish
      const actualHold = phaseElapsedSec.value;
      roundResults.value.push({
        roundNumber: currentRoundNumber.value,
        targetHoldSec: currentPlan ? currentPlan.holdDurationSec : actualHold,
        actualHoldSec: actualHold,
        actualRestSec: 0,
        contractions: [...currentHoldContractions.value],
        firstContractionSec: currentFirstContractionSec.value
      });

      // Check if last round
      if (currentRoundIndex.value >= roundPlans.value.length - 1) {
        finishSession();
        return;
      }

      // Transition to Rest
      phase.value = 'rest';
      const nextPlan = roundPlans.value[currentRoundIndex.value];
      phaseTargetSec.value = nextPlan ? nextPlan.restDurationSec : 60;
      if (soundActive) playPhaseStartBeep();
    } else if (phase.value === 'rest') {
      // Rest -> Advance Round & start Next Hold
      if (roundResults.value.length > 0) {
        roundResults.value[roundResults.value.length - 1].actualRestSec = phaseElapsedSec.value;
      }
      currentRoundIndex.value++;
      const nextPlan = roundPlans.value[currentRoundIndex.value];
      phase.value = 'hold';
      phaseTargetSec.value = nextPlan ? nextPlan.holdDurationSec : 60;
      currentHoldContractions.value = [];
      currentFirstContractionSec.value = undefined;
      if (soundActive) playPhaseStartBeep();
    }
  };

  // Timer Tick
  const tick = () => {
    if (status.value !== 'running') return;

    const now = performance.now();
    const deltaSec = (now - lastTimestamp) / 1000;
    lastTimestamp = now;

    phaseElapsedExact += deltaSec;
    const prevSec = phaseElapsedSec.value;
    phaseElapsedSec.value = Math.floor(phaseElapsedExact);

    if (phaseElapsedSec.value > prevSec) {
      totalElapsedSec.value += phaseElapsedSec.value - prevSec;
    }

    // Interval notice audio alert during hold phase
    if (
      phase.value === 'hold' &&
      soundActive &&
      noticeIntervalSec.value > 0 &&
      phaseElapsedSec.value > 0 &&
      phaseElapsedSec.value % noticeIntervalSec.value === 0 &&
      lastNoticeSec !== phaseElapsedSec.value
    ) {
      lastNoticeSec = phaseElapsedSec.value;
      playIntervalNoticeBeep();
    }

    // Free hold phase with NO time limit: count up indefinitely
    if (trainingType.value === 'free' && phase.value === 'hold' && !freeHasTimeLimit.value) {
      return;
    }

    const remaining = phaseTargetSec.value - phaseElapsedSec.value;

    // Beep alerts at 3, 2, 1 seconds remaining
    if (soundActive && remaining > 0 && remaining <= 3 && remaining !== lastBeepSec) {
      lastBeepSec = remaining;
      playCountdownBeep();
    }

    // Phase complete
    if (phaseElapsedSec.value >= phaseTargetSec.value) {
      nextPhase();
    }
  };

  // Record Contraction
  const recordContraction = () => {
    if (phase.value !== 'hold') return;

    const sec = phaseElapsedSec.value;
    const contraction: ApneaContraction = {
      timestampSec: sec,
      absoluteTime: new Date().toISOString()
    };

    currentHoldContractions.value.push(contraction);

    if (currentFirstContractionSec.value === undefined) {
      currentFirstContractionSec.value = sec;
    }

    if (soundActive) {
      playContractionBeep();
    }
  };

  // Finish session
  const finishSession = () => {
    clearTimer();
    releaseLock();
    phase.value = 'finished';
    status.value = 'finished';

    if (soundActive) {
      playFinishedChime();
    }

    const maxHold = roundResults.value.reduce((max, r) => Math.max(max, r.actualHoldSec), 0);
    const firstContraction = roundResults.value.find((r) => r.firstContractionSec !== undefined)?.firstContractionSec;

    const historyItem: ApneaHistoryItem = {
      id: `apnea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      type: trainingType.value,
      totalDurationSec: totalElapsedSec.value,
      completedRounds: roundResults.value.length,
      totalRounds: totalRounds.value,
      rounds: [...roundResults.value],
      maxHoldSec: maxHold,
      firstContractionSec: firstContraction
    };

    if (onFinishCallback) {
      onFinishCallback(historyItem);
    }
  };

  // Pause / Resume / Stop
  const pause = () => {
    if (status.value === 'running') {
      status.value = 'paused';
    }
  };

  const resume = () => {
    if (status.value === 'paused') {
      status.value = 'running';
      lastTimestamp = performance.now();
    }
  };

  const stop = () => {
    clearTimer();
    releaseLock();
    status.value = 'idle';
    phase.value = 'prepare';
  };

  onUnmounted(() => {
    clearTimer();
    releaseLock();
  });

  return {
    status,
    phase,
    trainingType,
    currentRoundNumber,
    totalRounds,
    phaseElapsedSec,
    phaseRemainingSec,
    phaseTargetSec,
    totalElapsedSec,
    progressPercent,
    isHoldPhase,
    freeHasTimeLimit,
    currentHoldContractions,
    currentFirstContractionSec,
    roundResults,
    startSession,
    nextPhase,
    recordContraction,
    pause,
    resume,
    stop,
    finishSession
  };
}
