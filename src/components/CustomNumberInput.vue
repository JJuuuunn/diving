<template>
  <div class="custom-number-input">
    <div class="number-stepper-container">
      <!-- 값 감소 버튼 -->
      <button
        type="button"
        class="stepper-btn"
        :disabled="isDecrementDisabled || disabled"
        @click="stepDown"
      >
        <i class="fa-solid fa-minus"></i>
      </button>

      <!-- 실제 숫자 입력 필드 -->
      <input
        type="number"
        class="stepper-input"
        v-model.number="value"
        :placeholder="placeholder"
        :disabled="disabled"
        @blur="onBlur"
        @keydown.enter="onBlur"
      />

      <!-- 값 증가 버튼 -->
      <button
        type="button"
        class="stepper-btn"
        :disabled="isIncrementDisabled || disabled"
        @click="stepUp"
      >
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useNumberInput } from '@/composables/useNumberInput';
import type { NumberInputProps } from '@/types/inputs';

const props = withDefaults(defineProps<NumberInputProps>(), {
  min: 0,
  max: Infinity,
  step: 1,
  placeholder: '0',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void;
}>();

// 양방향 바인딩 지원 writable computed
const value = computed({
  get: () => props.modelValue,
  set: (val: number) => emit('update:modelValue', val)
});

// 비즈니스 로직은 useNumberInput 컴포저블로 완벽 위임 (Separation of Concerns)
const {
  isDecrementDisabled,
  isIncrementDisabled,
  stepUp,
  stepDown,
  handleBlurValidation
} = useNumberInput(value, props);

// 포커스가 해제될 때(blur) 또는 엔터를 눌렀을 때 최종 수치 유효성 검증
const onBlur = () => {
  handleBlurValidation(value.value);
};
</script>
