<template>
  <span
    class="custom-badge"
    :class="[
      `custom-badge--${variant}`,
      getSizeClass('custom-badge', size),
      {
        'is-pill': pill,
        'is-dot-only': dot && !$slots.default
      }
    ]"
    role="status"
  >
    <!-- 펄싱/스테이블 상태 도트 뱃지 -->
    <span
      v-if="dot"
      class="custom-badge__dot"
      :class="{ 'is-pulsing': pulsing }"
      aria-hidden="true"
    ></span>

    <!-- 뱃지 라벨 내용 -->
    <span v-if="$slots.default" class="custom-badge__content">
      <slot></slot>
    </span>

    <!-- X 닫기/삭제 버튼 (removable) -->
    <button
      v-if="removable"
      type="button"
      class="custom-badge__remove"
      aria-label="삭제"
      @click.stop="emit('remove')"
    >
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
import type { BadgeProps } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';

withDefaults(defineProps<BadgeProps>(), {
  variant: 'default',
  size: 'md',
  pill: true,
  dot: false,
  pulsing: false,
  removable: false
});

const emit = defineEmits<{
  (event: 'remove'): void;
}>();
</script>
