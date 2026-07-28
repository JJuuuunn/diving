<template>
  <div class="competition-container">
    <Header title="국내 프리다이빙 공식 대회" subtitle="AIDA 공식 일정 · CMAS 준비 중" />
    <main class="main-content">
      <section class="competition-summary" aria-label="일정 요약">
        <article class="next-event-card">
          <div class="next-event-card__heading">
            <span>가장 가까운 일정</span>
            <strong>{{ nextEventCountdown }}</strong>
          </div>
          <template v-if="nextCompetition">
            <h2>{{ nextCompetition.title }}</h2>
            <p>
              <span>📅 {{ nextCompetition.startDate }}</span>
              <span v-if="nextCompetition.venue || nextCompetition.city">
                📍 {{ [nextCompetition.venue, nextCompetition.city].filter(Boolean).join(' · ') }}
              </span>
            </p>
            <a :href="nextCompetition.officialUrl" target="_blank" rel="noopener noreferrer">
              공식 일정 확인 ↗
            </a>
          </template>
          <p v-else class="next-event-card__empty">현재 등록된 예정 일정이 없습니다.</p>
        </article>
        <div class="summary-metrics">
          <article>
            <span>진행·예정</span>
            <strong>{{ upcomingCompetitions.length }}</strong>
            <small>개의 공식 일정</small>
          </article>
          <article>
            <span>접수 가능</span>
            <strong>{{ openRegistrationCount }}</strong>
            <small>개의 신청 가능한 일정</small>
          </article>
          <article>
            <span>관심 일정</span>
            <strong>{{ bookmarkedCompetitions.length }}</strong>
            <small>이 브라우저에 저장됨</small>
          </article>
          <article class="summary-source">
            <span>데이터 기준</span>
            <strong>{{ generatedAt }}</strong>
            <small>
              <a :href="aidaSource?.url" target="_blank" rel="noopener noreferrer">AIDA ↗</a>
              <span class="source-disabled" aria-disabled="true">CMAS 준비 중</span>
            </small>
          </article>
        </div>
      </section>

      <section class="filter-panel" aria-label="대회 필터">
        <header class="filter-panel__header">
          <div>
            <span>일정 탐색</span>
            <h2>원하는 대회만 빠르게 찾기</h2>
          </div>
          <CustomButton class="reset-button" variant="ghost" @click="resetFilters">
            전체 초기화
          </CustomButton>
        </header>
        <CustomInput
          v-model="filters.searchQuery"
          type="search"
          label="대회 검색"
          placeholder="대회명, 장소 또는 도시 검색"
        />
        <div class="filter-grid">
          <label class="filter-control">협회
            <CustomSelect v-model="filters.federation" :options="federationOptions" />
          </label>
          <label class="filter-control">경기 환경
            <CustomSelect v-model="filters.type" :options="typeOptions" />
          </label>
          <label class="filter-control">일정 상태
            <CustomSelect v-model="filters.status" :options="statusOptions" />
          </label>
          <label class="filter-control">접수 상태
            <CustomSelect v-model="filters.registrationStatus" :options="registrationOptions" />
          </label>
        </div>
        <div class="filter-panel__footer">
          <CustomSwitch
            v-model="filters.bookmarkedOnly"
            active-text="관심 일정만"
            inactive-text="전체 일정"
            active-icon="fa-star"
            inactive-icon="fa-list"
          />
        </div>
      </section>

      <div
        v-if="isLoadingApi"
        class="competition-loading-bar"
        role="status"
        aria-live="polite"
      >
        <span class="sr-only">최신 대회 일정을 불러오는 중입니다.</span>
      </div>

      <div class="view-toolbar">
        <p v-if="isLoadingApi">최신 대회 일정 확인 중</p>
        <p v-else>검색 결과 <strong>{{ filteredCompetitions.length }}개</strong></p>
        <div role="group" aria-label="보기 방식">
          <CustomButton :aria-pressed="view === 'list'" @click="view = 'list'">목록</CustomButton>
          <CustomButton :aria-pressed="view === 'calendar'" @click="view = 'calendar'">월간</CustomButton>
        </div>
      </div>

      <section v-if="view === 'list'" class="competition-content-grid">
        <div class="competitions-main-list">
          <div v-if="isLoadingApi" class="competition-skeleton-list" aria-hidden="true">
            <div v-for="index in 5" :key="index" class="competition-skeleton-card">
              <span class="competition-skeleton-card__date"></span>
              <div class="competition-skeleton-card__body">
                <span class="skeleton-line skeleton-line--badge"></span>
                <span class="skeleton-line skeleton-line--title"></span>
                <span class="skeleton-line skeleton-line--meta"></span>
                <span class="skeleton-line skeleton-line--action"></span>
              </div>
            </div>
          </div>
          <div v-else-if="filteredCompetitions.length === 0" class="empty-state">
            <strong>조건에 맞는 공식 대회가 없습니다.</strong>
            <span>필터를 초기화하거나 공식 출처의 다음 갱신을 기다려 주세요.</span>
          </div>
          <template v-else>
            <CompetitionCard v-for="competition in filteredCompetitions" :key="competition.id" :competition="competition" />
          </template>
        </div>
        <aside class="my-arena-widget">
          <h2><span aria-hidden="true">★</span> 관심 일정</h2>
          <p v-if="bookmarkedCompetitions.length === 0">관심 대회를 등록하면 이 브라우저에 저장됩니다.</p>
          <a
            v-for="competition in bookmarkedCompetitions"
            :key="competition.id"
            :href="competition.officialUrl"
            target="_blank"
            rel="noopener noreferrer"
          >{{ competition.title }} ↗</a>
        </aside>
      </section>
      <CompetitionCalendar v-else :events="filteredCompetitions" />
      <Footer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CompetitionCard from './CompetitionCard.vue';
