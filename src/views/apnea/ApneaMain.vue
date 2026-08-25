<template>
  <div class="apnea-container">
    <!-- 1. 메인 히어로 배너 & 다이버 티어 배지 -->
    <header class="apnea-hero-banner">
      <div class="hero-ambient-glow"></div>
      <div class="tier-badge-pill">
        <span class="tier-icon">{{ diverTier.icon }}</span>
        <span>{{ diverTier.title }} (PB {{ formatDuration(apneaStore.pbHoldSec) }})</span>
      </div>
      <h1>스태틱 앱니아 트레이너</h1>
      <p class="hero-sub">
        테이블 훈련, 자유 스태틱 카운트다운 및 통합 히스토리 기록으로 호흡 한계를 극대화하세요.
      </p>
    </header>

    <!-- 2. 핵심 지표 요약 바 -->
    <div class="apnea-stats-overview">
      <div class="metric-tile">
        <div class="tile-icon-box">🤿</div>
        <div class="tile-title">누적 훈련 세션</div>
        <div class="tile-number action">{{ apneaStore.stats.totalSessions }}회</div>
      </div>

      <div class="metric-tile">
        <div class="tile-icon-box">⏱️</div>
        <div class="tile-title">누적 숨참기</div>
        <div class="tile-number">{{ formatDuration(apneaStore.stats.totalHoldSec) }}</div>
      </div>

      <div class="metric-tile">
        <div class="tile-icon-box">🏆</div>
        <div class="tile-title">최고 기록 (PB)</div>
        <div class="tile-number gold">{{ formatDuration(apneaStore.stats.maxPbSec) }}</div>
      </div>

      <div class="metric-tile">
        <div class="tile-icon-box">⚡</div>
        <div class="tile-title">평균 첫 수축</div>
        <div class="tile-number emerald">
          {{ apneaStore.stats.recentAvgFirstContractionSec ? formatDuration(apneaStore.stats.recentAvgFirstContractionSec) : '-' }}
        </div>
      </div>
    </div>

    <!-- 3. 최상위 서비스 탭 내비게이션 (테이블 훈련 / 자유 스태틱 & PB / 히스토리) -->
    <div class="apnea-tabs-wrapper">
      <CustomTabs
        v-model="activeTab"
        :tabs="tabItems"
        variant="pill"
        block
      >
        <!-- 탭 1: 테이블 훈련 (내부에 3단계 위저드 스텝 배치) -->
        <CustomTabPanel value="table">
          <!-- 테이블 훈련 전용 진행 스텝 바 (Step 1 ➔ Step 2 ➔ Step 3) -->
          <div class="apnea-stepper-container" aria-label="테이블 훈련 진행 단계">
            <div class="step-item" :class="{ active: tableStep >= 1 }">
              <div class="step-circle">1</div>
              <span class="step-label">테이블 선택</span>
            </div>

            <div class="step-line" :class="{ active: tableStep >= 2 }"></div>

            <div class="step-item" :class="{ active: tableStep >= 2 }">
              <div class="step-circle">2</div>
              <span class="step-label">상세 수정 & 시작</span>
            </div>

            <div class="step-line" :class="{ active: tableStep >= 3 }"></div>

            <div class="step-item" :class="{ active: tableStep >= 3 }">
              <div class="step-circle">3</div>
              <span class="step-label">훈련 결과</span>
            </div>
          </div>

          <!-- 스텝 1: 테이블 목록 선택 -->
          <div v-if="tableStep === 1" class="step-content">
            <ApneaTableSetup
              :step="1"
              :selected-table-id="selectedTableId"
              @select-table="handleSelectTable"
              @next-step="tableStep = 2"
            />
          </div>

          <!-- 스텝 2: 테이블 상세 수정 & 훈련 시작 -->
          <div v-else-if="tableStep === 2" class="step-content">
            <ApneaTableSetup
              :step="2"
              :selected-table-id="selectedTableId"
              @prev-step="tableStep = 1"
              @start="handleStartTableTraining"
            />
          </div>

          <!-- 스텝 3: 테이블 훈련 결과 -->
          <div v-else-if="tableStep === 3" class="step-content">
            <div v-if="completedSessionItem" class="apnea-card result-step-card" style="text-align: center; padding: 2.25rem 1.5rem;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
              <h3 style="font-size: 1.6rem; font-weight: 900; color: var(--page-text-primary); margin-bottom: 0.5rem;">
                테이블 훈련 세션 완료!
              </h3>
              <p style="font-size: 0.95rem; color: var(--page-text-secondary); margin-bottom: 1.75rem;">
                수고하셨습니다! 훈련 결과가 성공적으로 기록되었습니다.
              </p>

              <div class="session-metrics-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; background: var(--color-neutral-bg); padding: 1.25rem; border-radius: 1.25rem; margin-bottom: 1.75rem;">
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--page-text-secondary); margin-bottom: 0.35rem;">최대 숨참기</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: var(--color-action);">{{ formatDuration(completedSessionItem.maxHoldSec) }}</div>
                </div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--page-text-secondary); margin-bottom: 0.35rem;">완료 라운드</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: var(--page-text-primary);">{{ completedSessionItem.completedRounds }} / {{ completedSessionItem.totalRounds }}</div>
                </div>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--page-text-secondary); margin-bottom: 0.35rem;">첫 수축 시점</div>
                  <div style="font-size: 1.5rem; font-weight: 900; color: #10b981;">
                    {{ completedSessionItem.firstContractionSec ? formatDuration(completedSessionItem.firstContractionSec) : '-' }}
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
                <CustomButton variant="primary" size="md" @click="handleGoHome">
                  <template #leading><i class="fa-solid fa-house" aria-hidden="true"></i></template>
                  처음(홈)으로 돌아가기 (Step 1)
                </CustomButton>
                <CustomButton variant="outline" size="md" @click="tableStep = 2">
                  <template #leading><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></template>
                  다시 훈련하기 (Step 2)
                </CustomButton>
              </div>
            </div>
          </div>
        </CustomTabPanel>

        <!-- 탭 2: 자유 스태틱 & PB (독립 서비스) -->
        <CustomTabPanel value="free">
          <ApneaFreeSetup @startFree="handleStartFreeTraining" />
        </CustomTabPanel>

        <!-- 탭 3: 히스토리 기록 (독립 히스토리) -->
        <CustomTabPanel value="history">
          <ApneaHistory />
        </CustomTabPanel>
      </CustomTabs>
    </div>

    <!-- 4. 풀스크린 엘리트 HUD 훈련 뷰 -->
    <ApneaTrainingView
      v-if="isTrainingActive"
      :type="trainingConfig.type"
      :plans="trainingConfig.plans"
      :prepare-sec="trainingConfig.prepareSec"
      :sound-enabled="apneaStore.settings.soundEnabled"
      :has-time-limit="trainingConfig.hasTimeLimit"
      :target-hold-sec="trainingConfig.targetHoldSec"
      :notice-interval-sec="trainingConfig.noticeIntervalSec"
      @finish="handleTrainingFinish"
      @stop="handleTrainingStop"
    />

    <!-- 훈련 완료 축하 모달팝업 -->
    <ApneaResultModal
      v-if="showResultModal && completedSessionItem"
      :item="completedSessionItem"
      @close="handleResultModalClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TabItem } from '@/types/inputs';
