<template>
  <div class="medical-finder-container">
    <!-- 상단 헤더 및 소개, 서식 다운로드 배너 -->
    <MedicalHeader
      :is-loading-data="isLoadingData"
      :is-cached-data="isCachedData"
      :is-fallback-mode="isFallbackMode"
      :last-sync-time-str="lastSyncTimeStr"
      @open-guide="showGuideModal = true"
      @open-suggest="openSuggestModal"
      @open-forms="showFormsModal = true"
      @refresh="forceRefreshHospitals"
    />

    <!-- 검색 및 컨트롤 영역 -->
    <div class="control-box fade-in-up delay">
      <!-- 주소/병원명 텍스트 검색 -->
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <CustomInput
          v-model="searchQuery"
          placeholder="병원명, 주소(예: 마포구, 부산), 태그를 검색하세요..."
          :disabled="isLoadingData"
        />
        <CustomButton v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</CustomButton>
      </div>

      <!-- GPS 정렬 및 필터 토글 -->
      <div class="gps-control">
        <CustomButton
          class="gps-btn"
          :class="{ active: isGpsSorted, loading: geoHelper.loading.value || isLoadingData }"
          :disabled="isLoadingData"
          @click="toggleGpsSort"
        >
          <span class="gps-icon">📍</span>
          {{ geoHelper.loading.value ? '위치 탐색 중...' : isGpsSorted ? '거리순 정렬 완료 (가까운 순)' : '내 주변 가까운 병원 찾기' }}
        </CustomButton>
      </div>

      <!-- 데이터 내보내기 그룹 (CSV) -->
      <div class="export-control-group">
        <CustomButton
          class="export-btn csv"
          :disabled="isLoadingData || sortedHospitals.length === 0"
          @click="exportHospitalsToCSV"
          title="현재 조건으로 검색된 병원 목록을 CSV 파일로 다운로드합니다."
        >
          <span class="btn-icon">📊</span>
          <span>목록 CSV 다운로드</span>
        </CustomButton>
      </div>
    </div>

    <!-- 상태 필터 바 -->
    <div class="status-filter-bar fade-in-up delay">
      <span class="filter-label">🔍 발급 상태 필터:</span>
      <div class="filter-chips">
        <label class="filter-chip" :class="{ active: selectedStatuses.includes('active') }">
          <input type="checkbox" value="active" v-model="selectedStatuses" />
          <span class="chip-dot active"></span>
          정상 발급 중
        </label>
        <label class="filter-chip" :class="{ active: selectedStatuses.includes('paused') }">
          <input type="checkbox" value="paused" v-model="selectedStatuses" />
          <span class="chip-dot paused"></span>
          임시 중단
        </label>
        <label class="filter-chip" :class="{ active: selectedStatuses.includes('pending') }">
          <input type="checkbox" value="pending" v-model="selectedStatuses" />
          <span class="chip-dot pending"></span>
          검수 대기
        </label>
        <label class="filter-chip" :class="{ active: selectedStatuses.includes('inactive') }">
          <input type="checkbox" value="inactive" v-model="selectedStatuses" />
          <span class="chip-dot inactive"></span>
          발급 불가
        </label>
      </div>
    </div>

    <!-- GPS 오류 혹은 로딩 상태 표시 -->
    <div v-if="geoHelper.error.value" class="geo-error-alert fade-in-up">
      ⚠️ {{ geoHelper.error.value }}
    </div>

    <!-- 🗺️ 반응형 지도 및 리스트 스플릿 레이아웃 영역 -->
    <div class="dashboard-wrapper">
      <!-- 📍 모바일 전용 뷰 탭 컨트롤러 (1024px 미만에서만 표시) -->
      <div class="mobile-view-tabs">
        <CustomButton
          class="tab-btn"
          :class="{ active: mobileActiveTab === 'list' }"
          @click="mobileActiveTab = 'list'"
        >
          📋 리스트 보기
        </CustomButton>
        <CustomButton
          class="tab-btn"
          :class="{ active: mobileActiveTab === 'map' }"
          @click="mobileActiveTab = 'map'"
        >
          🗺️ 지도 보기
        </CustomButton>
      </div>

      <!-- 1) 리스트 영역 -->
      <div
        class="list-panel"
        :class="{ 'mobile-hidden': mobileActiveTab === 'map' }"
      >
        <!-- 스켈레톤 로딩 상태 -->
        <div class="hospital-list" v-if="isLoadingData">
          <CustomSkeleton
            v-for="n in 3"
            :key="n"
            type="card"
            class="fade-in-up"
          />
        </div>

        <!-- 병원 카드 목록 (로딩 완료) -->
        <div class="hospital-list" v-else-if="filteredHospitals.length > 0">
          <MedicalHospitalCard
            v-for="(hospital, index) in sortedHospitals"
            :key="hospital.id"
            :hospital="hospital"
            :index="index"
            :is-gps-sorted="isGpsSorted"
            :is-review-opened="!!openedReviews[hospital.id]"
            :review-form="getReviewForm(hospital.id)"
            @card-click="onCardClick"
            @copy-address="copyAddress"
            @toggle-reviews="toggleReviews"
            @toggle-review-form="toggleReviewForm"
            @submit-review="submitReview"
          />
        </div>

        <!-- 검색 결과 없음 상태 -->
        <div class="empty-state fade-in-up" v-else>
          <span class="empty-icon">🏖️</span>
          <p>조건에 부합하는 메디컬 병원이 리스트에 없습니다.</p>
          <small>스프레드시트에 새로운 발급 성공 병원을 정비하거나, 검색어를 다르게 입력해 주세요.</small>
        </div>
      </div> <!-- Closes list-panel -->

      <!-- 2) 지도 영역 -->
      <div
        class="map-panel"
        :class="{ 'mobile-hidden': mobileActiveTab === 'list' }"
      >
        <div class="map-container-wrapper">
          <div id="kakao-map" class="map-canvas"></div>

          <!-- 지도 로딩 또는 에러 정보 상태 표시 -->
          <div v-if="!isMapLoaded && mapError" class="map-status-overlay error">
            <span class="warning-icon">⚠️</span>
            <p>{{ mapError }}</p>
            <small>지도가 연결되지 않아도 병원 리스트는 정상적으로 검색하고 조회하실 수 있습니다.</small>
          </div>
          <div v-else-if="!isMapLoaded" class="map-status-overlay loading">
            <span class="spinner"></span>
            <p>카카오 지도를 활성화하고 있습니다...</p>
          </div>
        </div>
      </div>
    </div> <!-- Closes dashboard-wrapper -->

    <!-- 의사 가이드라인 팝업 모달 -->
    <MedicalGuideModal
      v-if="showGuideModal"
      @close="showGuideModal = false"
    />

    <!-- 🏥 신규 병원 제보하기 팝업 모달 -->
    <MedicalSuggestModal
      v-if="showSuggestModal"
      :form="suggestForm"
      @close="closeSuggestModal"
      @submit="submitHospitalSuggestion"
    />

    <!-- 📄 공식 메디컬 서식 다운로드 센터 팝업 모달 -->
    <MedicalFormsModal
      v-if="showFormsModal"
      @close="showFormsModal = false"
    />

    <!-- 전역 푸터 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useMedical } from '@/composables/useMedical';
