<template>
  <div class="apnea-result-backdrop">
    <div class="apnea-card apnea-result-card">
      <!-- 축하 아이콘 / 타이틀 -->
      <div class="result-trophy">
        {{ isNewPb ? '🏆' : '🎉' }}
      </div>

      <h2>
        {{ isNewPb ? '새로운 최고 기록(PB) 달성!' : '훈련 세션 완료!' }}
      </h2>
      <p class="result-desc">
        {{ isNewPb ? '이전 기록을 뛰어넘었습니다. 훌륭한 다이빙입니다!' : '오늘의 훈련을 성공적으로 마쳤습니다. 충분히 이완하세요.' }}
      </p>

      <!-- 핵심 결과 지표 그리드 -->
      <div class="apnea-stats-overview result-metrics">
        <div class="metric-tile">
          <div class="tile-title">최대 숨참기</div>
          <div class="tile-number action">{{ formatDuration(item.maxHoldSec) }}</div>
        </div>
        <div class="metric-tile">
          <div class="tile-title">첫 수축 시점</div>
          <div class="tile-number emerald">{{ item.firstContractionSec ? formatDuration(item.firstContractionSec) : '-' }}</div>
        </div>
        <div class="metric-tile">
          <div class="tile-title">완료 라운드</div>
          <div class="tile-number">{{ item.completedRounds }} / {{ item.totalRounds }}</div>
        </div>
        <div class="metric-tile">
          <div class="tile-title">총 훈련 시간</div>
          <div class="tile-number">{{ formatDuration(item.totalDurationSec) }}</div>
        </div>
      </div>

      <!-- 메모 입력 폼 -->
      <div class="result-memo-box">
        <CustomInput
          v-model="userNote"
          label="오늘의 훈련 메모 (컨디션, 특이사항 등)"
          placeholder="예: 2분 30초 대에서 강한 수축 옴, 릴랙스 양호"
        />
      </div>

      <!-- 완료 버튼 -->
      <div>
        <CustomButton
          variant="primary"
          size="lg"
          block
          @click="handleSave"
        >
          저장하고 대시보드로 이동
        </CustomButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApneaHistoryItem } from '@/types/apnea';
import { formatDuration } from '@/utils/apnea';
import { useApneaStore } from '@/stores/apnea';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';

const props = defineProps<{
  item: ApneaHistoryItem;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const apneaStore = useApneaStore();
const userNote = ref('');

const isNewPb = computed(() => {
  return props.item.maxHoldSec > (apneaStore.pbHoldSec || 0);
});

const handleSave = () => {
  const finalItem: ApneaHistoryItem = {
    ...props.item,
    note: userNote.value.trim() || undefined
  };
  apneaStore.addHistory(finalItem);
  emit('close');
};
</script>
