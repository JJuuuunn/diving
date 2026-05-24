<template>
  <div class="competition-container">
    <!-- 메인 네비게이션 헤더 -->
    <Header title="프리다이빙 대회 일정" subtitle="Freediving Competition Arena 🏆" />

    <main class="main-content">
      <!-- 실시간 카운트다운 위젯 대시보드 (가장 임박한 대회 정보 노출) -->
      <section v-if="nearestCompetition && !countdown.isOver" class="countdown-dashboard">
        <div class="dashboard-header">
          <span class="label">가장 임박한 접수 일정</span>
          <h2>🔥 {{ nearestCompetition.title }}</h2>
          <span class="sub">접수 마감 시한까지 남은 시간</span>
        </div>

        <div class="timer-grid">
          <div class="time-unit">
            <span class="value">{{ String(countdown.days).padStart(2, '0') }}</span>
            <span class="label">Days</span>
          </div>
          <div class="time-unit">
            <span class="value">{{ String(countdown.hours).padStart(2, '0') }}</span>
            <span class="label">Hours</span>
          </div>
          <div class="time-unit">
            <span class="value">{{ String(countdown.minutes).padStart(2, '0') }}</span>
            <span class="label">Mins</span>
          </div>
          <div class="time-unit">
            <span class="value">{{ String(countdown.seconds).padStart(2, '0') }}</span>
            <span class="label">Secs</span>
          </div>
        </div>
      </section>

      <!-- 다차원 지능형 필터 영역 -->
      <section class="filter-panel">
        <!-- 텍스트 검색창 -->
        <div class="search-group">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input 
            v-model="filters.searchQuery" 
            type="text" 
            placeholder="대회명 또는 장소를 입력하세요..."
          />
        </div>

        <!-- 3열 셀렉트 필터 그리드 -->
        <div class="filter-row">
          <!-- 주관 협회 필터 -->
          <div class="filter-item">
            <label for="federation">주관 협회</label>
            <CustomSelect 
              id="federation" 
              v-model="filters.federation" 
              :options="federationOptions" 
            />
          </div>

          <!-- 대회 형태 필터 -->
          <div class="filter-item">
            <label for="type">대회 분류</label>
            <CustomSelect 
              id="type" 
              v-model="filters.type" 
              :options="typeOptions" 
            />
          </div>

          <!-- 접수 상태 필터 -->
          <div class="filter-item">
            <label for="status">접수 상태</label>
            <CustomSelect 
              id="status" 
              v-model="filters.status" 
              :options="statusOptions" 
            />
          </div>
        </div>
      </section>

      <!-- 본문 분할 컨텐츠 레이아웃 (메인 대회 리스트 + 우측 마이 아레나 체크리스트) -->
      <div class="competition-content-grid">
        <!-- 좌측: 실시간 대회 일정 목록 -->
        <section class="competitions-main-list">
          <h3 class="list-title">
            📅 검색된 대회 일정 
            <span>총 {{ filteredCompetitions.length }}개</span>
          </h3>

          <!-- 대회 리스트가 비어있을 때 빈 화면 노출 -->
          <div v-if="filteredCompetitions.length === 0" class="empty-state">
            <i class="fa-solid fa-calendar-xmark"></i>
            <p>검색 조건에 맞는 프리다이빙 대회 일정이 없습니다.</p>
          </div>

          <!-- 대회 정보 리스트 렌더링 -->
          <CompetitionCard 
            v-for="comp in filteredCompetitions" 
            :key="comp.id" 
            :competition="comp"
          />
        </section>

        <!-- 우측 사이드바: 마이 아레나 (관심 대회 & 유기적 연동 체크리스트) -->
        <aside class="my-arena-widget">
          <!-- 관심 대회 카드 목록 -->
          <div class="widget-card">
            <h3><i class="fa-solid fa-heart"></i> 마이 아레나</h3>
            <div class="my-comp-list">
              <div v-if="bookmarkedCompetitions.length === 0" class="empty-bookmark">
                <i class="fa-regular fa-bookmark"></i>
                <p>관심 있는 대회 카드의 하트 버튼을 누르면 일정이 여기에 기록됩니다.</p>
              </div>

              <!-- 등록된 북마크 아이템 리스트 -->
              <div 
                v-for="comp in bookmarkedCompetitions" 
                :key="comp.id" 
                class="my-comp-item"
              >
                <div class="info">
                  <span class="title">{{ comp.title }}</span>
                  <span class="dday">{{ getDDay(comp.startDate) }} 개최</span>
                </div>
                <button 
                  class="remove-btn" 
                  @click="toggleBookmark(comp.id)"
                  title="일정 삭제"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <!-- 스마트 3대 모달 유기적 크로스 연동 체크리스트 -->
            <div class="arena-checklist">
              <span class="checklist-title">대회 참가 완벽 대비책</span>

              <!-- 1. 메디컬 파인더 연동 -->
              <div class="checklist-item">
                <i class="fa-solid" :class="hasMedicalStampInFav ? 'fa-circle-check' : 'fa-circle'"></i>
                <div class="link-wrapper">
                  <span>메디컬 스탬프 인증서</span>
                  <RouterLink :to="{ name: '메디컬 스탬프 파인더' }">
                    🏥 내 주변 발급 병원 조회 <i class="fa-solid fa-chevron-right"></i>
                  </RouterLink>
                </div>
              </div>

              <!-- 2. 로그북 트레이닝 연습 연동 -->
              <div class="checklist-item">
                <i class="fa-solid" :class="hasLogRecords ? 'fa-circle-check' : 'fa-circle'"></i>
                <div class="link-wrapper">
                  <span>훈련 대비 공식 PB 연습</span>
                  <RouterLink :to="{ name: '다이빙 로그북' }">
                    🌊 트레이닝 일지 쓰러가기 <i class="fa-solid fa-chevron-right"></i>
                  </RouterLink>
                </div>
              </div>

              <!-- 3. DPTI 멘탈 유형 연동 -->
              <div class="checklist-item">
                <i class="fa-solid fa-circle-check"></i>
                <div class="link-wrapper">
                  <span>다이버 멘탈/성향 점검</span>
                  <RouterLink :to="{ name: '다이버 성향 테스트' }">
                    🧠 나의 다이빙 성향 점검 <i class="fa-solid fa-chevron-right"></i>
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- 전역 푸터 -->
      <Footer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useCompetition } from '@/composables/useCompetition';
