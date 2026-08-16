<template>
  <div
    class="custom-accordion"
    :class="[getSizeClass('custom-accordion', size)]"
  >
    <template v-if="items && items.length">
      <CustomAccordionItem
        v-for="item in items"
        :key="item.id"
        v-bind="item"
        :size="size"
      >
        <slot name="item" :item="item">
          {{ item.subtitle || item.title }}
        </slot>
      </CustomAccordionItem>
    </template>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import type { AccordionProps, ComponentSize } from '@/types/inputs';
import { getSizeClass } from '@/utils/size';
import CustomAccordionItem from '@/components/CustomAccordionItem.vue';

const props = withDefaults(defineProps<AccordionProps>(), {
  modelValue: undefined,
  multiple: false,
  items: () => [],
  size: 'md'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown | unknown[]): void;
  (e: 'change', value: unknown | unknown[]): void;
}>();

const normalizeModelValue = (val: unknown, multiple: boolean): (string | number)[] => {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val as (string | number)[];
  return [val as string | number];
};

const internalActive = ref<(string | number)[]>(
  normalizeModelValue(props.modelValue, props.multiple)
);

const activeIds = computed<(string | number)[]>({
  get() {
    if (props.modelValue !== undefined) {
      return normalizeModelValue(props.modelValue, props.multiple);
    }
    return internalActive.value;
  },
  set(newVal) {
    internalActive.value = newVal;
    const output = props.multiple ? newVal : newVal[0] ?? null;
    emit('update:modelValue', output);
    emit('change', output);
  }
});

const toggleItem = (id: string | number) => {
  const current = [...activeIds.value];
  if (props.multiple) {
    const idx = current.indexOf(id);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(id);
    }
    activeIds.value = current;
  } else {
    if (current.includes(id)) {
      activeIds.value = [];
    } else {
      activeIds.value = [id];
    }
  }
};

const compSize = computed<ComponentSize | undefined>(() => props.size);

provide('accordionContext', {
  activeIds,
  toggleItem,
  size: compSize
});
</script>
