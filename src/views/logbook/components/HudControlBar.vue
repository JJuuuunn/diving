<template>
  <div class="hud-control-bar" aria-label="HUD 사진 및 레이아웃 프리셋">
    <!-- 사진 등록/변경/삭제 -->
    <div class="control-photo-group">
      <label class="hud-photo-btn" :title="hasPhoto ? '배경 사진 변경' : '배경 사진 등록'">
        <i class="fa-solid fa-camera" aria-hidden="true"></i>
        <span>{{ hasPhoto ? '사진 변경' : '사진 등록' }}</span>
        <input
          type="file"
          accept="image/*"
          class="visually-hidden-input"
          @change="handlePhotoUpload"
        />
      </label>

      <CustomButton
        v-if="hasPhoto"
        class="hud-photo-del-btn"
        aria-label="배경 사진 삭제"
        @click="emit('removePhoto')"
      >
        <i class="fa-solid fa-image-slash" aria-hidden="true"></i>
      </CustomButton>
    </div>

    <!-- 레이아웃 프리셋 -->
    <div class="preset-grid">
      <CustomButton
        v-for="preset in presets"
        :key="preset.id"
        size="xs"
        class="hud-preset-chip"
        :class="{ 'is-active': currentPresetId === preset.id }"
        :aria-pressed="currentPresetId === preset.id"
        @click="emit('selectPreset', preset.id)"
      >
        <i class="fa-solid" :class="preset.icon" aria-hidden="true"></i>
        <span>{{ preset.label }}</span>
      </CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HudLayoutMap, PhotoHudPreset } from '@/types/logbook';
import CustomButton from '@/components/CustomButton.vue';

withDefaults(
  defineProps<{
    isDragMode?: boolean;
    currentPresetId: PhotoHudPreset;
    hasPhoto?: boolean;
    selectedWidgetKey?: keyof HudLayoutMap;
    selectedWidgetScale?: number;
    presets: Array<{
      id: PhotoHudPreset;
      label: string;
      icon: string;
    }>;
  }>(),
  {
    isDragMode: false,
    hasPhoto: false,
    selectedWidgetKey: 'heroStat',
    selectedWidgetScale: 1.0
  }
);

const emit = defineEmits<{
  (event: 'toggleDrag'): void;
  (event: 'reset'): void;
  (event: 'selectPreset', id: PhotoHudPreset): void;
  (event: 'selectWidget', key: keyof HudLayoutMap): void;
  (event: 'adjustScale', delta: number): void;
  (event: 'setScale', scale: number): void;
  (event: 'uploadPhoto', file: File): void;
  (event: 'removePhoto'): void;
}>();

const handlePhotoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('uploadPhoto', file);
    target.value = '';
  }
};
</script>
