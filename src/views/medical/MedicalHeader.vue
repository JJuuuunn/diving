<template>
  <header class="medical-header">
    <h1 class="fade-in-up">🏥 메디컬 스탬프 파인더</h1>
    <p class="fade-in-up delay">
      다이빙 대회를 위한 의사 소견서/진단서(Medical Stamp)를 원활하게 발급해 주는 다이버 인증 병원 리스트입니다.
    </p>

    <div class="fade-in-up delay header-actions-wrapper">
      <!-- 의사 설득용 가이드라인 버튼 -->
      <CustomButton class="guide-btn" @click="emit('openGuide')">
        🩺 의사 선생님 설득용 가이드라인 보기
      </CustomButton>

      <!-- 🏥 신규 병원 제보하기 버튼 (방안 B) -->
      <CustomButton class="suggest-btn" @click="emit('openSuggest')">
        🏥 내가 아는 발급 성공 병원 제보하기
      </CustomButton>

      <!-- 🔄 실시간 동기화 캐시 새로고침 버튼 -->
      <CustomButton
        class="sync-btn"
        :class="{ loading: isLoadingData }"
        :disabled="isLoadingData"
        @click="emit('refresh')"
        title="구글 스프레드시트에서 최신 정보 실시간 동기화"
      >
        <span class="sync-icon">🔄</span>
        <span>{{ isLoadingData ? '동기화 중...' : isCachedData ? `동기화 완료 (${lastSyncTimeStr})` : '실시간 동기화' }}</span>
      </CustomButton>
    </div>

    <!-- 실시간 API 폴백 활성화 시 경고 배지 -->
    <div v-if="isFallbackMode" class="fade-in-up delay fallback-badge-container">
      <div class="fallback-badge">
        ⚠️ 구글 스프레드시트 연동 실패로 인해 로컬 캐시 데이터(2026-05 기준)를 표시하고 있습니다.
      </div>
    </div>
  </header>

  <!-- 📄 공식 메디컬 서식 다운로드 센터 진입 배너 (2-Depth) -->
  <div class="forms-download-banner fade-in-up delay">
    <div class="banner-title">
      <span class="banner-icon">📄</span>
      <div>
        <h3>대회 제출용 공식 메디컬 서식 다운로드 센터</h3>
        <p>병원 방문 전에 해당하는 종목의 질문지를 미리 인쇄하여 수동 체크 후 지참해 주세요.</p>
      </div>
    </div>
    <div class="banner-actions">
      <CustomButton
        class="download-center-btn"
        @click="emit('openForms')"
        title="공식 프리다이빙 메디컬 질문지 다운로드 센터 열기"
      >
        <span>📄 서식 다운로드 센터 열기</span>
        <span class="arrow-icon">➔</span>
      </CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import CustomButton from '@/components/CustomButton.vue';

defineProps<{
  isLoadingData: boolean;
  isCachedData: boolean;
  isFallbackMode: boolean;
  lastSyncTimeStr: string;
}>();

const emit = defineEmits<{
  (e: 'openGuide'): void;
  (e: 'openSuggest'): void;
  (e: 'openForms'): void;
  (e: 'refresh'): void;
}>();
</script>
