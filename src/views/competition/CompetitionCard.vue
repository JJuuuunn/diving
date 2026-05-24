<template>
  <div class="competition-card">
    <!-- 상단 타이틀 및 상태 배지 영역 -->
    <div class="card-top-row">
      <div class="comp-title-area">
        <div class="fed-badges">
          <span 
            class="fed-badge" 
            :class="competition.federation.toLowerCase()"
          >
            {{ competition.federation }}
          </span>
          <span class="type-badge">
            {{ competition.type === 'pool' ? '실내 풀장 대회' : '해양 수심 대회' }}
          </span>
        </div>
        <h4>{{ competition.title }}</h4>
      </div>
      
      <div class="status-area">
        <span 
          class="status-badge" 
          :class="`status-${status}`"
        >
          {{ statusLabel }}
        </span>
        <span 
          v-if="status === 'registering' || status === 'upcoming'" 
          class="dday-label"
        >
          {{ ddayText }}
        </span>
      </div>
    </div>

    <!-- 세부 일정 및 주관 장소 그리드 -->
    <div class="card-details-grid">
      <div class="detail-item">
        <i class="fa-solid fa-calendar-days"></i>
        <div class="detail-content">
          <span class="detail-label">대회 기간</span>
          <strong class="detail-value">{{ competition.startDate }} ~ {{ competition.endDate }}</strong>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-location-dot"></i>
        <div class="detail-content">
          <span class="detail-label">개최 장소</span>
          <strong class="detail-value">{{ competition.location }}</strong>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-clock"></i>
        <div class="detail-content">
          <span class="detail-label">접수 기간</span>
          <strong class="detail-value">{{ competition.regStartDate }} ~ {{ competition.regEndDate }}</strong>
        </div>
      </div>
      <div class="detail-item">
        <i class="fa-solid fa-clipboard-check"></i>
        <div class="detail-content">
          <span class="detail-label">메디컬 스탬프</span>
          <strong class="detail-value">{{ competition.hasMedicalStampRequired ? '필수 제출' : '불필요' }}</strong>
        </div>
      </div>
    </div>

    <!-- 주종목 태그 리스트 -->
    <div class="disciplines-row">
      <span class="label">지원 종목</span>
      <span 
        v-for="disp in competition.disciplines" 
        :key="disp" 
        class="tag"
      >
        {{ disp }}
      </span>
    </div>

    <!-- 하단 북마크 및 공식 접수 신청 링크 버튼 -->
    <div class="card-actions-row">
      <button 
        class="bookmark-toggle-btn" 
        :class="{ 'is-bookmarked': isFav }"
        @click="toggleFav"
        aria-label="Toggle Bookmark"
      >
        <i class="fa-solid fa-heart"></i>
      </button>

      <a 
        v-if="competition.officialUrl && (status === 'registering' || status === 'ongoing')"
        :href="competition.officialUrl" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="apply-action-btn"
      >
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 공식 접수 바로가기
      </a>
      <button 
        v-else 
        class="apply-action-btn disabled"
        disabled
      >
        <i class="fa-solid fa-ban"></i> {{ actionButtonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Competition } from '@/types/competition';
import { useCompetition } from '@/composables/useCompetition';

const props = defineProps<{
  competition: Competition;
}>();

// 비즈니스 로직은 컴포저블을 활용하여 완벽한 SoC 준수
const { getCompetitionStatus, getDDay, toggleBookmark, isBookmarked } = useCompetition();

// 반응형 테마 속성 연동
const status = computed((): 'registering' | 'upcoming' | 'ongoing' | 'closed' => {
  return getCompetitionStatus(props.competition);
});

const isFav = computed((): boolean => {
  return isBookmarked(props.competition.id);
});

const toggleFav = (): void => {
  toggleBookmark(props.competition.id);
};

const ddayText = computed((): string => {
  if (status.value === 'registering') {
    return getDDay(props.competition.regEndDate);
  }
  if (status.value === 'upcoming') {
    return `접수 ${getDDay(props.competition.regStartDate)}`;
  }
  return '';
});

const statusLabel = computed((): string => {
  switch (status.value) {
    case 'registering': return '접수 중';
    case 'upcoming': return '접수 예정';
    case 'ongoing': return '대회 진행 중';
    case 'closed': return '접수 마감';
    default: return '상태 불명';
  }
});

const actionButtonText = computed((): string => {
  switch (status.value) {
    case 'upcoming': return '접수 시작 예정';
    case 'closed': return '접수 기간 마감';
    case 'ongoing': return '진행 중인 대회';
    default: return '신청 불가';
  }
});
</script>
