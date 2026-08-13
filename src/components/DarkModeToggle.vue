<template>
  <div class="theme-toggle-container">
    <button
      type="button"
      class="theme-toggle"
      :class="[
        `theme-toggle--${currentMode}`,
        getSizeClass('theme-toggle', size),
        { 'is-day': isDay, 'is-expanded': expanded }
      ]"
      :aria-label="toggleLabel"
      :aria-pressed="!isDay"
      @click="handleToggleClick"
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
      <span class="sr-only">{{ currentSrText }}</span>
    </button>

    <ThemeSelectorModal
      v-model:is-open="isModalOpen"
      @select="handleModalSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DarkModeToggleProps } from '@/types/components';
import type { ThemeMode } from '@/stores/theme';
import { useThemeStore } from '@/stores/theme';
import { getSizeClass } from '@/utils/size';
import ThemeSelectorModal from '@/components/ThemeSelectorModal.vue';
import sunIcon from '@/assets/icons/sun.svg?raw';
import moonStarsIcon from '@/assets/icons/moon-stars.svg?raw';

const props = withDefaults(defineProps<DarkModeToggleProps>(), {
  modelValue: true,
  expanded: false,
  size: 'md'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'update:mode', mode: ThemeMode): void;
  (event: 'change', mode: ThemeMode): void;
}>();

const themeStore = useThemeStore();
const isModalOpen = ref(false);

const currentMode = computed(() => themeStore.themeMode);
const isDay = computed(() => !themeStore.isDark);

const currentIcon = computed(() => {
  switch (currentMode.value) {
    case 'coral':
    case 'light':
      return sunIcon;
    case 'abyss':
    case 'dark':
    default:
      return moonStarsIcon;
  }
});

const currentLabel = computed(() => {
  switch (currentMode.value) {
    case 'light': return 'LIGHT';
    case 'dark': return 'DARK';
    case 'coral': return 'CORAL';
    case 'abyss': return 'ABYSS';
    default: return 'LIGHT';
  }
});

const toggleLabel = computed(() => (
  isDay.value ? '다크 모드로 전환 (테마 선택)' : '라이트 모드로 전환 (테마 선택)'
));

const currentSrText = computed(() => {
  switch (currentMode.value) {
    case 'light': return '라이트 해변 테마 사용 중';
    case 'dark': return '다크 심해 테마 사용 중';
    case 'coral': return '산호초 코랄 테마 사용 중';
    case 'abyss': return '초심해 어비스 테마 사용 중';
  }
});

const handleToggleClick = (event: MouseEvent): void => {
  if (event.shiftKey) {
    themeStore.toggleTheme();
    emit('update:modelValue', isDay.value);
    emit('update:mode', themeStore.themeMode);
    emit('change', themeStore.themeMode);
  } else {
    isModalOpen.value = true;
  }
};

const handleModalSelect = (mode: ThemeMode): void => {
  emit('update:modelValue', isDay.value);
  emit('update:mode', mode);
  emit('change', mode);
};
</script>
