<template>
  <div class="custom-textarea">
    <!-- 입력 텍스트 영역 -->
    <textarea
      ref="textareaRef"
      v-model="value"
      class="grow-textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="onInput"
    ></textarea>

    <!-- 우측 하단 한계 수치 프로그레스 도넛 (SVG) -->
    <div v-if="maxLength > 0" class="textarea-limit-panel">
      <svg class="limit-donut-svg" viewBox="0 0 20 20">
        <!-- 배경 트랙 -->
        <circle 
          class="donut-track" 
          cx="10" 
          cy="10" 
          r="8" 
        />
        <!-- 전면 프로그레스 -->
        <circle 
          class="donut-fill" 
          :class="donutColorClass" 
          cx="10" 
          cy="10" 
          r="8" 
          :style="donutCircleStyle"
        />
      </svg>
      <!-- 미니 글자 수 텍스트 피드백 -->
      <span class="limit-text" :class="donutColorClass">
        {{ characterCount }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useAutoGrow } from '@/composables/useAutoGrow';

// Props 정의 (Strict TypeScript 구조 활용)
interface Props {
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '메모를 입력해주세요...',
  maxLength: 0,
  disabled: false,
  rows: 3
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

// 양방향 바인딩 writable computed
const value = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
});

const maxLengthRef = computed(() => props.maxLength);

// 핵심 비즈니스 로직은 컴포저블로 완벽 분리 (SoC 준수)
const {
  textareaRef,
  characterCount,
  characterPercentage,
  adjustHeight
} = useAutoGrow(value, maxLengthRef);

// SVG 원의 둘레 계산 (반지름 r = 8)
// 둘레(Circumference) = 2 * Math.PI * r = 2 * 3.14159 * 8 ≈ 50.27
const strokeCircumference = 50.27;

// 도넛 프로그레스 링 스타일 계산
const donutCircleStyle = computed(() => {
  const percentage = Math.min(Math.max(characterPercentage.value, 0), 100);
  const offset = strokeCircumference - (percentage / 100) * strokeCircumference;
  
  return {
    strokeDasharray: `${strokeCircumference}`,
    strokeDashoffset: `${offset}`
  };
});

// 한계치 근접율에 따른 색상 분기 클래스 반환
const donutColorClass = computed(() => {
  const pct = characterPercentage.value;
  if (pct >= 90) return 'is-danger';
  if (pct >= 70) return 'is-warning';
  return 'is-normal';
});

// 타이핑 입력 감지 시 높이 조절
const onInput = () => {
  adjustHeight();
};

// 최초 마운트 시 높이 맞추기
onMounted(() => {
  adjustHeight();
});

// 외부 값 변화 시(초기값 주입 포함) 세로 높이 동기화
watch(() => props.modelValue, () => {
  adjustHeight();
});
</script>
