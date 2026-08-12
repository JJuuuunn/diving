<template>
  <div ref="containerRef" class="custom-select">
    <!-- 셀렉트 상단 활성화 트리거 바 -->
    <div
      :id="id"
      class="select-trigger"
      :class="{ 'is-active': isOpen, 'is-disabled': disabled }"
      role="combobox"
      tabindex="0"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-disabled="disabled"
      :aria-label="ariaLabel"
      @click="toggleWhenEnabled"
      @keydown.enter.prevent="toggleWhenEnabled"
      @keydown.space.prevent="toggleWhenEnabled"
      @keydown.esc="close"
    >
      <div class="select-label">
        <span v-if="displayLabel">{{ displayLabel }}</span>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </div>
      <i
        class="fa-solid fa-chevron-down select-arrow"
        :class="{ 'is-open': isOpen }"
      ></i>
    </div>

    <!-- 옵션 리스트 드롭다운 팝업 -->
    <transition name="fade-slide">
      <div v-if="isOpen" class="select-dropdown" role="listbox">
        <div
          v-for="opt in normalizedOptions"
          :key="String(opt.value)"
          class="option-item"
          :class="{
            'is-selected': opt.value === modelValue,
            'is-disabled': opt.disabled
          }"
          role="option"
          :aria-selected="opt.value === modelValue"
          :aria-disabled="opt.disabled"
          :tabindex="opt.disabled ? -1 : 0"
          @click="selectOption(opt)"
          @keydown.enter.prevent="selectOption(opt)"
          @keydown.space.prevent="selectOption(opt)"
        >
          {{ opt.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useSelect } from '@/composables/useSelect';
import type { SelectOption, SelectProps } from '@/types/inputs';

const props = withDefaults(defineProps<SelectProps>(), {
  id: '',
  ariaLabel: '',
  placeholder: '선택해주세요',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

// v-model 데이터 바인딩용 computed
const value = computed({
  get: () => props.modelValue,
  set: (val: unknown) => emit('update:modelValue', val)
});

// 외부 옵션 배열의 동적 변화를 감지하기 위해 computed로 변환 후 전달
const reactiveOptions = computed(() => props.options);

// 핵심 비즈니스 로직은 useSelect 컴포저블로 완벽 위임 (Separation of Concerns)
const {
  isOpen,
  toggle,
  close,
  select,
  displayLabel,
  normalizedOptions
} = useSelect(value, reactiveOptions, props.placeholder);

const toggleWhenEnabled = (): void => {
  if (!props.disabled) toggle();
};

const selectOption = (option: SelectOption): void => {
  if (!option.disabled) select(option.value);
};

// VueUse 활용: 셀렉트 박스 외부 클릭 시 자동 닫힘 바인딩
onClickOutside(containerRef, () => {
  close();
});
</script>