import CompetitionCalendar from './CompetitionCalendar.vue';
import { getKstDateString, useCompetition } from '@/composables/useCompetition';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomSwitch from '@/components/CustomSwitch.vue';
import type { SelectOption } from '@/types/inputs';

const federationOptions: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'AIDA', label: 'AIDA' },
  { value: 'CMAS', label: 'CMAS', disabled: true }
];
const typeOptions: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'pool', label: '풀' },
  { value: 'depth', label: '수심' },
  { value: 'mixed', label: '혼합' },
  { value: 'unknown', label: '미확인' }
];
const statusOptions: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'upcoming', label: '예정' },
  { value: 'ongoing', label: '진행' },
  { value: 'ended', label: '종료' }
];
const registrationOptions: SelectOption[] = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '접수 가능' },
  { value: 'closed', label: '마감' },
  { value: 'unknown', label: '미확인' }
];

const view = ref<'list' | 'calendar'>('list');
const {
  feed, filters, resetFilters, filteredCompetitions,
  bookmarkedCompetitions, upcomingCompetitions, isLoadingApi, loadLatestCompetitions
} = useCompetition();
const generatedAt = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(feed.generatedAt))
);
const nextCompetition = computed(() => upcomingCompetitions.value[0]);
const openRegistrationCount = computed(() =>
  upcomingCompetitions.value.filter((competition) =>
    competition.registrationStatus === 'open'
  ).length
);
const aidaSource = computed(() =>
  feed.sources.find((source) => source.federation === 'AIDA')
);
const nextEventCountdown = computed(() => {
  if (!nextCompetition.value) return '예정 없음';
  const today = new Date(`${getKstDateString()}T00:00:00.000Z`);
  const start = new Date(`${nextCompetition.value.startDate}T00:00:00.000Z`);
  const days = Math.round((start.getTime() - today.getTime()) / 86400000);
  if (days < 0) return '진행 중';
  if (days === 0) return '오늘';
  return `D-${days}`;
});

onMounted(loadLatestCompetitions);
</script>

<style lang="scss">
@use '@/assets/scss/pages/_competition.scss';
</style>
