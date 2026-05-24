<template>
  <div ref="containerRef" class="custom-select">
    <!-- 셀렉트 상단 활성화 트리거 바 -->
    <div 
      class="select-trigger" 
      :class="{ 'is-active': isOpen }" 
      @click="toggle"
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
      <div v-if="isOpen" class="select-dropdown">
        <div 
          v-for="opt in normalizedOptions" 
          :key="String(opt.value)" 
          class="option-item"
          :class="{ 'is-selected': opt.value === modelValue }"
          @click="select(opt.value)"
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
import type { SelectOption } from '@/types/inputs';

// Props 정의 (Strict TypeScript 선언)
interface Props {
  modelValue: any;
  options: any[] | SelectOption[];
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '선택해주세요'
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

// v-model 데이터 바인딩용 computed
const value = computed({
  get: () => props.modelValue,
  set: (val: any) => emit('update:modelValue', val)
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

// VueUse 활용: 셀렉트 박스 외부 클릭 시 자동 닫힘 바인딩
onClickOutside(containerRef, () => {
  close();
});
</script>
