<template>
  <div class="log-card-item log-card--ticket" :class="{ 'is-readonly': readonly }">
    <!-- 캡처 대상 본체 영역 (다이브 보딩패스 티켓) -->
    <div
      ref="captureRef"
      class="log-card-visual design-ticket is-freediving"
      @click="readonly ? emit('view', log) : undefined"
    >
      <!-- 티켓 상단 헤더 -->
      <div class="ticket-header">
        <div class="airline-brand">
          <i class="fa-solid fa-plane-departure" aria-hidden="true"></i>
          <span>OCEAN EXPEDITION BOARDING PASS</span>
        </div>
        <div class="ticket-class-badge">
          <span>FREEDIVING CLASS · GATE 01</span>
        </div>
      </div>

      <!-- 티켓 메인 바디 & 절취 스텁 가로 분할 그리드 -->
      <div class="ticket-grid">
        <!-- 티켓 본권 (Main Pass) -->
        <div class="ticket-main-section">
          <div class="ticket-route-row">
            <div class="route-point">
              <span class="route-code">SURFACE</span>
              <span class="route-sub">0.0 M</span>
            </div>
            <div class="route-arrow">
              <span class="flight-line"></span>
              <i class="fa-solid fa-arrow-down-long" aria-hidden="true"></i>
              <span class="flight-tag">{{ displayLog.discipline }}</span>
            </div>
            <div class="route-point">
              <span class="route-code">{{ displayLog.maxDepth }}<small>M</small></span>
              <span class="route-sub">MAX DEPTH</span>
            </div>
          </div>

          <div class="ticket-info-columns">
            <div class="info-block">
              <span class="info-label">APNEA TIME</span>
              <strong class="info-val">{{ formatApneaTime(displayLog.apneaSeconds) }}</strong>
            </div>
            <div class="info-block">
              <span class="info-label">DIVE COUNT</span>
              <strong class="info-val">{{ displayLog.diveCount }} 회</strong>
            </div>
            <div class="info-block">
              <span class="info-label">WATER TEMP</span>
              <strong class="info-val">{{ displayLog.temp }} ℃</strong>
            </div>
            <div class="info-block">
              <span class="info-label">WEIGHT</span>
              <strong class="info-val">{{ displayLog.weightKg }} kg</strong>
            </div>
          </div>

          <div class="ticket-notes-box">
            <span class="notes-tag">MEMO</span>
            <p>{{ displayLog.notes || '고요하고 푸른 바다의 깊은 평온함을 기록했습니다.' }}</p>
          </div>
        </div>

        <!-- 수직 점선 절취선 (Perforated Line for horizontal ticket) -->
        <div class="ticket-perforated-line">
          <span class="notch notch-top"></span>
          <span class="dashed-line"></span>
          <span class="notch notch-bottom"></span>
        </div>

        <!-- 티켓 스텁 (Right Stub) -->
        <div class="ticket-stub-section">
          <div class="stub-meta">
            <span class="stub-loc-label">LOCATION</span>
            <strong class="stub-loc-name">{{ displayLog.location }}</strong>
            <span class="stub-date">📅 {{ displayLog.date }}</span>
          </div>

          <div class="stub-safety-box">
            <span class="safety-title">SAFETY BUDDY</span>
            <span class="safety-name">👤 {{ displayLog.buddyName || 'Safety Diver' }}</span>
            <div v-if="displayLog.buddySignature" class="stub-sig-stamp">
              <img :src="displayLog.buddySignature" alt="Buddy Signature" />
            </div>
          </div>

          <!-- 바코드 그래픽 -->
          <div class="ticket-barcode-box">
            <div class="barcode-lines" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <span class="barcode-num">#FD-{{ displayLog.id.slice(0, 8).toUpperCase() }}</span>
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
  const fileName = `freedive-boardingpass-${props.log.date}-${props.log.location}.png`;
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
  triggerToast('항공권 보딩패스 티켓 이미지가 저장되었습니다! 🎫');
};

defineExpose({
  captureRef,
  saveCardAsImage
});
</script>
