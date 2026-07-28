<template>
  <CustomCalendarPanel
    v-model="selectedDate"
    :title="`${year}년 ${month + 1}월`"
    :cells="cells"
    :cell-aria-label="getCellAriaLabel"
    @previous="moveMonth(-1)"
    @next="moveMonth(1)"
  >
    <template #cell="{ cell }">
      <template v-if="isCompetitionCell(cell)">
        <span
          v-for="event in cell.events.slice(0, 2)"
          :key="event.id"
          class="calendar-event"
          :class="event.federation.toLowerCase()"
        >
          {{ event.title }}
        </span>
        <span v-if="cell.events.length > 2" class="calendar-more">
          +{{ cell.events.length - 2 }}건
        </span>
      </template>
    </template>
    <template #selection>
      <h3>{{ selectedDate }} 일정</h3>
      <p v-if="selectedEvents.length === 0" class="empty-state compact">선택한 날짜에 대회가 없습니다.</p>
      <CompetitionCard
        v-for="event in selectedEvents"
        :key="event.id"
        :competition="event"
      />
    </template>
  </CustomCalendarPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Competition } from '@/types/competition';
import type { CalendarPanelCell } from '@/types/calendar';
import { getKstDateString } from '@/composables/useCompetition';
import {
  buildUtcCalendarDates,
  createUtcDate,
  moveUtcMonth
} from '@/utils/competitionCalendar';
import CustomCalendarPanel from '@/components/CustomCalendarPanel.vue';
import CompetitionCard from './CompetitionCard.vue';

interface CompetitionCalendarCell extends CalendarPanelCell {
  events: Competition[];
}

const props = defineProps<{ events: Competition[] }>();
const initial = getKstDateString();
const cursor = ref(createUtcDate(initial));
const selectedDate = ref(initial);
const year = computed(() => cursor.value.getUTCFullYear());
const month = computed(() => cursor.value.getUTCMonth());
const eventsOn = (date: string) => props.events.filter((event) =>
  event.startDate <= date && (event.endDate ?? event.startDate) >= date
);
const cells = computed<CompetitionCalendarCell[]>(() => {
  return buildUtcCalendarDates(year.value, month.value).map((value) => {
    const date = createUtcDate(value);
    return {
      key: value,
      date: value,
      day: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month.value,
      eventCount: eventsOn(value).length,
      events: eventsOn(value)
    };
  });
});
const selectedEvents = computed(() => eventsOn(selectedDate.value));
const isCompetitionCell = (cell: CalendarPanelCell): cell is CompetitionCalendarCell =>
  'events' in cell;
const getCellAriaLabel = (cell: CalendarPanelCell): string =>
  `${cell.date}, 대회 ${cell.eventCount ?? 0}개`;
const moveMonth = (amount: number) => {
  cursor.value = moveUtcMonth(cursor.value, amount);
  selectedDate.value = `${year.value}-${String(month.value + 1).padStart(2, '0')}-01`;
};
</script>
