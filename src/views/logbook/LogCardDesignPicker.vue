<template>
  <section class="card-design-picker" aria-labelledby="card-design-title">
    <div class="design-picker-heading">
      <div>
        <p class="eyebrow">CARD STYLE</p>
        <h2 id="card-design-title">로그 카드 디자인 선택</h2>
      </div>
      <p>이 로그에 적용할 카드 디자인을 선택하세요.</p>
    </div>

    <div class="design-preview-grid">
      <CustomButton
        v-for="option in designOptions"
        :key="option.value"
        class="design-preview-button"
        :class="{ 'is-selected': modelValue === option.value || (modelValue === 'garmin' && option.value === 'hud') || (['ocean', 'expedition', 'coral', 'minimal'].includes(modelValue) && option.value === 'classic') }"
        :aria-pressed="modelValue === option.value"
        @click="emit('update:modelValue', option.value)"
      >
        <!-- 1. HUD Preview -->
        <template v-if="option.value === 'hud'">
          <span class="design-preview-card design-hud hud-picker-preview" aria-hidden="true">
            <span class="hud-picker-top">📍 K26 · 08.25</span>
            <span class="hud-picker-hero">
              <strong>35.0</strong><small>M</small>
            </span>
            <span class="hud-picker-subline">⏱️ 01:45 #FreeDiving</span>
          </span>
        </template>

        <!-- 2. Boarding Pass Ticket Preview -->
        <template v-else-if="option.value === 'ticket'">
          <span class="design-preview-card design-ticket ticket-picker-preview" aria-hidden="true">
            <span class="ticket-preview-header">BOARDING PASS</span>
            <span class="ticket-preview-route">0m ➔ <strong>35m</strong></span>
            <span class="ticket-preview-dash"></span>
            <span class="ticket-preview-barcode">|||| | | ||||</span>
          </span>
        </template>

        <!-- 3. Digital Sports Computer Preview -->
        <template v-else-if="option.value === 'sports'">
          <span class="design-preview-card design-sports sports-picker-preview" aria-hidden="true">
            <span class="sports-preview-mode">APNEA GPS</span>
            <span class="sports-preview-circle">
              <strong>35.0</strong><small>m</small>
            </span>
            <span class="sports-preview-stats">01:45 · 22℃</span>
          </span>
        </template>

        <!-- 4. Classic Journal Card Preview -->
        <template v-else>
          <span class="design-preview-card design-classic" aria-hidden="true">
            <span class="preview-topline">
              <span>JEJU · 35M</span>
              <span class="preview-stamp">DIVE</span>
            </span>
            <span class="preview-metrics">
              <span><small>DEPTH</small><strong>35m</strong></span>
              <span><small>TIME</small><strong>01:45</strong></span>
              <span><small>TEMP</small><strong>22°</strong></span>
            </span>
            <span class="preview-footer">
              <span class="preview-line"></span>
              <span class="mini-signature">JUN</span>
            </span>
          </span>
        </template>

        <span class="design-copy">
          <strong>{{ option.label }}</strong>
          <small>{{ option.description }}</small>
        </span>
        <span v-if="modelValue === option.value || (modelValue === 'garmin' && option.value === 'hud') || (['ocean', 'expedition', 'coral', 'minimal'].includes(modelValue) && option.value === 'classic')" class="selected-badge">
          <i class="fa-solid fa-check" aria-hidden="true"></i> 선택됨
        </span>
      </CustomButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LogCardDesign } from '@/types/logbook';
import CustomButton from '@/components/CustomButton.vue';

defineProps<{
  modelValue: LogCardDesign;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: LogCardDesign): void;
}>();

const designOptions: Array<{
  value: LogCardDesign;
  label: string;
  description: string;
}> = [
  { value: 'hud', label: '📸 수중 포토 HUD', description: '수중 사진 위 투명 오버레이 & 자유 드래그 위젯' },
  { value: 'ticket', label: '🎫 다이브 보딩패스', description: '탑승권 감성의 절취선, 바코드, 스탬프 여행 카드' },
  { value: 'sports', label: '⌚ 디지털 다이브컴', description: '스마트 다이브 컴퓨터 스타일 네온 디지털 텔레메트리' },
  { value: 'classic', label: '🌊 클래식 저널', description: '심플한 3단 계기판과 다이어리 감성의 정석 카드' }
];
</script>
