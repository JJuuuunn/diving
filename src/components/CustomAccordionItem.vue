<template>
  <div
    class="custom-accordion-item"
    :class="[
      getSizeClass('custom-accordion-item', size),
      {
        'is-expanded': isOpen,
        'is-disabled': disabled
      }
    ]"
  >
    <button
      :id="`accordion-header-${id}`"
      type="button"
      class="custom-accordion-item__header"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-panel-${id}`"
      :aria-disabled="disabled || undefined"
      :disabled="disabled"
      @click="toggle"
      @keydown="onHeaderKeyDown"
    >
      <div class="custom-accordion-item__header-left">
        <i v-if="icon" class="custom-accordion-item__icon" :class="icon" aria-hidden="true"></i>
        <div class="custom-accordion-item__title-group">
          <span class="custom-accordion-item__title">{{ title }}</span>
          <span v-if="subtitle" class="custom-accordion-item__subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <span class="custom-accordion-item__chevron" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </button>

    <div
      :id="`accordion-panel-${id}`"
      class="custom-accordion-item__wrapper"
      :class="{ 'is-expanded': isOpen }"
      role="region"
      :aria-labelledby="`accordion-header-${id}`"
    >
      <div class="custom-accordion-item__content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import type { AccordionItem, ComponentSize } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';
import { handleRovingFocus } from '@/composables/useKeyboardNav';

const props = defineProps<AccordionItem & { size?: ComponentSize }>();

const accordionContext = inject<{
  activeIds: Ref<(string | number)[]>;
  toggleItem: (id: string | number) => void;
  size: Ref<ComponentSize | undefined>;
}>('accordionContext', {
  activeIds: computed(() => []),
  toggleItem: () => {},
  size: computed(() => undefined)
});

const size = computed(() => props.size ?? accordionContext.size.value ?? 'md');

const isOpen = computed(() => {
  return accordionContext.activeIds.value.includes(props.id);
});

const toggle = () => {
  if (props.disabled) return;
  accordionContext.toggleItem(props.id);
};

const onHeaderKeyDown = (event: KeyboardEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  const container = target.closest('.custom-accordion');
  if (!container) return;
  const headers = Array.from(
    container.querySelectorAll<HTMLButtonElement>('.custom-accordion-item__header:not(:disabled)')
  );
  const currentIdx = headers.indexOf(target as HTMLButtonElement);
  if (currentIdx === -1) return;

  handleRovingFocus(event, headers, currentIdx, { orientation: 'vertical' });
};
</script>
