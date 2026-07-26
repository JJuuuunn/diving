<template>
  <section class="calendar-panel" aria-label="월간 대회 달력">
    <div class="calendar-toolbar">
      <button type="button" aria-label="이전 달" @click="moveMonth(-1)">‹</button>
      <h2>{{ year }}년 {{ month + 1 }}월</h2>
      <button type="button" aria-label="다음 달" @click="moveMonth(1)">›</button>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      <span v-for="day in weekdays" :key="day">{{ day }}</span>
    </div>
    <div class="calendar-grid">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="calendar-day"
        :class="{ muted: !cell.inMonth, selected: cell.date === selectedDate }"
        :aria-label="`${cell.date}, 대회 ${cell.events.length}개`"
        @click="selectedDate = cell.date"
      >
        <span class="calendar-day__number">{{ cell.day }}</span>
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
      </button>
    </div>
    <div class="calendar-selection">
      <h3>{{ selectedDate }} 일정</h3>
      <p v-if="selectedEvents.length === 0" class="empty-state compact">선택한 날짜에 대회가 없습니다.</p>
      <CompetitionCard
        v-for="event in selectedEvents"
        :key="event.id"
        :competition="event"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Competition } from '@/types/competition';
import { getKstDateString } from '@/composables/useCompetition';
import CompetitionCard from './CompetitionCard.vue';

const props = defineProps<{ events: Competition[] }>();
const initial = getKstDateString();
const cursor = ref(new Date(`${initial}T00:00:00+09:00`));
const selectedDate = ref(initial);
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const year = computed(() => cursor.value.getFullYear());
const month = computed(() => cursor.value.getMonth());
const toDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const eventsOn = (date: string) => props.events.filter((event) =>
  event.startDate <= date && (event.endDate ?? event.startDate) >= date
);
const cells = computed(() => {
  const first = new Date(year.value, month.value, 1);
  const start = new Date(year.value, month.value, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = toDate(date);
    return {
      key: value,
      date: value,
      day: date.getDate(),
      inMonth: date.getMonth() === month.value,
      events: eventsOn(value)
    };
  });
});
const selectedEvents = computed(() => eventsOn(selectedDate.value));
const moveMonth = (amount: number) => {
  cursor.value = new Date(year.value, month.value + amount, 1);
  selectedDate.value = toDate(cursor.value);
};
</script>
