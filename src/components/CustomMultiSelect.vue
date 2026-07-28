<template>
  <div ref="containerRef" class="custom-select custom-multi-select">
    <div
      class="select-trigger multi-select-trigger"
      :class="[
        `multi-select-trigger--${size}`,
        { 'is-active': isOpen, 'is-disabled': disabled }
      ]"
      role="combobox"
      tabindex="0"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-disabled="disabled"
      @click="toggleWhenEnabled"
      @keydown.enter.prevent="toggleWhenEnabled"
      @keydown.space.prevent="toggleWhenEnabled"
      @keydown.esc="close"
    >
      <div v-if="selectedOptions.length" class="multi-select-chips">
        <span v-for="option in selectedOptions" :key="String(option.value)" class="multi-select-chip">
          <span>{{ option.label }}</span>
          <button
            type="button"
            class="multi-select-chip__remove"
            :aria-label="`${option.label} 선택 해제`"
            @click.stop="remove(option.value)"
          >
            ×
          </button>
        </span>
      </div>
      <span v-else class="placeholder">{{ placeholder }}</span>

      <div class="multi-select-actions">
        <button
          v-if="clearable && selectedOptions.length"
          type="button"
          class="multi-select-clear"
          aria-label="전체 선택 해제"
          @click.stop="clear"
        >
          ×
        </button>
        <i class="fa-solid fa-chevron-down select-arrow" :class="{ 'is-open': isOpen }"></i>
      </div>
    </div>

    <transition name="fade-slide">
      <div
        v-if="isOpen"
        class="select-dropdown multi-select-dropdown"
        role="listbox"
        aria-multiselectable="true"
      >
        <button
          v-for="option in normalizedOptions"
          :key="String(option.value)"
          type="button"
          class="option-item multi-select-option"
          :class="{ 'is-selected': isSelected(option.value) }"
          role="option"
          :aria-selected="isSelected(option.value)"
          :disabled="isAtLimit && !isSelected(option.value)"
          @click="toggleOption(option.value)"
        >
          <span class="multi-select-option__check" aria-hidden="true">
            {{ isSelected(option.value) ? '✓' : '' }}
          </span>
          <span>{{ option.label }}</span>
        </button>
        <p v-if="isAtLimit" class="multi-select-limit" role="status">
          최대 {{ maxSelections }}개까지 선택할 수 있습니다.
        </p>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useMultiSelect } from '@/composables/useMultiSelect';
import type { MultiSelectProps } from '@/types/inputs';

const props = withDefaults(defineProps<MultiSelectProps>(), {
  placeholder: '여러 항목 선택',
  disabled: false,
  clearable: true,
  maxSelections: 0,
  size: 'md'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: unknown[]): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const value = computed({
  get: () => props.modelValue,
  set: (nextValue: unknown[]) => emit('update:modelValue', nextValue)
});
const reactiveOptions = computed(() => props.options);
const selectionLimit = computed(() => props.maxSelections);

const {
  isOpen,
  normalizedOptions,
  selectedOptions,
  isAtLimit,
  isSelected,
  toggle,
  close,
  toggleOption,
  remove,
  clear
} = useMultiSelect(value, reactiveOptions, selectionLimit);

const toggleWhenEnabled = (): void => {
  if (!props.disabled) toggle();
};

onClickOutside(containerRef, close);
</script>
