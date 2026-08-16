<template>
  <div
    class="custom-slider"
    :class="[
      getSizeClass('custom-slider', size),
      { 'is-disabled': disabled, 'is-range': isRange }
    ]"
  >
    <div
      ref="trackRef"
      class="custom-slider__track-wrapper"
      @pointerdown="onTrackPointerDown"
    >
      <div class="custom-slider__track">
        <!-- Active highlighted fill -->
        <div class="custom-slider__fill" :style="fillStyle"></div>

        <!-- Ticks -->
        <template v-if="showTicks && tickPositions.length">
          <span
            v-for="(tick, idx) in tickPositions"
            :key="idx"
            class="custom-slider__tick"
            :class="{ 'is-active': tick.active }"
            :style="{ left: `${tick.percent}%` }"
          ></span>
        </template>

        <!-- Thumb 1 (or single thumb) -->
        <div
          ref="thumb1Ref"
          class="custom-slider__thumb"
          :class="{ 'is-dragging': activeThumbIndex === 0 }"
          role="slider"
          :aria-valuenow="val1"
          :aria-valuemin="min"
          :aria-valuemax="isRange ? val2 : max"
          :aria-disabled="disabled || undefined"
          :tabindex="disabled ? -1 : 0"
          :style="{ left: `${percent1}%` }"
          @pointerdown.stop="onThumbPointerDown($event, 0)"
          @keydown="onKeyDown($event, 0)"
        >
          <div
            v-if="showTooltip"
            class="custom-slider__tooltip"
            role="status"
          >
            {{ val1 }}
          </div>
        </div>

        <!-- Thumb 2 (range mode only) -->
        <div
          v-if="isRange"
          ref="thumb2Ref"
          class="custom-slider__thumb"
          :class="{ 'is-dragging': activeThumbIndex === 1 }"
          role="slider"
          :aria-valuenow="val2"
          :aria-valuemin="val1"
          :aria-valuemax="max"
          :aria-disabled="disabled || undefined"
          :tabindex="disabled ? -1 : 0"
          :style="{ left: `${percent2}%` }"
          @pointerdown.stop="onThumbPointerDown($event, 1)"
          @keydown="onKeyDown($event, 1)"
        >
          <div
            v-if="showTooltip"
            class="custom-slider__tooltip"
            role="status"
          >
            {{ val2 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import type { SliderProps } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 'md',
  showTicks: false,
  showTooltip: true,
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | [number, number]): void;
  (e: 'change', value: number | [number, number]): void;
}>();

const trackRef = ref<HTMLElement | null>(null);
const thumb1Ref = ref<HTMLElement | null>(null);
const thumb2Ref = ref<HTMLElement | null>(null);

const activeThumbIndex = ref<number | null>(null);

const isRange = computed(() => Array.isArray(props.modelValue));

const clamp = (val: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, val));
};

const roundToStep = (val: number): number => {
  const step = props.step > 0 ? props.step : 1;
  const steps = Math.round((val - props.min) / step);
  const rounded = props.min + steps * step;
  const precision = (step.toString().split('.')[1] || '').length;
  const clamped = clamp(rounded, props.min, props.max);
  return Number(clamped.toFixed(precision));
};

const val1 = computed(() => {
  if (isRange.value && Array.isArray(props.modelValue)) {
    return clamp(props.modelValue[0], props.min, props.max);
  }
  return clamp(props.modelValue as number, props.min, props.max);
});

const val2 = computed(() => {
  if (isRange.value && Array.isArray(props.modelValue)) {
    return clamp(props.modelValue[1], props.min, props.max);
  }
  return props.max;
});

const getPercent = (val: number): number => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  return clamp(((val - props.min) / range) * 100, 0, 100);
};

const percent1 = computed(() => getPercent(val1.value));
const percent2 = computed(() => getPercent(val2.value));

