<template>
  <article class="competition-card">
    <div class="competition-card__date" :aria-label="dateAriaLabel">
      <strong>{{ dateParts.day }}</strong>
      <span>{{ dateParts.month }}</span>
      <small>{{ dateParts.year }}</small>
    </div>
    <div class="competition-card__body">
      <div class="competition-card__badges">
        <span class="fed-badge" :class="competition.federation.toLowerCase()">
          {{ competition.federation }}
        </span>
        <span class="type-badge">{{ typeLabels[competition.type] }}</span>
        <span class="registration-badge" :class="`registration-${competition.registrationStatus}`">
          {{ registrationLabels[competition.registrationStatus] }}
        </span>
        <span class="schedule-badge" :class="`schedule-${scheduleStatus}`">
          {{ scheduleLabels[scheduleStatus] }}
        </span>
      </div>
      <h3>{{ competition.title }}</h3>
      <p class="competition-card__meta">
        <span v-if="isMultiDay">📅 일정 {{ dateRange }}</span>
        <span v-if="location">📍 {{ location }}</span>
      </p>
      <div class="competition-card__actions">
        <CustomButton
          type="button"
          class="bookmark-toggle-btn"
          :class="{ 'is-bookmarked': isFav }"
          :aria-label="isFav ? `${competition.title} 관심 해제` : `${competition.title} 관심 등록`"
          :aria-pressed="isFav"
          @click="toggleBookmark(competition.id)"
        >
          <span class="bookmark-icon" aria-hidden="true">{{ isFav ? '★' : '☆' }}</span>
          <span class="bookmark-label">{{ isFav ? '관심 일정' : '관심 등록' }}</span>
        </CustomButton>
        <a
          :href="competition.officialUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="official-action-btn"
          :aria-label="`${competition.title} 공식 정보 새 탭에서 보기`"
        >
          공식 정보 보기 ↗
        </a>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type {
  Competition,
  CompetitionType,
  EventStatus,
  RegistrationStatus
} from '@/types/competition';
import { useCompetitionStore } from '@/stores/competition';
import { getCompetitionStatus } from '@/composables/useCompetition';

const props = defineProps<{ competition: Competition }>();
const store = useCompetitionStore();
const isFav = computed(() => store.isBookmarked(props.competition.id));
const toggleBookmark = store.toggleBookmark;

const typeLabels: Record<CompetitionType, string> = {
  pool: '풀',
  depth: '수심',
  mixed: '혼합',
  unknown: '유형 미확인'
};
const registrationLabels: Record<RegistrationStatus, string> = {
  open: '접수 가능',
  closed: '마감',
  unknown: '접수 상태 미확인'
};
const scheduleLabels: Record<EventStatus, string> = {
  upcoming: '예정',
  ongoing: '진행 중',
  ended: '종료'
};
const scheduleStatus = computed(() => getCompetitionStatus(props.competition));
const dateParts = computed(() => {
  const [year, month, day] = props.competition.startDate.split('-');
  return { year, month: `${Number(month)}월`, day };
});
const isMultiDay = computed(() =>
  Boolean(
    props.competition.endDate
    && props.competition.endDate !== props.competition.startDate
  )
);
const dateRange = computed(() =>
  isMultiDay.value
    ? `${props.competition.startDate} – ${props.competition.endDate}`
    : props.competition.startDate
);
const dateAriaLabel = computed(() => `대회 일정 ${dateRange.value}`);
const location = computed(() =>
  [props.competition.venue, props.competition.city].filter(Boolean).join(' · ')
);
</script>
