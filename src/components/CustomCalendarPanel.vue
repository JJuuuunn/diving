<template>
  <section class="custom-calendar-panel" :aria-labelledby="titleId">
    <div class="custom-calendar-panel__toolbar">
      <CustomButton type="button" :aria-label="previousLabel" @click="emit('previous')">
        ‹
      </CustomButton>
      <h2 :id="titleId">{{ title }}</h2>
      <CustomButton type="button" :aria-label="nextLabel" @click="emit('next')">
        ›
      </CustomButton>
    </div>

    <div class="custom-calendar-panel__weekdays" aria-hidden="true">
      <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
    </div>

    <div class="custom-calendar-panel__grid">
      <CustomButton
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        variant="ghost"
        size="xs"
        class="custom-calendar-panel__day"
        :class="{
          'is-muted': !cell.isCurrentMonth,
          'is-selected': cell.date === modelValue
        }"
        :aria-label="getCellAriaLabel(cell)"
        :aria-pressed="cell.date === modelValue"
        @click="emit('update:modelValue', cell.date)"
      >
        <span class="custom-calendar-panel__day-number">{{ cell.day }}</span>
        <span class="custom-calendar-panel__cell-content">
          <slot name="cell" :cell="cell" />
        </span>
      </CustomButton>
    </div>

    <div v-if="$slots.selection" class="custom-calendar-panel__selection">
      <slot name="selection" :selected-date="modelValue" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import type { CalendarPanelCell } from '@/types/calendar';
import CustomButton from './CustomButton.vue';

const props = withDefaults(defineProps<{
  modelValue: string;
  title: string;
  cells: CalendarPanelCell[];
  weekdays?: string[];
  previousLabel?: string;
  nextLabel?: string;
  cellAriaLabel?: (cell: CalendarPanelCell) => string;
}>(), {
  weekdays: () => ['일', '월', '화', '수', '목', '금', '토'],
  previousLabel: '이전 달',
  nextLabel: '다음 달',
  cellAriaLabel: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  previous: [];
  next: [];
}>();

defineSlots<{
  cell(props: { cell: CalendarPanelCell }): unknown;
  selection?(props: { selectedDate: string }): unknown;
}>();

const titleId = `custom-calendar-title-${useId()}`;
const getCellAriaLabel = (cell: CalendarPanelCell): string =>
  props.cellAriaLabel?.(cell) ?? cell.date;
</script>
