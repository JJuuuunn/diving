<template>
  <section class="card-design-picker" aria-labelledby="card-design-title">
    <div class="design-picker-heading">
      <div>
        <p class="eyebrow">CARD STYLE</p>
        <h2 id="card-design-title">로그 카드 디자인</h2>
      </div>
      <p>선택한 디자인은 화면과 다운로드 이미지에 함께 적용됩니다.</p>
    </div>

    <div class="design-preview-grid">
      <CustomButton
        v-for="option in designOptions"
        :key="option.value"
        class="design-preview-button"
        :class="{ 'is-selected': modelValue === option.value }"
        :aria-pressed="modelValue === option.value"
        @click="emit('update:modelValue', option.value)"
      >
        <span class="design-preview-card" :class="`design-${option.value}`" aria-hidden="true">
          <span class="preview-topline">
            <span>JEJU · 24.5M</span>
            <span class="preview-stamp">DIVE</span>
          </span>
          <span class="preview-metrics">
            <span><small>DEPTH</small><strong>24.5</strong></span>
            <span><small>TIME</small><strong>48</strong></span>
            <span><small>TEMP</small><strong>22°</strong></span>
          </span>
          <span class="preview-footer">
            <span class="preview-line"></span>
            <span class="mini-signature">JUN</span>
          </span>
        </span>
        <span class="design-copy">
          <strong>{{ option.label }}</strong>
          <small>{{ option.description }}</small>
        </span>
        <span v-if="modelValue === option.value" class="selected-badge">
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
  { value: 'ocean', label: 'Ocean Glass', description: '현재 해양 감성의 맑고 입체적인 카드' },
  { value: 'expedition', label: 'Expedition', description: '장비 로그처럼 단단하고 기술적인 카드' },
  { value: 'coral', label: 'Coral Current', description: '따뜻한 산호색을 담은 여행 기록 카드' },
  { value: 'minimal', label: 'Minimal Dive', description: '수치와 여백에 집중한 미니멀 카드' }
];
</script>