import type { ApneaFreeOptions, ApneaHistoryItem, ApneaRoundPlan, ApneaTrainingType } from '@/types/apnea';
import { formatDuration } from '@/utils/apnea';
import { useApneaStore } from '@/stores/apnea';
import CustomButton from '@/components/CustomButton.vue';
import CustomTabs from '@/components/CustomTabs.vue';
import CustomTabPanel from '@/components/CustomTabPanel.vue';
import ApneaTableSetup from './components/ApneaTableSetup.vue';
import ApneaFreeSetup from './components/ApneaFreeSetup.vue';
import ApneaHistory from './components/ApneaHistory.vue';
import ApneaTrainingView from './components/ApneaTrainingView.vue';
import ApneaResultModal from './components/ApneaResultModal.vue';

const apneaStore = useApneaStore();

const activeTab = ref<string>('table');
const tableStep = ref<number>(1);
const selectedTableId = ref<string>('');

const tabItems: TabItem[] = [
  { id: 'table', label: '테이블 훈련' },
  { id: 'free', label: '자유 스태틱 & PB' },
  { id: 'history', label: '히스토리' }
];

const diverTier = computed(() => {
  const pb = apneaStore.pbHoldSec || 180;
  if (pb >= 300) return { icon: '💎', title: 'Master Diver (5분+)' };
  if (pb >= 210) return { icon: '🥇', title: 'Gold Diver (3분 30초+)' };
  if (pb >= 120) return { icon: '🥈', title: 'Silver Diver (2분+)' };
  return { icon: '🥉', title: 'Bronze Diver' };
});

const isTrainingActive = ref(false);
const showResultModal = ref(false);
const completedSessionItem = ref<ApneaHistoryItem | null>(null);

const trainingConfig = ref<{
  type: ApneaTrainingType;
  plans: ApneaRoundPlan[];
  prepareSec: number;
  hasTimeLimit?: boolean;
  targetHoldSec?: number;
  noticeIntervalSec?: number;
}>({
  type: 'co2',
  plans: [],
  prepareSec: 120
});

const handleSelectTable = (tableId: string) => {
  selectedTableId.value = tableId;
  tableStep.value = 2;
};

const handleStartTableTraining = (payload: {
  type: ApneaTrainingType;
  plans: ApneaRoundPlan[];
  prepareSec: number;
}) => {
  trainingConfig.value = {
    type: payload.type,
    plans: payload.plans,
    prepareSec: payload.prepareSec
  };
  isTrainingActive.value = true;
};

const handleStartFreeTraining = (payload: ApneaFreeOptions) => {
  trainingConfig.value = {
    type: 'free',
    plans: [],
    prepareSec: payload.prepareDurationSec,
    hasTimeLimit: payload.hasTimeLimit,
    targetHoldSec: payload.targetHoldSec,
    noticeIntervalSec: payload.noticeIntervalSec
  };
  isTrainingActive.value = true;
};

const handleTrainingFinish = (item: ApneaHistoryItem) => {
  isTrainingActive.value = false;
  completedSessionItem.value = item;
  showResultModal.value = true;
  if (activeTab.value === 'table') {
    tableStep.value = 3; // Transition to Step 3 for table training
  }
};

const handleGoHome = () => {
  tableStep.value = 1;
  selectedTableId.value = '';
};

const handleResultModalClose = () => {
  showResultModal.value = false;
  handleGoHome();
};

const handleTrainingStop = () => {
  isTrainingActive.value = false;
};
</script>

<style lang="scss">
@use '@/assets/scss/pages/_apnea.scss';
</style>
