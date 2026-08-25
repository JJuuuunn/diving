<template>
  <div class="log-card-item log-card--classic" :class="{ 'is-readonly': readonly }">
    <!-- 캡처 대상 본체 영역 (고해상도 클래식 비주얼 카드) -->
    <div
      ref="captureRef"
      class="log-card-visual design-classic is-freediving"
      :class="`design-${design}`"
      @click="readonly ? emit('view', log) : undefined"
    >
      <!-- 헤더 메타 -->
      <div class="card-header-meta">
        <div class="loc-info">
          <h4 class="loc-title"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> {{ displayLog.location }}</h4>
          <span class="date-label"><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ displayLog.date }}</span>
        </div>
        <div class="stamp-logo freediving-stamp">
          <i class="fa-solid fa-fish" aria-hidden="true"></i>
          FREE DIVE
        </div>
      </div>

      <!-- 계기판 그리드 -->
      <div class="metrics-grid">
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i></div>
          <span class="cell-label">Max Depth</span>
          <div class="cell-value">{{ displayLog.maxDepth }}<span>m</span></div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon">
            <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
          </div>
          <span class="cell-label">Dive Count</span>
          <div class="cell-value">
            {{ displayLog.diveCount }}
            <span>times</span>
          </div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-temperature-half" aria-hidden="true"></i></div>
          <span class="cell-label">Water Temp</span>
          <div class="cell-value">{{ displayLog.temp }}<span>℃</span></div>
        </div>
      </div>

      <!-- 프리다이빙 전용 무호흡 상세 대시보드 -->
      <div class="metrics-grid">
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i></div>
          <span class="cell-label">Apnea Time</span>
          <div class="cell-value">{{ formatApneaTime(displayLog.apneaSeconds) }}</div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-person-swimming" aria-hidden="true"></i></div>
          <span class="cell-label">Discipline</span>
          <div class="cell-value text-highlight">{{ displayLog.discipline }}</div>
        </div>
        <div class="metric-cell">
          <div class="cell-icon"><i class="fa-solid fa-weight-hanging" aria-hidden="true"></i></div>
          <span class="cell-label">Weight</span>
          <div class="cell-value">
            {{ displayLog.weightKg }}<span>kg</span>
          </div>
        </div>
      </div>

      <!-- 다이어리 노트 -->
      <div class="log-notes-section">
        {{ displayLog.notes || '기록된 로그 내용이 없습니다. 고요한 수중의 평온함을 남겨보세요!' }}
      </div>

      <!-- 푸터 버디 & 서명 -->
      <div class="card-footer-buddy">
        <div class="buddy-info">
          <span class="label">Safety Buddy</span>
          <div class="value"><i class="fa-solid fa-user" aria-hidden="true"></i> {{ displayLog.buddyName || '익명의 버디' }}</div>
        </div>

        <div class="buddy-sig-holder" v-if="displayLog.buddySignature">
          <span class="label">Buddy Signature</span>
          <div class="sig-img-box">
            <img :src="displayLog.buddySignature" alt="Buddy Signature" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { DiveLog, FreedivingDiveLog, LogCardDesign } from '@/types/logbook';
import { useCapture } from '@/composables/useCapture';
import { useToast } from '@/composables/useToast';
import { formatApneaTime } from '@/utils/logbook';
import CustomButton from '@/components/CustomButton.vue';

const props = withDefaults(
  defineProps<{
    log: DiveLog;
    displayLog: FreedivingDiveLog;
    design: LogCardDesign;
    readonly?: boolean;
    isEditor?: boolean;
  }>(),
  {
    readonly: false,
    isEditor: false
  }
);

const emit = defineEmits<{
  (event: 'delete', id: string): void;
  (event: 'edit', log: DiveLog): void;
  (event: 'view', log: DiveLog): void;
}>();

const { triggerToast } = useToast();
const captureRef = ref<HTMLElement | null>(null);
const { isCapturing, captureElement } = useCapture();

const saveCardAsImage = async () => {
  if (!captureRef.value) return;
  const dataUrl = await captureElement(captureRef.value);
  if (!dataUrl) return;
  const fileName = `freedive-log-${props.log.date}-${props.log.location}.png`;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
  triggerToast('로그북 카드 이미지가 저장되었습니다! 📘');
};

defineExpose({
  captureRef,
  saveCardAsImage
});
</script>
