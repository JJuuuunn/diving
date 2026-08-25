<template>
  <div class="apnea-free-setup">
    <!-- 1. 히어로 비전 카드 -->
    <div class="apnea-card apnea-free-hero">
      <div class="free-hero-icon">🤿</div>
      <h3>자유 스태틱 & PB 도전</h3>
      <p>
        특정 시간 알림 주기와 목표 시간 유무를 자유롭게 설정하여 스태틱 숨참기 한계를 안전하게 측정하세요.
      </p>
    </div>

    <!-- 2. 핵심 설정 카드 -->
    <div class="apnea-card">
      <div class="apnea-free-grid">
        <!-- 호흡 조절 준비 시간 -->
        <div class="apnea-prep-card">
          <label>
            <i class="fa-solid fa-wind icon-emerald" aria-hidden="true"></i>
            호흡 조절 준비 시간 (Breathe-Up)
          </label>
          <div class="chips-group prep-chips-group">
            <CustomButton
              v-for="p in prepareOptions"
              :key="p.sec"
              size="xs"
              :variant="prepareSec === p.sec ? 'primary' : 'outline'"
              @click="prepareSec = p.sec"
            >
              {{ p.label }}
            </CustomButton>
          </div>
        </div>
      </div>

      <!-- 3. 시간 모드 & 구간 알림 세팅 섹션 -->
      <div class="free-config-section">
        <!-- 끝나는 시간 유무 선택 (hasTimeLimit) -->
        <div class="config-block">
          <div class="block-title">
            <i class="fa-solid fa-hourglass-half icon-ocean" aria-hidden="true"></i>
            <span>끝나는 시간 유무 선택</span>
          </div>

          <div class="time-limit-selector">
            <CustomSegmentedControl
              v-model="hasTimeLimitVal"
              :options="[
                { label: '무제한 (자유 측정)', value: 'unlimited', icon: '<i class=\'fa-solid fa-infinity\'></i>' },
                { label: '목표 시간 설정 (카운트다운)', value: 'target', icon: '<i class=\'fa-solid fa-bullseye\'></i>' }
              ]"
              size="md"
              block
            />
          </div>

          <!-- 목표 시간 설정 시 표시되는 시간 선택 칩 -->
          <div v-if="hasTimeLimitVal === 'target'" class="target-time-picker fade-in-up">
            <label class="picker-label">
              목표 숨참기 시간: <strong>{{ formatDuration(targetHoldSec) }}</strong>
            </label>
            <div class="chips-group">
              <CustomButton
                v-for="chip in targetHoldChips"
                :key="chip.sec"
                size="xs"
                :variant="targetHoldSec === chip.sec ? 'primary' : 'outline'"
                @click="targetHoldSec = chip.sec"
              >
                {{ chip.label }}
              </CustomButton>
            </div>
          </div>
        </div>

        <!-- 특정 타임 주기 알림 설정 (noticeIntervalSec) -->
        <div class="config-block">
          <div class="block-title">
            <i class="fa-solid fa-bell icon-gold" aria-hidden="true"></i>
            <span>특정 타임 구간 알림 설정 (Audio Notice)</span>
          </div>
          <p class="block-desc">
            숨참기 진행 중 지정한 시간 주기마다 음성/알림음으로 경과 시간을 알려줍니다.
          </p>

          <div class="chips-group">
            <CustomButton
              v-for="opt in intervalNoticeOptions"
              :key="opt.sec"
              size="xs"
              :variant="noticeIntervalSec === opt.sec ? 'primary' : 'outline'"
              @click="noticeIntervalSec = opt.sec"
            >
              {{ opt.label }}
            </CustomButton>
          </div>
        </div>
      </div>

      <!-- 4. 안전 주의사항 안내 -->
      <div class="apnea-safety-card">
        <div class="safety-title">
          <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
          스태틱 다이빙 필수 안전 수칙
        </div>
        <p class="safety-desc">
          단독 훈련은 절대 금물입니다. 반드시 자격을 갖춘 버디의 수중/지상 직접 감시 하에 훈련하세요. 과도한 하이퍼벤틸레이션(Hyperventilation)은 블랙아웃(LMC/BO)의 주원인이므로 피해야 합니다.
        </p>
      </div>

      <!-- 5. 시작 버튼 -->
      <div class="apnea-start-action">
        <CustomButton
          variant="primary"
          size="lg"
          block
          @click="handleStartFree"
        >
          <template #leading>
            <i class="fa-solid fa-play" aria-hidden="true"></i>
          </template>
          {{ hasTimeLimitVal === 'target' ? `${formatDuration(targetHoldSec)} 목표` : '자유 무제한' }} 스태틱 측정 시작하기
        </CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApneaFreeOptions } from '@/types/apnea';
import { formatDuration } from '@/utils/apnea';
import { useApneaStore } from '@/stores/apnea';
import CustomButton from '@/components/CustomButton.vue';
import CustomSegmentedControl from '@/components/CustomSegmentedControl.vue';

const emit = defineEmits<{
  (e: 'startFree', payload: ApneaFreeOptions): void;
}>();

const apneaStore = useApneaStore();

const currentPbSec = computed(() => apneaStore.pbHoldSec || 180);
const prepareSec = ref<number>(apneaStore.settings.defaultPrepareDurationSec || 120);

// 끝나는 시간 유무 선택 ('unlimited' vs 'target')
const hasTimeLimitVal = ref<'unlimited' | 'target'>('unlimited');
const targetHoldSec = ref<number>(apneaStore.pbHoldSec || 180);

// 특정 타임 구간 알림 주기 (0: 없음, 15: 15s, 30: 30s, 60: 1m, 120: 2m)
const noticeIntervalSec = ref<number>(30);

const targetHoldChips = [
  { label: '2:00', sec: 120 },
  { label: '2:30', sec: 150 },
  { label: '3:00', sec: 180 },
  { label: '3:30', sec: 210 },
  { label: '4:00', sec: 240 },
  { label: '4:30', sec: 270 },
  { label: '5:00', sec: 300 }
];

const prepareOptions = [
  { label: '1분 (60s)', sec: 60 },
  { label: '1.5분 (90s)', sec: 90 },
  { label: '2분 (120s)', sec: 120 },
  { label: '3분 (180s)', sec: 180 }
];

const intervalNoticeOptions = [
  { label: '알림 없음', sec: 0 },
  { label: '15초마다 🔔', sec: 15 },
  { label: '30초마다 🔔', sec: 30 },
  { label: '1분(60초)마다 🔔', sec: 60 },
  { label: '2분(120초)마다 🔔', sec: 120 }
];

const handleStartFree = () => {
  emit('startFree', {
    hasTimeLimit: hasTimeLimitVal.value === 'target',
    targetHoldSec: targetHoldSec.value,
    noticeIntervalSec: noticeIntervalSec.value,
    prepareDurationSec: prepareSec.value
  });
};
</script>
