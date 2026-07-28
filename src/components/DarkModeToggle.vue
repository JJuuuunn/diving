<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{ 'is-day': isDay, 'is-expanded': expanded }"
    :aria-label="toggleLabel"
    :aria-pressed="!isDay"
    @click="toggle"
  >
    <span class="theme-toggle__ambient" aria-hidden="true"></span>
    <span class="theme-toggle__option theme-toggle__option--day" aria-hidden="true">
      <span class="theme-toggle__icon" v-html="sunIcon"></span>
      <span class="theme-toggle__label">LIGHT</span>
    </span>
    <span class="theme-toggle__option theme-toggle__option--night" aria-hidden="true">
      <span class="theme-toggle__icon" v-html="moonStarsIcon"></span>
      <span class="theme-toggle__label">DARK</span>
    </span>
    <span class="theme-toggle__indicator" aria-hidden="true">
      <span class="theme-toggle__indicator-icon" v-html="currentIcon"></span>
      <span class="theme-toggle__indicator-label">{{ currentLabel }}</span>
    </span>
    <span class="sr-only">{{ isDay ? '라이트 모드 사용 중' : '다크 모드 사용 중' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DarkModeToggleProps } from '@/types/components';
import sunIcon from '@/assets/icons/sun.svg?raw';
import moonStarsIcon from '@/assets/icons/moon-stars.svg?raw';

const props = withDefaults(defineProps<DarkModeToggleProps>(), {
  modelValue: true,
  expanded: false,
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const isDay = computed(() => props.modelValue);
const currentIcon = computed(() => (isDay.value ? sunIcon : moonStarsIcon));
const currentLabel = computed(() => (isDay.value ? 'LIGHT' : 'DARK'));
const toggleLabel = computed(() => (
  isDay.value ? '다크 모드로 전환' : '라이트 모드로 전환'
));

const toggle = (): void => {
  emit('update:modelValue', !isDay.value);
};
</script>
