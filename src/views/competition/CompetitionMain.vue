<template>
  <div class="competition-container">
    <Header title="국내 프리다이빙 공식 대회" subtitle="AIDA · CMAS 대한민국 공식 일정" />
    <main class="main-content">
      <section class="summary-grid" aria-label="일정 요약">
        <div><span>다가오는 대회</span><strong>{{ upcomingCompetitions.length }}개</strong></div>
        <div><span>가장 가까운 대회</span><strong>{{ upcomingCompetitions[0]?.title ?? '예정 없음' }}</strong></div>
        <div><span>마지막 갱신</span><strong>{{ generatedAt }}</strong></div>
        <div>
          <span>공식 출처</span>
          <strong>
            <a v-for="source in feed.sources" :key="source.federation" :href="source.url" target="_blank" rel="noopener noreferrer">
              {{ source.federation }} ↗
            </a>
          </strong>
        </div>
      </section>

      <section class="filter-panel" aria-label="대회 필터">
        <label class="search-group">
          <span class="sr-only">대회 검색</span>
          <input v-model="filters.searchQuery" type="search" placeholder="대회명, 장소 또는 도시 검색" />
        </label>
        <div class="filter-row">
          <label>협회
            <select v-model="filters.federation">
              <option value="all">전체</option><option value="AIDA">AIDA</option><option value="CMAS">CMAS</option>
            </select>
          </label>
          <label>경기 유형
            <select v-model="filters.type">
              <option value="all">전체</option><option value="pool">풀</option><option value="depth">수심</option>
              <option value="mixed">혼합</option><option value="unknown">미확인</option>
            </select>
          </label>
          <label>진행 상태
            <select v-model="filters.status">
              <option value="all">전체</option><option value="upcoming">예정</option>
              <option value="ongoing">진행</option><option value="ended">종료</option>
            </select>
          </label>
        </div>
        <div class="filter-actions">
          <label class="bookmark-filter">
            <input v-model="filters.bookmarkedOnly" type="checkbox" /> 관심 대회만 보기
          </label>
          <button type="button" class="reset-button" @click="resetFilters">필터 초기화</button>
        </div>
      </section>

      <div class="view-toolbar">
        <p>검색 결과 <strong>{{ filteredCompetitions.length }}개</strong></p>
        <div role="group" aria-label="보기 방식">
          <button type="button" :aria-pressed="view === 'list'" @click="view = 'list'">목록</button>
          <button type="button" :aria-pressed="view === 'calendar'" @click="view = 'calendar'">월간</button>
        </div>
      </div>

      <section v-if="view === 'list'" class="competition-content-grid">
        <div class="competitions-main-list">
          <div v-if="filteredCompetitions.length === 0" class="empty-state">
            <strong>조건에 맞는 공식 대회가 없습니다.</strong>
            <span>필터를 초기화하거나 공식 출처의 다음 갱신을 기다려 주세요.</span>
          </div>
          <CompetitionCard v-for="competition in filteredCompetitions" :key="competition.id" :competition="competition" />
        </div>
        <aside class="my-arena-widget">
          <h2>★ 마이 아레나</h2>
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
import { computed, ref } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CompetitionCard from './CompetitionCard.vue';
import CompetitionCalendar from './CompetitionCalendar.vue';
import { useCompetition } from '@/composables/useCompetition';

const view = ref<'list' | 'calendar'>('list');
const {
  feed, filters, resetFilters, filteredCompetitions,
  bookmarkedCompetitions, upcomingCompetitions
} = useCompetition();
const generatedAt = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(feed.generatedAt))
);
</script>

<style lang="scss">
@import '@/assets/scss/pages/_competition.scss';
</style>
