<template>
  <button
    class="custom-ui-button"
    :class="[
      `custom-ui-button--${variant}`,
      `custom-ui-button--${size}`,
      `custom-ui-button--${shape}`,
      {
        'custom-ui-button--block': block,
        'custom-ui-button--loading': loading
      }
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="$slots.leading" class="custom-ui-button__icon" aria-hidden="true">
      <slot name="leading" />
    </span>
    <span class="custom-ui-button__content">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="custom-ui-button__icon" aria-hidden="true">
      <slot name="trailing" />
    </span>
    <span v-if="loading" class="custom-ui-button__loading-layer" aria-hidden="true">
      <span class="custom-ui-button__spinner"></span>
    </span>
    <span v-if="loading" class="sr-only" role="status">{{ loadingLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@/types/inputs';

withDefaults(defineProps<ButtonProps>(), {
  type: 'button',
  variant: 'default',
  size: 'md',
  shape: 'rounded',
  disabled: false,
  loading: false,
  loadingLabel: '처리 중',
  block: false
});
</script>
