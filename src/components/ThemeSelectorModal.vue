<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="theme-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="theme-modal-content">
        <header class="theme-modal-header">
          <div class="header-title-group">
            <span class="header-icon" aria-hidden="true">🎨</span>
            <h2 id="theme-modal-title">비주얼 테마 선택</h2>
          </div>
          <CustomButton class="modal-close-btn" aria-label="테마 선택 모달 닫기" @click="close">
            &times;
          </CustomButton>
        </header>

        <p class="theme-modal-description">
          바다의 분위기에 어울리는 4가지 전용 비주얼 테마를 선택해 보세요.
        </p>

        <div class="theme-options-grid" role="radiogroup" aria-label="테마 선택 목록">
          <button
            v-for="option in themeOptions"
            :key="option.id"
            type="button"
            class="theme-card-option"
            :class="{ 'is-active': currentMode === option.id }"
            role="radio"
            :aria-checked="currentMode === option.id"
            @click="selectMode(option.id)"
          >
            <div class="theme-card-header">
              <span class="theme-emoji" aria-hidden="true">{{ option.emoji }}</span>
              <div class="theme-title-wrap">
                <span class="theme-name">{{ option.name }}</span>
                <span class="theme-badge" :style="{ color: option.accentColor }">{{ option.badgeText }}</span>
              </div>
              <span v-if="currentMode === option.id" class="active-check" aria-hidden="true">✓</span>
            </div>

            <p class="theme-desc">{{ option.description }}</p>

            <div class="theme-preview-bar" :style="{ background: option.previewBg }">
              <span class="preview-dot" :style="{ background: option.accentColor }"></span>
              <span class="preview-line" :style="{ background: option.accentColor }"></span>
            </div>
          </button>
        </div>

        <footer class="theme-modal-footer">
          <CustomButton variant="secondary" @click="close">닫기</CustomButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '@/stores/theme';
import { useThemeStore } from '@/stores/theme';
import CustomButton from '@/components/CustomButton.vue';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  emoji: string;
  description: string;
  badgeText: string;
  previewBg: string;
  accentColor: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    name: '라이트 해변',
    emoji: '☀️',
    description: '맑고 투명한 햇살 아래 빛나는 밝은 해변 샌드 모드',
    badgeText: 'LIGHT BEACH',
    previewBg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    accentColor: '#0284c7'
  },
  {
    id: 'dark',
    name: '다크 심해',
    emoji: '🌙',
    description: '아늑하고 차분한 깊은 바다속 심해 다크 모드',
    badgeText: 'DARK SEA',
    previewBg: 'linear-gradient(135deg, #0f172a, #1e293b)',
    accentColor: '#38bdf8'
  },
  {
    id: 'coral',
    name: '산호초 코랄',
    emoji: '🪸',
    description: '따뜻한 샌드 워터버블과 코랄 오렌지 & 티일 모드',
    badgeText: 'CORAL REEF',
    previewBg: 'linear-gradient(135deg, #fdfaf6, #f3e8dc)',
    accentColor: '#f0533c'
  },
  {
    id: 'abyss',
    name: '초심해 어비스',
    emoji: '🌌',
    description: '딥 미드나이트 스페이스 네이비와 형광 네온 모드',
    badgeText: 'ABYSS OCEAN',
    previewBg: 'linear-gradient(135deg, #040814, #0b193c)',
    accentColor: '#00f2fe'
  }
];

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false
  }
);

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'close'): void;
  (e: 'select', mode: ThemeMode): void;
}>();

const themeStore = useThemeStore();
const currentMode = computed(() => themeStore.themeMode);

const close = () => {
  emit('update:isOpen', false);
  emit('close');
};

const selectMode = (mode: ThemeMode) => {
  themeStore.setThemeMode(mode);
  emit('select', mode);
  close();
};
</script>