const fillStyle = computed(() => {
  if (isRange.value) {
    const left = Math.min(percent1.value, percent2.value);
    const width = Math.abs(percent2.value - percent1.value);
    return {
      left: `${left}%`,
      width: `${width}%`
    };
  }
  return {
    left: '0%',
    width: `${percent1.value}%`
  };
});

const tickPositions = computed(() => {
  if (!props.showTicks) return [];
  const range = props.max - props.min;
  const step = props.step > 0 ? props.step : 1;
  const totalTicks = Math.floor(range / step);
  if (totalTicks <= 0 || totalTicks > 50) return [];

  const ticks = [];
  for (let i = 0; i <= totalTicks; i++) {
    const value = props.min + i * step;
    const percent = getPercent(value);
    let active = false;
    if (isRange.value) {
      active = value >= val1.value && value <= val2.value;
    } else {
      active = value <= val1.value;
    }
    ticks.push({ percent, active });
  }
  return ticks;
});

const updateValue = (newVal1: number, newVal2?: number) => {
  let output: number | [number, number];
  if (isRange.value) {
    let v1 = roundToStep(newVal1);
    let v2 = roundToStep(newVal2 ?? val2.value);
    if (v1 > v2) {
      if (activeThumbIndex.value === 0) v1 = v2;
      else v2 = v1;
    }
    output = [v1, v2];
  } else {
    output = roundToStep(newVal1);
  }
  emit('update:modelValue', output);
  emit('change', output);
};

const getValueFromPointer = (e: PointerEvent): number => {
  if (!trackRef.value) return props.min;
  const rect = trackRef.value.getBoundingClientRect();
  const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
  return props.min + ratio * (props.max - props.min);
};

const onTrackPointerDown = (e: PointerEvent) => {
  if (props.disabled) return;
  const clickVal = getValueFromPointer(e);
  if (isRange.value) {
    const dist1 = Math.abs(clickVal - val1.value);
    const dist2 = Math.abs(clickVal - val2.value);
    const thumbIdx = dist1 <= dist2 ? 0 : 1;
    activeThumbIndex.value = thumbIdx;
    if (thumbIdx === 0) updateValue(clickVal, val2.value);
    else updateValue(val1.value, clickVal);
  } else {
    activeThumbIndex.value = 0;
    updateValue(clickVal);
  }

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
};

const onThumbPointerDown = (e: PointerEvent, index: number) => {
  if (props.disabled) return;
  activeThumbIndex.value = index;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
};

const onPointerMove = (e: PointerEvent) => {
  if (activeThumbIndex.value === null || props.disabled) return;
  const pointerVal = getValueFromPointer(e);
  if (isRange.value) {
    if (activeThumbIndex.value === 0) {
      updateValue(pointerVal, val2.value);
    } else {
      updateValue(val1.value, pointerVal);
    }
  } else {
    updateValue(pointerVal);
  }
};

const onPointerUp = () => {
  activeThumbIndex.value = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
};

const onKeyDown = (e: KeyboardEvent, index: number) => {
  if (props.disabled) return;
  const step = props.step > 0 ? props.step : 1;
  let delta = 0;

  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    delta = step;
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    delta = -step;
  } else if (e.key === 'PageUp') {
    delta = step * 10;
  } else if (e.key === 'PageDown') {
    delta = -step * 10;
  } else if (e.key === 'Home') {
    const target = isRange.value && index === 1 ? val1.value : props.min;
    if (index === 0) updateValue(target, val2.value);
    else updateValue(val1.value, target);
    e.preventDefault();
    return;
  } else if (e.key === 'End') {
    const target = isRange.value && index === 0 ? val2.value : props.max;
    if (index === 0) updateValue(target, val2.value);
    else updateValue(val1.value, target);
    e.preventDefault();
    return;
  }

  if (delta !== 0) {
    e.preventDefault();
    if (index === 0) {
      updateValue(val1.value + delta, val2.value);
    } else {
      updateValue(val1.value, val2.value + delta);
    }
  }
};

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>
