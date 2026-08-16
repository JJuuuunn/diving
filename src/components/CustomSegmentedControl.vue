<template>
  <div
    class="custom-segmented-control-container"
    :class="{ 'is-block': block }"
  >
    <div
      class="custom-segmented-control"
      :class="[
        getSizeClass('custom-segmented-control', size),
        {
          'is-disabled': disabled,
          'is-single-option': normalizedOptions.length === 1
        }
      ]"
      :style="controlStyle"
      role="radiogroup"
      :aria-disabled="disabled"
    >
      <!-- 옵션 세그먼트 버튼 목록 -->
      <button
        v-for="(opt, idx) in normalizedOptions"
        :key="String(opt.value)"
        type="button"
        class="custom-segmented-control__option"
        :class="{
          'is-active': activeIndex === idx,
          'is-disabled': opt.disabled || disabled
        }"
        role="radio"
        :aria-checked="activeIndex === idx"
        :aria-disabled="opt.disabled || disabled"
        :disabled="opt.disabled || disabled"
        @click="handleSelect(opt, idx)"
      >
        <span v-if="opt.icon" class="custom-segmented-control__icon" v-html="opt.icon"></span>
        <span class="custom-segmented-control__label">{{ opt.label }}</span>
      </button>

      <!-- 슬라이딩 인디케이터 백그라운드 필 (0.000px 수식 정렬) -->
      <span
        class="custom-segmented-control__indicator"
        aria-hidden="true"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SegmentedControlProps, SegmentedItem, SegmentedOption } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';

const props = withDefaults(defineProps<SegmentedControlProps>(), {
  modelValue: undefined,
  size: 'md',
  block: false,
  disabled: false,
  compactCycle: true
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: unknown): void;
  (event: 'change', value: unknown): void;
}>();

// 옵션 배열 데이터 정규화
const normalizedOptions = computed<SegmentedOption[]>(() => {
  if (!props.options || props.options.length === 0) {
    return [{ value: 'default', label: 'Option' }];
  }
  return props.options.map((item: SegmentedItem) => {
    if (typeof item === 'object' && item !== null && 'value' in item && 'label' in item) {
      return item as SegmentedOption;
    }
    return { value: item, label: String(item) };
  });
});

// 현재 선택된 항목의 인덱스계산
const activeIndex = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) {
    return 0;
  }
  const foundIdx = normalizedOptions.value.findIndex(
    (opt) => opt.value === props.modelValue
  );
  return foundIdx >= 0 ? foundIdx : 0;
});

// 수식 계산용 인라인 스타일
const controlStyle = computed(() => {
  const count = Math.max(1, normalizedOptions.value.length);
  return {
    '--active-index': activeIndex.value,
    '--segment-count': count
  };
});

const handleSelect = (opt: SegmentedOption, idx: number): void => {
  if (props.disabled || opt.disabled) return;

  // 옵션이 1개이고 compactCycle 모드인 경우 다음 상태로 순환 토글 방어
  if (normalizedOptions.value.length === 1 && props.compactCycle) {
    emit('update:modelValue', opt.value);
    emit('change', opt.value);
    return;
  }

  emit('update:modelValue', opt.value);
  emit('change', opt.value);
};
</script>
