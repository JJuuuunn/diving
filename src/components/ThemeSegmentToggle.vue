<template>
  <div class="theme-segment-toggle-container">
    <div
      class="theme-segment-toggle"
      :class="[
        `theme-segment-toggle--${currentMode}`,
        getSizeClass('theme-segment-toggle', size),
        { 'is-expanded': expanded }
      ]"
      :style="{ '--active-index': activeIndex }"
      role="region"
      aria-label="4단계 비주얼 테마 선택기"
    >
      <!-- 1. 확장형 (Expanded): 4개 테마(Light, Dark, Coral, Abyss) 세그먼트 버튼 모음 -->
      <template v-if="expanded">
        <button
          v-for="opt in themeOptions"
          :key="opt.mode"
          type="button"
          class="theme-segment-toggle__option"
          :class="{ 'is-active': currentMode === opt.mode }"
          :title="`${opt.title} 테마로 전환`"
          @click="selectMode(opt.mode)"
        >
          <span class="theme-segment-toggle__icon" v-html="opt.icon"></span>
          <span class="theme-segment-toggle__label">{{ opt.label }}</span>
        </button>
      </template>

      <!-- 2. 컴팩트 축소형 (Compact): 1버튼 순환 버튼 -->
      <template v-else>
        <button
          type="button"
          class="theme-segment-toggle__option theme-segment-toggle__option--single"
          :title="currentSrText + ' (클릭 시 4개 테마 순환 전환)'"
          @click="handleCompactClick"
        >
          <span class="theme-segment-toggle__icon" v-html="currentIcon"></span>
        </button>
      </template>

      <!-- 순수 슬라이딩 백그라운드 인디케이터 필 (정밀 수식 기반 정렬) -->
      <span
        class="theme-segment-toggle__indicator"
        :class="`theme-segment-toggle__indicator--${currentMode}`"
        aria-hidden="true"
      ></span>
      <span class="sr-only">{{ currentSrText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ComponentSize } from '@/types/inputs';
import type { ThemeMode } from '@/stores/theme';
import { useThemeStore } from '@/stores/theme';
import { getSizeClass } from '@/utils/size';
import sunIcon from '@/assets/icons/sun.svg?raw';
import moonStarsIcon from '@/assets/icons/moon-stars.svg?raw';

const coralIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 0a4 4 0 0 1 4 4v2a2 2 0 0 0 2 2h1a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1h1a2 2 0 0 0 2-2v-2a4 4 0 0 1 4-4Z"/><circle cx="12" cy="18" r="1"/></svg>`;
const abyssIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

export interface ThemeSegmentToggleProps {
  expanded?: boolean;
  size?: ComponentSize;
}

const props = withDefaults(defineProps<ThemeSegmentToggleProps>(), {
  expanded: true,
  size: 'md'
});

const emit = defineEmits<{
  (event: 'update:mode', mode: ThemeMode): void;
  (event: 'change', mode: ThemeMode): void;
}>();

const themeStore = useThemeStore();
const currentMode = computed(() => themeStore.themeMode);

const activeIndex = computed(() => {
  switch (currentMode.value) {
    case 'light': return 0;
    case 'dark': return 1;
    case 'coral': return 2;
    case 'abyss': return 3;
    default: return 0;
  }
});

const themeOptions: { mode: ThemeMode; label: string; icon: string; title: string }[] = [
  { mode: 'light', label: 'LIGHT', icon: sunIcon, title: '라이트 해변' },
  { mode: 'dark', label: 'DARK', icon: moonStarsIcon, title: '다크 심해' },
  { mode: 'coral', label: 'CORAL', icon: coralIcon, title: '산호초 코랄' },
  { mode: 'abyss', label: 'ABYSS', icon: abyssIcon, title: '초심해 어비스' }
];

const currentIcon = computed(() => {
  switch (currentMode.value) {
    case 'coral': return coralIcon;
    case 'abyss': return abyssIcon;
    case 'dark': return moonStarsIcon;
    case 'light':
    default: return sunIcon;
  }
});

const currentSrText = computed(() => {
  switch (currentMode.value) {
    case 'light': return '라이트 해변 테마 사용 중';
    case 'dark': return '다크 심해 테마 사용 중';
    case 'coral': return '산호초 코랄 테마 사용 중';
    case 'abyss': return '초심해 어비스 테마 사용 중';
  }
});

const selectMode = (mode: ThemeMode): void => {
  themeStore.setThemeMode(mode);
  emit('update:mode', mode);
  emit('change', mode);
};

const handleCompactClick = (): void => {
  themeStore.toggleTheme();
  emit('update:mode', themeStore.themeMode);
  emit('change', themeStore.themeMode);
};
</script>
