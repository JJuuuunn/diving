<template>
  <div
    class="hybrid-toggle"
    :class="{
      'is-day': isDay,
      'has-transition': isTransitionActive,
      'is-expanded': expanded,
    }"
    @click="toggle"
    aria-label="Toggle Dive Computer Mode"
  >
    <!-- Background Track Symbols (Only visible when sidebar is expanded) -->
    <span class="bg-icon bg-sun" v-html="sunIcon"></span>
    <span class="bg-icon bg-moon" v-html="moonStarsIcon"></span>

    <!-- Sliding circular dive computer dial (Knob) -->
    <div class="watch-knob">
      <!-- Milled Dive Watch Bezel -->
      <div class="watch-bezel">
        <div class="bezel-teeth"></div>
      </div>

      <!-- Radial Progress SVG Ring (Circumference = 2 * PI * 15 = 94.2) -->
      <svg class="radial-ring" viewBox="0 0 38 38">
        <circle class="ring-track" cx="19" cy="19" r="15" fill="none" />
        <circle
          class="ring-fill"
          cx="19"
          cy="19"
          r="15"
          fill="none"
          :style="{ strokeDashoffset: dashOffset }"
        />
      </svg>

      <!-- Watch Face LCD Display Core -->
      <div class="watch-face">
        <!-- Universal Sun/Moon Icon (Enlarged for readability) -->
        <span class="theme-icon" v-html="currentIcon"></span>
        
        <!-- Large digital depth display -->
        <div class="depth-display">
          <span class="depth-value">{{ currentDepth }}</span>
          <span class="depth-unit">m</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import type { DarkModeToggleProps } from '@/types/components';
import { MAX_DEPTH } from '@/constants/theme';
import sunIcon from '@/assets/icons/sun.svg?raw';
import moonStarsIcon from '@/assets/icons/moon-stars.svg?raw';

const props = withDefaults(defineProps<DarkModeToggleProps>(), {
  expanded: false,
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isDay = ref(props.modelValue);
const currentDepth = ref(props.modelValue ? 0 : MAX_DEPTH);
const isTransitionActive = ref(false);

// Universal theme icon based on current state
const currentIcon = computed(() => (isDay.value ? sunIcon : moonStarsIcon));

// Dynamic SVG circular progress dashoffset synced in real-time with currentDepth
// Radius is 15, so Circumference is 94.2
const dashOffset = computed(() => {
  const baseOffset = 94.2;
  const progress = currentDepth.value / MAX_DEPTH;
  return baseOffset - (progress * baseOffset);
});

let animFrameId: number | null = null;
let transitionTimeoutId: number | null = null;

// Rapid 1m incremental counter animation running at a buttery-smooth 60fps
// Synced with a majestic 1.5-second descent/ascent pace (updates every 3 frames)
const animateDepth = (target: number) => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
  }

  let frameCount = 0;
  const step = () => {
    if (currentDepth.value !== target) {
      frameCount++;
      // Increment/decrement every 3 frames (approx. 50ms) to stretch the count over exactly 1.5 seconds
      if (frameCount >= 3) {
        if (currentDepth.value < target) {
          currentDepth.value++;
        } else if (currentDepth.value > target) {
          currentDepth.value--;
        }
        frameCount = 0;
      }
      animFrameId = requestAnimationFrame(step);
    } else {
      animFrameId = null;
    }
  };

  animFrameId = requestAnimationFrame(step);
};

const toggle = () => {
  isDay.value = !isDay.value;
  
  // Enable smooth slide transition on click
  isTransitionActive.value = true;
  
  emit('update:modelValue', isDay.value);
  animateDepth(isDay.value ? 0 : MAX_DEPTH);

  // Clear previous transition reset timer and set a new one
  if (transitionTimeoutId) {
    clearTimeout(transitionTimeoutId);
  }
  transitionTimeoutId = window.setTimeout(() => {
    isTransitionActive.value = false;
  }, 1500); // matches the 1.5s transition duration
};

watch(() => props.modelValue, (newValue) => {
  isDay.value = newValue;
  animateDepth(newValue ? 0 : MAX_DEPTH);
});

onUnmounted(() => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
  }
  if (transitionTimeoutId) {
    clearTimeout(transitionTimeoutId);
  }
});
</script>

<style lang="scss">
@import '@/assets/scss/components/_dark-mode-toggle.scss';
</style>
