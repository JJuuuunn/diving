<template>
  <div ref="containerRef" class="custom-datepicker custom-date-range-picker">
    <div
      class="datepicker-trigger"
      :class="{ 'is-active': isOpen, 'is-disabled': disabled }"
      role="button"
      tabindex="0"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      @click="toggleCalendar"
      @keydown.enter.prevent="toggleCalendar"
      @keydown.space.prevent="toggleCalendar"
      @keydown.esc="closeCalendar"
    >
      <div class="trigger-content">
        <i :class="mode === 'month' ? 'fa-solid fa-calendar' : 'fa-solid fa-calendar-days'"></i>
        <span v-if="formattedValue">{{ formattedValue }}</span>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </div>
      <i class="fa-solid fa-chevron-down trigger-arrow" :class="{ 'is-open': isOpen }"></i>
    </div>

    <transition name="fade-slide">
      <div v-if="isOpen" class="datepicker-popover">
        <div class="datepicker-header">
          <button type="button" class="datepicker-title" @click="handleHeaderClickForMode">
            {{ headerLabel }}
            <i class="fa-solid fa-caret-down"></i>
          </button>
          <div class="datepicker-nav">
            <button type="button" class="datepicker-nav-btn" aria-label="이전" @click="handlePrev">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" class="datepicker-nav-btn" aria-label="다음" @click="handleNext">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="range-selection-status" role="status">
          {{ selectionStatus }}
        </div>

        <div v-if="viewMode === 'days'">
          <div class="datepicker-weekdays">
            <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
          </div>
          <div class="datepicker-days-grid">
            <button
              v-for="day in daysGrid"
              :key="day.dateString"
              type="button"
              class="datepicker-day-cell"
              :class="{
                'is-current-month': day.isCurrentMonth,
                'is-today': day.isToday,
                'is-range-start': day.dateString === modelValue.start,
                'is-range-end': day.dateString === modelValue.end,
                'is-in-range': isDateInRange(day.dateString, modelValue)
              }"
              :aria-label="`${day.dateString} 선택`"
              @click="handleSelectDay(day.dateString)"
            >
              {{ day.dayNumber }}
            </button>
          </div>
        </div>

        <div v-else-if="viewMode === 'months'" class="datepicker-months-grid">
          <button
            v-for="month in monthsList"
            :key="month"
            type="button"
            class="month-item"
            :class="monthRangeClasses(month)"
            @click="handleSelectMonth(month)"
          >
            {{ month + 1 }}월
          </button>
        </div>

        <div v-else class="datepicker-years-grid">
          <button
            v-for="year in yearsGrid"
            :key="year"
            type="button"
            class="year-item"
            @click="selectYear(year)"
          >
            {{ year }}년
          </button>
        </div>

        <div class="range-picker-actions">
          <button type="button" class="range-clear-button" :disabled="!modelValue.start" @click="clearRange">
            초기화
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import { onClickOutside } from '@vueuse/core';
import { useCalendar } from '@/composables/useCalendar';
import type { DateRange, DateRangePickerProps } from '@/types/calendar';
import { isDateInRange, selectRangeDate, selectRangeMonth } from '@/utils/dateRange';

const props = withDefaults(defineProps<DateRangePickerProps>(), {
  placeholder: '기간 선택',
  disabled: false,
  mode: 'date'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: DateRange): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const calendarFocusDate = computed(() => props.modelValue.end || props.modelValue.start);
const emptyLogDates = computed<string[]>(() => []);

const {
  currentYear,
  viewMode,
  yearsGrid,
  monthsList,
  headerLabel,
  daysGrid,
  handlePrev,
  handleNext,
  selectMonth,
  selectYear,
  handleHeaderClick,
  syncToDate
} = useCalendar(calendarFocusDate, emptyLogDates);

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
const formattedValue = computed(() => {
  if (!props.modelValue.start) return '';
  const valueFormat = props.mode === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const pendingLabel = props.mode === 'month' ? '종료 월 선택' : '종료일 선택';
  const start = dayjs(props.modelValue.start).format(valueFormat);
  if (!props.modelValue.end) return `${start} ~ ${pendingLabel}`;
  return `${start} ~ ${dayjs(props.modelValue.end).format(valueFormat)}`;
});
const selectionStatus = computed(() =>
  props.modelValue.start && !props.modelValue.end
    ? props.mode === 'month' ? '종료 월을 선택하세요.' : '종료일을 선택하세요.'
    : props.mode === 'month' ? '시작 월을 선택하세요.' : '시작일을 선택하세요.'
);

const closeCalendar = (): void => {
  isOpen.value = false;
};

const toggleCalendar = (): void => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    syncToDate(calendarFocusDate.value);
    viewMode.value = props.mode === 'month' ? 'months' : 'days';
  }
};

const handleSelectDay = (date: string): void => {
  const nextRange = selectRangeDate(props.modelValue, date);
  emit('update:modelValue', nextRange);
  if (nextRange.start && nextRange.end) closeCalendar();
};

const monthValue = (month: number): string =>
  dayjs().year(currentYear.value).month(month).format('YYYY-MM');

const handleSelectMonth = (month: number): void => {
  if (props.mode === 'date') {
    selectMonth(month);
    return;
  }
  const nextRange = selectRangeMonth(props.modelValue, monthValue(month));
  emit('update:modelValue', nextRange);
  if (nextRange.start && nextRange.end) closeCalendar();
};

const monthRangeClasses = (month: number): Record<string, boolean> => {
  if (props.mode !== 'month') return {};
  const value = monthValue(month);
  return {
    'is-range-start': value === props.modelValue.start,
    'is-range-end': value === props.modelValue.end,
    'is-in-range': isDateInRange(value, props.modelValue)
  };
};

const handleHeaderClickForMode = (): void => {
  if (props.mode === 'month') {
    viewMode.value = viewMode.value === 'years' ? 'months' : 'years';
    return;
  }
  handleHeaderClick();
};

const clearRange = (): void => {
  emit('update:modelValue', { start: '', end: '' });
};

onClickOutside(containerRef, closeCalendar);
</script>
