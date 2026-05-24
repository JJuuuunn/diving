<template>
  <div 
    class="custom-switch-container" 
    :class="{ 'is-disabled': disabled }"
  >
    <!-- 활성 슬라이딩 배경 필 -->
    <div 
      class="switch-sliding-pill" 
      :class="{ 'is-active': value }"
    ></div>

    <!-- 비활성 상태 버튼 (false) -->
    <button
      type="button"
      class="switch-option-btn"
      :class="{ 'is-selected': !value }"
      :disabled="disabled"
      @click="setFalse"
    >
      <i v-if="inactiveIcon" :class="['fa-solid', inactiveIcon, 'switch-icon']"></i>
      <span>{{ inactiveText }}</span>
    </button>

    <!-- 활성 상태 버튼 (true) -->
    <button
      type="button"
      class="switch-option-btn"
      :class="{ 'is-selected': value }"
      :disabled="disabled"
      @click="setTrue"
    >
      <i v-if="activeIcon" :class="['fa-solid', activeIcon, 'switch-icon']"></i>
      <span>{{ activeText }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useElasticToggle } from '@/composables/useElasticToggle';

// Props 정의 (Strict TypeScript 선언)
interface Props {
  modelValue: boolean;
  activeText: string;
  inactiveText: string;
  activeIcon?: string;
  inactiveIcon?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

// v-model 데이터 바인딩 computed
const value = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

// 비즈니스 스위칭 상태 로직 컴포저블 위임 (SoC 준수)
const { setTrue, setFalse } = useElasticToggle(value);
</script>