import { useKakaoMap } from '@/composables/useKakaoMap';
import type { Hospital } from '@/types/medical';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import Footer from '@/components/Footer.vue';

import MedicalHeader from './MedicalHeader.vue';
import MedicalHospitalCard from './MedicalHospitalCard.vue';
import MedicalGuideModal from './MedicalGuideModal.vue';
import MedicalSuggestModal from './MedicalSuggestModal.vue';
import MedicalFormsModal from './MedicalFormsModal.vue';

const {
  searchQuery,
  selectedStatuses,
  showSuggestModal,
  suggestForm,
  isGpsSorted,
  geoHelper,
  rawHospitals,
  isLoadingData,
  isFallbackMode,
  isCachedData,
  lastSyncTimeStr,
  openedReviews,
  filteredHospitals,
  sortedHospitals,
  toggleReviews,
  openSuggestModal,
  closeSuggestModal,
  loadHospitalsData,
  forceRefreshHospitals,
  copyAddress,
  toggleGpsSort,
  getReviewForm,
  toggleReviewForm,
  submitReview,
  submitHospitalSuggestion,
  exportHospitalsToCSV
} = useMedical();

const showGuideModal = ref(false);
const showFormsModal = ref(false);
const mobileActiveTab = ref<'list' | 'map'>('list');

// 🗺️ 카카오 지도 API 설정 및 훅 연동
const KAKAO_MAP_API_KEY = (import.meta.env.VITE_KAKAO_MAP_API_KEY as string) || '';
const {
  isMapLoaded,
  mapError,
  initMapSdk,
  createMapInstance,
  updateMarkers,
  focusOnHospital,
  updateUserLocationMarker
} = useKakaoMap();

// 리스트에서 병원 클릭 시 지도 중심으로 패닝 및 마커 강조
const onCardClick = (hospital: Hospital) => {
  if (isMapLoaded.value && hospital.lat && hospital.lng) {
    focusOnHospital(hospital.id, true);
  }
};

// 마커 클릭 시 해당 병원 카드로 부드러운 스크롤 이동 및 플래시 하이라이트
const scrollToHospitalCard = (hospitalId: string) => {
  if (mobileActiveTab.value === 'map') {
    mobileActiveTab.value = 'list';
  }
  setTimeout(() => {
    const el = document.getElementById(`hospital-card-${hospitalId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-flash');
      setTimeout(() => {
        el.classList.remove('highlight-flash');
      }, 1500);
    }
  }, 100);
};

onMounted(async () => {
  await loadHospitalsData();

  await nextTick();

  if (KAKAO_MAP_API_KEY) {
    const success = await initMapSdk(KAKAO_MAP_API_KEY);
    if (success) {
      const firstComp = rawHospitals.value.find(h => h.lat && h.lng);
      const initLat = firstComp ? firstComp.lat : 37.5665;
      const initLng = firstComp ? firstComp.lng : 126.9780;

      const created = createMapInstance('kakao-map', initLat, initLng);
      if (created) {
        updateMarkers(filteredHospitals.value, (hospital) => {
          scrollToHospitalCard(hospital.id);
        });
      }
    }
  } else {
    mapError.value = 'VITE_KAKAO_MAP_API_KEY가 비어있어 지도가 비활성화되었습니다. (.env.local 파일을 구성하여 로드할 수 있습니다.)';
  }
});

watch(filteredHospitals, (newList) => {
  if (isMapLoaded.value) {
    updateMarkers(newList, (hospital) => {
      scrollToHospitalCard(hospital.id);
    });
  }
}, { deep: true });

watch([isGpsSorted, () => geoHelper.coords.value], ([sorted, coords]) => {
  if (isMapLoaded.value) {
    if (sorted && coords) {
      updateUserLocationMarker(coords.latitude, coords.longitude);
    } else {
      updateUserLocationMarker(null, null);
    }
  }
}, { immediate: true });
</script>

<style lang="scss">
@use '@/assets/scss/pages/_medical.scss';
</style>
