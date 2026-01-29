<template>
  <div
    class="toggle-container"
    :class="{ 'is-day': isDay }"
    @click="toggle"
  >
    <div class="thumb">
      <span class="icon" v-html="currentIcon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import sunIcon from '@/assets/icons/sun.svg?raw';
import moonStarsIcon from '@/assets/icons/moon-stars.svg?raw';

const props = defineProps<{
  modelValue: boolean; // true for day, false for night
}>();

const emit = defineEmits(['update:modelValue']);

const isDay = ref(props.modelValue);

const currentIcon = computed(() => (isDay.value ? sunIcon : moonStarsIcon));

const toggle = () => {
  isDay.value = !isDay.value;
  emit('update:modelValue', isDay.value);
};

watch(() => props.modelValue, (newValue) => {
  isDay.value = newValue;
});
</script>

<style lang="scss">
@import '@/assets/scss/components/_dark-mode-toggle.scss';
</style>
