<template>
  <div
    v-if="isVisible"
    class="custom-alert"
    :class="[
      `custom-alert--${variant}`,
      getSizeClass('custom-alert', size),
      {
        'is-bordered': bordered,
        'is-dismissible': dismissible,
        'has-title': !!(title || $slots.title)
      }
    ]"
    :role="variant === 'danger' || variant === 'warning' ? 'alert' : 'status'"
  >
    <!-- 아이콘 영역 -->
    <div
      v-if="$slots.icon || computedIcon"
      class="custom-alert__icon"
      aria-hidden="true"
    >
      <slot name="icon">
        <span>{{ computedIcon }}</span>
      </slot>
    </div>

    <!-- 본문 영역 (타이틀 & 메인 콘텐츠) -->
    <div class="custom-alert__main">
      <div v-if="title || $slots.title" class="custom-alert__title">
        <slot name="title">{{ title }}</slot>
      </div>

      <div v-if="$slots.default" class="custom-alert__content">
        <slot></slot>
      </div>
    </div>

    <!-- 액션 영역 (버튼/링크 등) -->
    <div v-if="$slots.actions" class="custom-alert__actions">
      <slot name="actions"></slot>
    </div>

    <!-- X 닫기 버튼 (dismissible 활성화 시) -->
    <button
      v-if="dismissible"
      type="button"
      class="custom-alert__close"
      aria-label="알림 닫기"
      @click="handleDismiss"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AlertProps } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'info',
  size: 6,
  dismissible: false,
  bordered: true
});

const emit = defineEmits<{
  (event: 'dismiss'): void;
  (event: 'close'): void;
}>();

const isVisible = ref(true);

const computedIcon = computed((): string => {
  if (props.icon !== undefined) {
    return props.icon;
  }
  switch (props.variant) {
    case 'info':
      return '💡';
    case 'warning':
      return '⚠️';
    case 'success':
      return '✅';
    case 'danger':
      return '❌';
    case 'ocean':
      return '🌊';
    case 'coral':
      return '🪸';
    case 'abyss':
      return '🌌';
    case 'neutral':
      return '🔔';
    default:
      return '💡';
  }
});

const handleDismiss = (): void => {
  isVisible.value = false;
  emit('dismiss');
  emit('close');
};
</script>
