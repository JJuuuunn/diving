<template>
  <div
    :id="'hospital-card-' + hospital.id"
    class="hospital-card fade-in-up"
    :style="{ animationDelay: `${index * 0.05}s` }"
    @click="emit('cardClick', hospital)"
    title="지도에서 이 병원 위치 보기"
  >
    <div class="card-top">
      <div class="title-area">
        <h3>📍 {{ hospital.name }}</h3>
        <!-- 내 위치 활성화 시 실시간 거리 배지 노출 -->
        <span v-if="isGpsSorted && hospital.distance !== undefined" class="distance-badge">
          🚗 내 위치에서 {{ hospital.distance }} km
        </span>
      </div>
      <div class="badge-row">
        <span class="update-badge">최근 확인: {{ formatDate(hospital.lastUpdated) }}</span>
        <!-- 상태 배지 노출 -->
        <span v-if="hospital.status === 'active'" class="status-chip active">
          <span class="dot"></span> 발급중
        </span>
        <span v-else-if="hospital.status === 'paused'" class="status-chip paused">
          <span class="dot"></span> 중단
        </span>
        <span v-else-if="hospital.status === 'pending'" class="status-chip pending">
          <span class="dot"></span> 검수중
        </span>
        <span v-else-if="hospital.status === 'inactive'" class="status-chip inactive">
          <span class="dot"></span> 불가
        </span>
      </div>
    </div>

    <div class="card-details">
      <div class="detail-item address-item">
        <span class="label">🏢 주소:</span>
        <span
          class="value address-value"
          @click.stop="emit('copyAddress', hospital.address)"
          :title="`${hospital.address} (클릭 시 주소 복사)`"
        >
          {{ hospital.address }}
        </span>
        <div class="address-actions">
          <!-- 원형 지도 바로가기 로고 버튼 세트 -->
          <div class="map-icons">
            <!-- 카카오맵 버튼 -->
            <a
              :href="hospital.kakaoPlaceId
                ? `https://place.map.kakao.com/${hospital.kakaoPlaceId}`
                : `https://map.kakao.com/link/to/${encodeURIComponent(hospital.name)},${hospital.lat},${hospital.lng}`"
              target="_blank"
              rel="noopener noreferrer"
              class="map-icon-btn kakao"
              :title="`카카오맵 ${hospital.kakaoPlaceId ? '상세 정보' : '길찾기'} 보기`"
              @click.stop
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 5.58 2 10c0 2.906 1.884 5.476 4.72 6.848-.112.42-.406 1.516-.465 1.748-.073.29-.29 1.157.126 1.157.34 0 1.954-1.328 2.73-1.856.346.066.702.103 1.066.103 5.523 0 10-3.58 10-8s-4.477-8-10-8z"/>
              </svg>
            </a>

            <!-- 네이버 지도 버튼 -->
            <a
              :href="hospital.naverPlaceId
                ? `https://naver.me/${hospital.naverPlaceId}`
                : `https://map.naver.com/v5/search/${encodeURIComponent(hospital.name)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="map-icon-btn naver"
              :title="`네이버 지도 ${hospital.naverPlaceId ? '상세 정보' : '검색'} 보기`"
              @click.stop
            >
              <svg viewBox="0 0 24 24">
                <path d="M16.2 3H21v18h-4.8L9 9.9V21H4V3h4.8l7.2 11.1V3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="label">📞 전화:</span>
        <a :href="`tel:${hospital.tel}`" class="value tel-link" @click.stop>{{ hospital.tel }}</a>
      </div>
      <div class="detail-item">
        <span class="label">💵 발급비:</span>
        <span class="value fee-value">{{ hospital.fee }}</span>
      </div>
    </div>

    <!-- 다이버 유용한 팁 -->
    <div class="card-tips">
      <strong>💡 다이버 팁 & 정보:</strong>
      <p :title="hospital.tips">{{ hospital.tips }}</p>
    </div>

    <!-- 태그 리스트 -->
    <div class="card-tags">
      <span
        v-for="(tag, tIdx) in hospital.tags"
        :key="tIdx"
        class="tag-chip"
      >
        # {{ tag }}
      </span>
    </div>

    <!-- 다이버 실시간 한 줄 후기 및 히스토리 아코디언 -->
    <div class="review-section">
      <CustomButton class="review-toggle-btn" @click.stop="emit('toggleReviews', hospital.id)">
        💬 다이버 방문 후기 & 히스토리 ({{ hospital.reviews ? hospital.reviews.length : 0 }}개)
        <span class="toggle-arrow" :class="{ open: isReviewOpened }">▼</span>
      </CustomButton>

      <div
        class="review-list-wrapper"
        :style="{ maxHeight: isReviewOpened ? '2000px' : '0px' }"
        @click.stop
      >
        <div class="review-list" v-if="hospital.reviews && hospital.reviews.length > 0">
          <div
            v-for="(rev, rIdx) in hospital.reviews"
            :key="rIdx"
            class="review-bubble"
          >
            <div class="bubble-meta">
              <span class="author-info">
                <span class="author-icon">🤿</span>
                <strong>{{ rev.author }}</strong>
                <span
                  class="success-badge"
                  :class="rev.isSuccess ? 'success' : 'fail'"
                >
                  {{ rev.isSuccess ? '발급 성공' : '발급 실패' }}
                </span>
                <!-- 실제 지불 금액 배지 -->
                <span
                  v-if="rev.actualFee"
                  class="fee-badge"
                >
                  💵 지불: {{ rev.actualFee }}
                </span>
              </span>
              <span class="date-info">{{ formatDate(rev.date) }}</span>
            </div>
            <p class="bubble-content">{{ rev.content }}</p>
          </div>
        </div>
        <div class="review-list" v-else>
          <div class="no-reviews">
            아직 등록된 다이버 방문 후기가 없습니다.
            첫 번째 발급 후기를 남겨주세요!
          </div>
        </div>

        <!-- 후기 작성하기 인라인 폼 제어 영역 -->
        <div class="review-write-section">
          <!-- 후기 작성하기 열기 토글 버튼 -->
          <CustomButton
            class="write-toggle-btn"
            :class="{ active: reviewForm.showForm }"
            @click="emit('toggleReviewForm', hospital.id)"
          >
            <span>{{ reviewForm.showForm ? '✖️ 작성 취소하기' : '✍️ 나도 한 줄 후기 남기기' }}</span>
          </CustomButton>

          <!-- 후기 작성 폼 슬라이더 박스 -->
          <div
            v-if="reviewForm.showForm"
            class="review-form-box"
          >
            <div class="form-title">💬 이 병원에 대한 실시간 발급 후기 쓰기</div>

            <!-- 입력 필드 그룹 -->
            <div class="form-fields">
              <!-- 닉네임 / 발급 성공 여부 한 줄 배치 -->
              <div class="field-row">
                <div class="field-group nickname-group">
                  <label>🤿 닉네임</label>
                  <CustomInput
                    v-model="reviewForm.author"
                    placeholder="예: 버디다이버"
                    :disabled="reviewForm.isSubmitting"
                  />
                </div>

                <div class="field-group success-toggle-group">
                  <label>📌 발급 결과</label>
                  <CustomSwitch
                    v-model="reviewForm.isSuccess"
                    active-text="성공"
                    inactive-text="실패"
                    active-icon="fa-circle-check"
                    inactive-icon="fa-circle-xmark"
                    :disabled="reviewForm.isSubmitting"
                  />
                </div>
              </div>

              <!-- 실제 지불 비용 (선택) -->
              <div class="field-group">
                <label>💵 실제 지불한 발급비 (선택)</label>
                <CustomInput
                  v-model="reviewForm.actualFee"
                  placeholder="예: 25,000원"
                  :disabled="reviewForm.isSubmitting"
                />
              </div>

              <!-- 후기 한 줄 내용 (필수) -->
              <div class="field-group">
                <label>📝 생생한 방문 후기 한 줄 (필수)</label>
                <CustomTextarea
                  v-model="reviewForm.content"
                  placeholder="대기 시간, 예약 필요성, 또는 의사 선생님 압력 평형성 소견 반응 등 꿀팁을 남겨주세요!"
                  :rows="3"
                  :disabled="reviewForm.isSubmitting"
                />
              </div>
            </div>

            <!-- 에러 및 성공 메시지 피드백 뷰 -->
            <div v-if="reviewForm.errorMessage" class="form-message error">
              {{ reviewForm.errorMessage }}
            </div>
            <div v-if="reviewForm.successMessage" class="form-message success">
              {{ reviewForm.successMessage }}
            </div>

            <!-- 제출 액션 버튼 -->
            <div class="form-actions">
              <CustomButton
                type="button"
                class="submit-action-btn"
                :disabled="reviewForm.isSubmitting"
                @click="emit('submitReview', hospital.id)"
              >
                <span v-if="reviewForm.isSubmitting" class="spinner"></span>
                <span>{{ reviewForm.isSubmitting ? '스프레드시트에 등록 중...' : '📝 후기 제출하기' }}</span>
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExtendedHospital, ReviewForm } from '@/types/medical';
import { formatDate } from '@/utils/formatter';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSwitch from '@/components/CustomSwitch.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';

defineProps<{
  hospital: ExtendedHospital;
  index: number;
  isGpsSorted: boolean;
  isReviewOpened: boolean;
  reviewForm: ReviewForm;
}>();

const emit = defineEmits<{
  (e: 'cardClick', hospital: ExtendedHospital): void;
  (e: 'copyAddress', address: string): void;
  (e: 'toggleReviews', hospitalId: string): void;
  (e: 'toggleReviewForm', hospitalId: string): void;
  (e: 'submitReview', hospitalId: string): void;
}>();
</script>
