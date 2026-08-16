<template>
  <div
    ref="wrapperRef"
    class="custom-tooltip-wrapper"
    :class="[
      getSizeClass('custom-tooltip', size),
      { 'is-active': isVisible }
    ]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @click="onClick"
    @keydown.esc="hide"
  >
    <div
      ref="triggerRef"
      class="custom-tooltip-trigger"
      :aria-describedby="isVisible && !disabled ? tooltipId : undefined"
    >
      <slot></slot>
    </div>

    <Transition name="tooltip-fade">
      <div
        v-if="isVisible && !disabled"
        :id="tooltipId"
        ref="popoverRef"
        class="custom-tooltip-popover"
        :class="[`placement-${placement}`]"
        role="tooltip"
      >
        <div class="custom-tooltip-content">
          <slot name="content">{{ content }}</slot>
        </div>
        <div class="custom-tooltip-arrow" aria-hidden="true"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { TooltipProps } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';

const props = withDefaults(defineProps<TooltipProps>(), {
  content: '',
  placement: 'top',
  trigger: 'hover',
  disabled: false,
  size: 'md'
});

const isVisible = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);

const tooltipId = `tooltip-${Math.random().toString(36).substring(2, 9)}`;

const show = () => {
  if (props.disabled) return;
  isVisible.value = true;
};

const hide = () => {
  isVisible.value = false;
};

const toggle = () => {
  if (props.disabled) return;
  isVisible.value = !isVisible.value;
};

const onMouseEnter = () => {
  if (props.trigger === 'hover') {
    show();
  }
};

const onMouseLeave = () => {
  if (props.trigger === 'hover') {
    hide();
  }
};

const onFocusIn = () => {
  if (props.trigger === 'hover') {
    show();
  }
};

const onFocusOut = () => {
  if (props.trigger === 'hover') {
    hide();
  }
};

const onClick = (e: MouseEvent) => {
  if (props.trigger === 'click') {
    e.stopPropagation();
    toggle();
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (props.trigger === 'click' && isVisible.value && wrapperRef.value) {
    if (!wrapperRef.value.contains(event.target as Node)) {
      hide();
    }
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});
</script>
