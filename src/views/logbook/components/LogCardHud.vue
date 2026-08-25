<template>
  <div class="log-card-item" :class="[`log-card--${design}`, { 'is-drag-mode': isEditor }]">
    <!-- 캡처 대상 본체 영역 (고해상도 비주얼 포토 HUD 카드) -->
    <div
      ref="captureRef"
      class="log-card-visual design-hud is-freediving"
      :class="{ 'is-drag-mode': isEditor }"
      :style="backgroundStyle"
      @click="readonly ? emit('view', log) : undefined"
    >
      <!-- 배경 오버레이 (사진 가독성 강화) -->
      <div v-if="displayLog.photoUrl" class="hud-photo-overlay"></div>

      <!-- 1. Hero Depth Widget -->
      <div
        class="hud-drag-item hud-hero-stat"
        :class="{ 'is-draggable': isEditor, 'is-selected': selectedWidgetKey === 'heroStat' && isEditor }"
        :style="{
          left: `${hudLayout.heroStat?.x ?? 5}%`,
          top: `${hudLayout.heroStat?.y ?? 65}%`,
          transform: `scale(${hudLayout.heroStat?.scale ?? 1})`,
          transformOrigin: 'center center'
        }"
        @pointerdown="isEditor ? startDrag('heroStat', $event) : undefined"
        @touchstart="isEditor ? startDrag('heroStat', $event) : undefined"
        @wheel.prevent="isEditor ? handleWheelZoom('heroStat', $event) : undefined"
      >
        <div class="hero-stat-card">
          <span class="stat-label-tiny">MAX DEPTH</span>
          <div class="hero-primary-stat">
            <span class="hero-number">{{ displayLog.maxDepth }}</span>
            <span class="hero-unit">M</span>
          </div>
        </div>
      </div>

      <!-- 2. Tag Pills Widget -->
      <div
        class="hud-drag-item hud-subline"
        :class="{ 'is-draggable': isEditor, 'is-selected': selectedWidgetKey === 'subline' && isEditor }"
        :style="{
          left: `${hudLayout.subline?.x ?? 5}%`,
          top: `${hudLayout.subline?.y ?? 84}%`,
          transform: `scale(${hudLayout.subline?.scale ?? 1})`,
          transformOrigin: 'center center'
        }"
        @pointerdown="isEditor ? startDrag('subline', $event) : undefined"
        @touchstart="isEditor ? startDrag('subline', $event) : undefined"
        @wheel.prevent="isEditor ? handleWheelZoom('subline', $event) : undefined"
      >
        <div class="hud-tag-pills">
          <span class="tag-pill">
            <i class="fa-solid fa-stopwatch" aria-hidden="true"></i>
            {{ formatApneaTime(displayLog.apneaSeconds) }}
          </span>
          <span class="tag-pill">
            <i class="fa-solid fa-repeat" aria-hidden="true"></i>
            {{ displayLog.diveCount }}회
          </span>
          <span class="tag-pill">
            <i class="fa-solid fa-temperature-half" aria-hidden="true"></i>
            {{ displayLog.temp }}°C
          </span>
          <span class="tag-pill tag-pill--accent">
            #FreeDiving
          </span>
        </div>
      </div>

      <!-- 3. Top Location Badge Widget -->
      <div
        class="hud-drag-item hud-brand-badge"
        :class="{ 'is-draggable': isEditor, 'is-selected': selectedWidgetKey === 'brandBadge' && isEditor }"
        :style="{
          left: `${hudLayout.brandBadge?.x ?? 5}%`,
          top: `${hudLayout.brandBadge?.y ?? 5}%`,
          transform: `scale(${hudLayout.brandBadge?.scale ?? 1})`,
          transformOrigin: 'center center'
        }"
        @pointerdown="isEditor ? startDrag('brandBadge', $event) : undefined"
        @touchstart="isEditor ? startDrag('brandBadge', $event) : undefined"
        @wheel.prevent="isEditor ? handleWheelZoom('brandBadge', $event) : undefined"
      >
        <div class="hud-stamp-box">
          <p class="hud-loc-tag">📍 {{ displayLog.location }} · {{ displayLog.date }}</p>
        </div>
      </div>

      <!-- 4. HUD Dashboard Stats Widget -->
      <div
        class="hud-drag-item hud-right-stats"
        :class="{ 'is-draggable': isEditor, 'is-selected': selectedWidgetKey === 'rightStats' && isEditor }"
        :style="{
          left: `${hudLayout.rightStats?.x ?? 47}%`,
          top: `${hudLayout.rightStats?.y ?? 22}%`,
          transform: `scale(${hudLayout.rightStats?.scale ?? 1})`,
          transformOrigin: 'center center'
        }"
        @pointerdown="isEditor ? startDrag('rightStats', $event) : undefined"
        @touchstart="isEditor ? startDrag('rightStats', $event) : undefined"
        @wheel.prevent="isEditor ? handleWheelZoom('rightStats', $event) : undefined"
      >
        <div class="hud-dashboard-card">
          <div class="hud-card-header">
            <span class="hud-title">FREEDIVING RECORD</span>
            <span class="hud-dot"></span>
          </div>

          <div class="hud-stat-list">
            <div class="hud-stat-row">
              <small>DISCIPLINE</small>
              <strong>{{ displayLog.discipline }}</strong>
            </div>
            <div class="hud-stat-row">
              <small>MAX DEPTH</small>
              <strong>{{ displayLog.maxDepth }} m</strong>
            </div>
            <div class="hud-stat-row">
              <small>APNEA TIME</small>
              <strong>{{ formatApneaTime(displayLog.apneaSeconds) }}</strong>
            </div>
            <div class="hud-stat-row">
              <small>WEIGHT</small>
              <strong>{{ displayLog.weightKg }}kg</strong>
            </div>
            <div class="hud-stat-row" v-if="displayLog.buddyName">
              <small>SAFETY BUDDY</small>
              <strong>👤 {{ displayLog.buddyName }}</strong>
            </div>
          </div>

          <div v-if="displayLog.buddySignature" class="hud-sig-block">
            <span class="sig-title">APPROVED BY</span>
            <img :src="displayLog.buddySignature" alt="Buddy Signature" />
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 포토 HUD 레이아웃 & 크기 제어 툴바 (수정/작성 모드에서만 노출) -->
    <HudControlBar
      v-if="isEditor"
      :is-drag-mode="isDragMode"
      :current-preset-id="currentPresetId"
      :has-photo="Boolean(displayLog.photoUrl)"
      :selected-widget-key="selectedWidgetKey"
      :selected-widget-scale="currentSelectedScale"
      :presets="HUD_PRESETS"
      @toggle-drag="toggleDragMode"
      @reset="handleResetLayout"
      @select-preset="handleSelectPreset"
      @select-widget="selectWidget"
      @adjust-scale="handleAdjustScale"
      @set-scale="handleSetScale"
      @upload-photo="handlePhotoUploadFile"
      @remove-photo="removePhoto"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type {
  DiveLog,
  FreedivingDiveLog,
  HudLayoutMap,
  LogCardDesign,
  PhotoHudPreset
} from '@/types/logbook';
import { useCapture } from '@/composables/useCapture';
import { useToast } from '@/composables/useToast';
import { useHudDrag } from '@/composables/useHudDrag';
import { formatApneaTime } from '@/utils/logbook';
import CustomButton from '@/components/CustomButton.vue';
import HudControlBar from './HudControlBar.vue';

