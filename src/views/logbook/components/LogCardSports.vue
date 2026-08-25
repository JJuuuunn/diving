<template>
  <div class="log-card-item log-card--sports" :class="{ 'is-readonly': readonly }">
    <!-- 캡처 대상 본체 영역 (디지털 다이브 컴퓨터 HUD) -->
    <div
      ref="captureRef"
      class="log-card-visual design-sports is-freediving"
      @click="readonly ? emit('view', log) : undefined"
    >
      <!-- 컴퓨터 상단 상태 표시줄 -->
      <div class="sports-status-bar">
        <div class="status-left">
          <span class="mode-tag"><i class="fa-solid fa-gauge-high" aria-hidden="true"></i> APNEA TELEMETRY</span>
        </div>
        <div class="status-right">
          <span class="status-indicator"><i class="fa-solid fa-satellite-dish" aria-hidden="true"></i> GPS FIX</span>
          <span class="status-indicator"><i class="fa-solid fa-battery-full" aria-hidden="true"></i> 98%</span>
        </div>
      </div>

      <!-- 중앙 원형 대형 수심 다이얼 게이지 -->
      <div class="sports-hero-gauge">
        <div class="gauge-ring">
          <div class="gauge-content">
            <span class="gauge-label">MAX DEPTH</span>
            <div class="gauge-val-wrap">
              <span class="gauge-number">{{ displayLog.maxDepth }}</span>
              <span class="gauge-unit">M</span>
            </div>
            <span class="gauge-sub">{{ displayLog.discipline }} MODE</span>
          </div>
        </div>
      </div>

      <!-- 하단 4분할 디지털 텔레메트리 매트릭스 -->
      <div class="sports-metrics-matrix">
        <div class="matrix-cell">
          <span class="matrix-label"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> APNEA TIME</span>
          <strong class="matrix-value">{{ formatApneaTime(displayLog.apneaSeconds) }}</strong>
        </div>
        <div class="matrix-cell">
          <span class="matrix-label"><i class="fa-solid fa-temperature-half" aria-hidden="true"></i> WATER TEMP</span>
          <strong class="matrix-value">{{ displayLog.temp }}<small>℃</small></strong>
        </div>
        <div class="matrix-cell">
          <span class="matrix-label"><i class="fa-solid fa-repeat" aria-hidden="true"></i> SESSION DIVES</span>
          <strong class="matrix-value">{{ displayLog.diveCount }}<small>times</small></strong>
        </div>
        <div class="matrix-cell">
          <span class="matrix-label"><i class="fa-solid fa-weight-hanging" aria-hidden="true"></i> WEIGHT</span>
          <strong class="matrix-value">{{ displayLog.weightKg }}<small>kg</small></strong>
        </div>
      </div>

      <!-- 다이어리 메모 -->
      <div class="sports-memo-box">
        <span class="memo-title">LOG NOTE:</span>
        <p>{{ displayLog.notes || '안전 정지 및 수중 다이빙 로그 데이터가 정상 기록되었습니다.' }}</p>
      </div>

      <!-- 하단 메타 & 버디 인증 바 -->
      <div class="sports-footer-bar">
        <div class="location-stamp">
          <span class="loc-name"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> {{ displayLog.location }}</span>
          <span class="loc-date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ displayLog.date }}</span>
        </div>
        <div class="safety-diver-badge">
          <div class="buddy-text">
            <small>VERIFIED BY</small>
            <strong><i class="fa-solid fa-user" aria-hidden="true"></i> {{ displayLog.buddyName || 'Safety Diver' }}</strong>
          </div>
          <div v-if="displayLog.buddySignature" class="buddy-sig-thumb">
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
  const fileName = `freedive-computer-${props.log.date}-${props.log.location}.png`;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
  triggerToast('인스타그램 공유용 다이브 컴퓨터 이미지가 저장되었습니다! ⌚');
};

defineExpose({
  captureRef,
  saveCardAsImage
});
</script>