import { useLogbookStore } from '@/stores/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CompetitionCard from './CompetitionCard.vue';

// 필터링 셀렉트 옵션 정의
const federationOptions = [
  { value: 'all', label: '모든 협회' },
  { value: 'AIDA', label: 'AIDA 주관' },
  { value: 'CMAS', label: 'CMAS 주관' },
  { value: 'Independent', label: '독립/사설 대회' }
];

const typeOptions = [
  { value: 'all', label: '모든 장소' },
  { value: 'pool', label: '실내 풀장 대회' },
  { value: 'depth', label: '해양 수심 대회' }
];

const statusOptions = [
  { value: 'all', label: '모든 상태' },
  { value: 'registering', label: '접수 진행 중' },
  { value: 'upcoming', label: '접수 시작 예정' },
  { value: 'ongoing', label: '대회 진행 중' },
  { value: 'closed', label: '기간 마감' }
];

// 비즈니스 로직 및 컴포저블 데이터 취득
const {
  filters,
  getDDay,
  filteredCompetitions,
  nearestCompetition,
  countdown,
  startCountdown,
  bookmarkedCompetitions,
  toggleBookmark
} = useCompetition();

const logbookStore = useLogbookStore();

// 컴포넌트 마운트 시 실시간 타이머 가동
onMounted((): void => {
  startCountdown();
});

// 크로스 모듈 연동 체크리스트 상태 계산
const hasMedicalStampInFav = computed((): boolean => {
  // 북마크한 대회들 중 메디컬 스탬프 진단서 제출이 필요한 대회가 존재할 경우 체크
  return bookmarkedCompetitions.value.some((comp) => comp.hasMedicalStampRequired);
});

const hasLogRecords = computed((): boolean => {
  // 사용자의 로그북 기록이 최소 1개 이상 존재할 경우 훈련 진행으로 인정
  return logbookStore.logs.length > 0;
});
</script>

<style lang="scss">
@import '@/assets/scss/pages/_competition.scss';
</style>
