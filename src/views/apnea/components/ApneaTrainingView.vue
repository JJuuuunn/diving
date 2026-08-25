<template>
  <div
    class="apnea-hud-overlay"
    :class="`apnea-hud-overlay--${phase}`"
    @click="handleScreenTouch"
  >
    <!-- 1. 상단 내비게이션 바 -->
    <div class="hud-topbar">
      <div class="hud-round-pill">
        <template v-if="trainingType === 'free'">
          <i class="fa-solid fa-stopwatch hud-icon-free" aria-hidden="true"></i>
          <span>{{ freeHasTimeLimit ? '목표 카운트다운 STA' : '자유 측정 STA' }}</span>
        </template>
        <template v-else>
          <i class="fa-solid fa-layer-group hud-icon-table" aria-hidden="true"></i>
          <span>Round {{ currentRoundNumber }} / {{ totalRounds }}</span>
        </template>
      </div>

      <div class="hud-elapsed-text">
        총 세션 시간: {{ formatDuration(totalElapsedSec) }}
      </div>
    </div>

    <!-- 2. 중앙 타이머 & 발광 원형 다이얼 -->
    <div class="hud-center-dial">
      <!-- 호흡 이완 가이드 펄스 링 (준비/휴식 단계 시 부드러운 확대/축소 펄스) -->
      <div
        class="breathing-wave-halo"
        :class="{ 'active-breath': phase === 'prepare' || phase === 'rest' }"
      ></div>

      <svg viewBox="0 0 280 280">
        <circle
          class="hud-track-ring"
          cx="140"
          cy="140"
          r="120"
        />
        <circle
          class="hud-meter-ring"
          :class="phase"
          cx="140"
          cy="140"
          r="120"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
        />
      </svg>

      <div class="hud-dial-core-content">
        <div class="hud-phase-chip" :class="phase">
          {{ phaseTitle }}
        </div>
        <div class="hud-main-timer-digits">
          {{ displayTimeFormatted }}
        </div>
        <div class="hud-sub-instruction">
          <template v-if="phase === 'hold' && trainingType === 'free'">
            <span v-if="currentFirstContractionSec">
              첫 수축: {{ formatDuration(currentFirstContractionSec) }}
            </span>
            <span v-else-if="freeHasTimeLimit">
              목표 한계까지 마음을 이완하세요 ({{ formatDuration(targetHoldSec || 180) }})
            </span>
            <span v-else>
              몸을 이완하고 한계까지 유영하세요 (무제한)
            </span>
          </template>
          <template v-else-if="phase === 'hold'">
            목표: {{ formatDuration(phaseTargetSec) }}
          </template>
          <template v-else-if="phase === 'prepare' || phase === 'rest'">
            긴장을 풀고 편안하게 복식 호흡하세요
          </template>
          <template v-else-if="phase === 'recovery'">
            회복 호흡 (Hook Breathing)을 깊게 실시하세요
          </template>
        </div>
      </div>
    </div>

    <!-- 3. 수축(Contraction) 액션 허브 (숨참기 단계일 때 활성화) -->
    <div v-if="isHoldPhase" class="hud-contraction-hub">
      <CustomButton
        class="hud-contraction-btn"
        size="lg"
        variant="outline"
        block
        @click="recordContraction"
      >
        <template #leading>
          <i class="fa-solid fa-bolt" aria-hidden="true"></i>
        </template>
        수축 기록 (화면 터치 / 스페이스바)
        <span v-if="currentHoldContractions.length > 0" class="hud-count-badge">
          {{ currentHoldContractions.length }}회
        </span>
      </CustomButton>

      <!-- 수축 시점 타임라인 칩 목록 -->
      <div
        v-if="currentHoldContractions.length > 0"
        ref="timelineRef"
        class="hud-contraction-timeline"
      >
        <span
          v-for="(c, idx) in currentHoldContractions"
          :key="idx"
          class="contraction-chip-node"
        >
          #{{ idx + 1 }} {{ formatDuration(c.timestampSec) }}
        </span>
      </div>
    </div>

    <!-- 4. 하단 컨트롤 바 -->
    <div class="hud-bottom-controls">
      <CustomButton
        variant="secondary"
        size="md"
        @click="nextPhase"
      >
        <template #leading><i class="fa-solid fa-forward-step" aria-hidden="true"></i></template>
        {{ isHoldPhase && trainingType === 'free' ? '호흡 시작 (측정 종료)' : '다음 단계로' }}
      </CustomButton>

      <CustomButton
        variant="danger"
        size="md"
        @click="showStopConfirm = true"
      >
        <template #leading><i class="fa-solid fa-stop" aria-hidden="true"></i></template>
        훈련 중단
      </CustomButton>
    </div>

    <!-- 중단 확인 모달 -->
    <ConfirmModal
      :show="showStopConfirm"
      title="훈련 중단"
      message="현재 진행 중인 훈련 세션을 중단하시겠습니까? (지금까지의 기록은 저장되지 않습니다)"
      confirm-text="중단하기"
      cancel-text="계속 훈련"
      danger
      @confirm="handleConfirmStop"
      @cancel="showStopConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { ApneaHistoryItem, ApneaRoundPlan, ApneaTrainingType } from '@/types/apnea';