const props = withDefaults(
  defineProps<{
    log: DiveLog;
    displayLog: FreedivingDiveLog;
    design: LogCardDesign;
    readonly?: boolean;
    isEditor?: boolean;
  }>(),
  {
    readonly: false,
    isEditor: false
  }
);

const emit = defineEmits<{
  (event: 'delete', id: string): void;
  (event: 'edit', log: DiveLog): void;
  (event: 'view', log: DiveLog): void;
  (event: 'update:hudLayout', layout: HudLayoutMap): void;
  (event: 'update:photoUrl', photoUrl: string): void;
}>();

const { triggerToast } = useToast();
const captureRef = ref<HTMLElement | null>(null);
const { captureElement } = useCapture();

const {
  hudLayout,
  isDragMode,
  currentPresetId,
  selectedWidgetKey,
  HUD_PRESETS,
  startDrag,
  startResize,
  handleWheelZoom,
  toggleDragMode,
  selectWidget,
  setWidgetScale,
  adjustWidgetScale,
  applyPreset,
  resetLayout,
  syncLayout
} = useHudDrag({
  initialLayout: props.displayLog.hudLayout || props.log.hudLayout,
  defaultDragMode: props.isEditor,
  onLayoutChange: (newLayout: HudLayoutMap) => {
    emit('update:hudLayout', newLayout);
  }
});

watch(
  () => props.isEditor,
  (editorVal) => {
    isDragMode.value = editorVal;
  }
);

watch(
  () => props.displayLog.hudLayout || props.log.hudLayout,
  (newLayout) => {
    if (newLayout) {
      syncLayout(newLayout);
    }
  },
  { deep: true }
);

const currentSelectedScale = computed(() => {
  return hudLayout[selectedWidgetKey.value]?.scale ?? 1.0;
});

const handleAdjustScale = (delta: number) => {
  adjustWidgetScale(selectedWidgetKey.value, delta);
};

const handleSetScale = (scale: number) => {
  setWidgetScale(selectedWidgetKey.value, scale);
};

const backgroundStyle = computed(() => {
  if (props.displayLog.photoUrl) {
    return {
      backgroundImage: `url(${props.displayLog.photoUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
  return {};
});

const handleSelectPreset = (presetId: PhotoHudPreset) => {
  const label = applyPreset(presetId);
  if (label) {
    emit('update:hudLayout', JSON.parse(JSON.stringify(hudLayout)));
    triggerToast(`'${label}' 레이아웃이 적용되었습니다.`);
  }
};

const handleResetLayout = () => {
  resetLayout();
  emit('update:hudLayout', JSON.parse(JSON.stringify(hudLayout)));
  triggerToast("'하단 스포티' 기본 레이아웃으로 초기화되었습니다.");
};

const handlePhotoUploadFile = (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    return triggerToast('사진 용량은 5MB 이하만 가능합니다.', true);
  }

  const reader = new FileReader();
  reader.onload = (uploadEvent) => {
    const dataUrl = uploadEvent.target?.result as string;
    emit('update:photoUrl', dataUrl);
    triggerToast('배경 사진이 등록되었습니다! 📸');
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  emit('update:photoUrl', '');
  triggerToast('배경 사진이 삭제되었습니다.');
};

defineExpose({
  captureRef,
  saveCardAsImage: async () => {
    if (!captureRef.value) return;
    const dataUrl = await captureElement(captureRef.value);
    if (!dataUrl) return;
    const fileName = `freedive-hud-${props.log.date}-${props.log.location}.png`;
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = fileName;
    anchor.click();
    triggerToast('인스타그램 공유용 9:16 HUD 카드가 저장되었습니다! 📸');
  }
});
</script>