import { formatDuration } from '@/utils/apnea';
import { useApneaTimer } from '@/composables/useApneaTimer';
import CustomButton from '@/components/CustomButton.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const props = withDefaults(
  defineProps<{
    type: ApneaTrainingType;
    plans: ApneaRoundPlan[];
    prepareSec: number;
    soundEnabled: boolean;
    hasTimeLimit?: boolean;
    targetHoldSec?: number;
    noticeIntervalSec?: number;
  }>(),
  {
    hasTimeLimit: false,
    targetHoldSec: 180,
    noticeIntervalSec: 0
  }
);

const emit = defineEmits<{
  (e: 'finish', item: ApneaHistoryItem): void;
  (e: 'stop'): void;
}>();

const showStopConfirm = ref(false);
const timelineRef = ref<HTMLDivElement | null>(null);

const {
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
  startSession,
  nextPhase,
  recordContraction,
  pause,
  resume,
  stop
} = useApneaTimer();

watch(
  () => currentHoldContractions.value.length,
  async (newLength) => {
    if (newLength > 0) {
      await nextTick();
      if (timelineRef.value) {
        timelineRef.value.scrollTop = timelineRef.value.scrollHeight;
      }
    }
  }
);

// SVG Circle circumference (r=120)
const radius = 120;
const circumference = 2 * Math.PI * radius;

const strokeDashoffset = computed(() => {
  if (trainingType.value === 'free' && phase.value === 'hold' && !freeHasTimeLimit.value) {
    return 0;
  }
  const pct = progressPercent.value;
  return circumference - (pct / 100) * circumference;
});

const phaseTitle = computed(() => {
  switch (phase.value) {
    case 'prepare':
      return '준비 호흡 (Breathe-up)';
    case 'hold':
      return '숨 참기 (Hold)';
    case 'rest':
      return '휴식 호흡 (Rest)';
    case 'recovery':
      return '회복 호흡 (Recovery)';
    default:
      return '';
  }
});

const displayTimeFormatted = computed(() => {
  if (trainingType.value === 'free' && phase.value === 'hold' && !freeHasTimeLimit.value) {
    return formatDuration(phaseElapsedSec.value);
  }
  return formatDuration(phaseRemainingSec.value);
});

const handleScreenTouch = (e: MouseEvent | TouchEvent) => {
  if (isHoldPhase.value) {
    const target = e.target as HTMLElement;
    if (target.closest('button, .hud-bottom-controls, .confirm-modal-backdrop')) {
      return;
    }
    recordContraction();
  }
};

const handleConfirmStop = () => {
  showStopConfirm.value = false;
  stop();
  emit('stop');
};

const handleWindowKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space' && isHoldPhase.value) {
    e.preventDefault();
    recordContraction();
  }
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
  window.addEventListener('keydown', handleWindowKeyDown);
  startSession({
    type: props.type,
    roundPlans: props.plans,
    prepareDurationSec: props.prepareSec,
    soundEnabled: props.soundEnabled,
    hasTimeLimit: props.hasTimeLimit,
    targetHoldSec: props.targetHoldSec,
    noticeIntervalSec: props.noticeIntervalSec,
    onFinish: (historyItem) => {
      emit('finish', historyItem);
    }
  });
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', handleWindowKeyDown);
});
</script>
