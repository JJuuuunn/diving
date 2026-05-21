<template>
  <div class="medical-finder-container">
    <!-- 상단 헤더 및 소개 -->
    <header class="medical-header">
      <h1 class="fade-in-up">🏥 메디컬 스탬프 파인더</h1>
      <p class="fade-in-up delay">
        다이빙 대회를 위한 의사 소견서/진단서(Medical Stamp)를 원활하게 발급해 주는 다이버 인증 병원 리스트입니다.
      </p>
      
      <div class="fade-in-up delay header-actions-wrapper" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-top: 0.5rem;">
        <!-- 의사 설득용 가이드라인 버튼 -->
        <button class="guide-btn" @click="showGuideModal = true">
          🩺 의사 선생님 설득용 가이드라인 보기
        </button>
        
        <!-- 🏥 신규 병원 제보하기 버튼 (방안 B) -->
        <button class="suggest-btn" @click="openSuggestModal">
          🏥 내가 아는 발급 성공 병원 제보하기
        </button>
      </div>

      <!-- 실시간 API 폴백 활성화 시 경고 배지 -->
      <div v-if="isFallbackMode" class="fade-in-up delay fallback-badge-container" style="margin-top: 0.5rem; display: flex; justify-content: center;">
        <div class="fallback-badge">
          ⚠️ 구글 스프레드시트 연동 실패로 인해 로컬 캐시 데이터(2026-05 기준)를 표시하고 있습니다.
        </div>
      </div>

    </header>

    <!-- 검색 및 컨트롤 영역 -->
    <div class="control-box fade-in-up delay">
      <!-- 주소/병원명 텍스트 검색 -->
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="병원명, 주소(예: 마포구, 부산), 태그를 검색하세요..."
          :disabled="isLoadingData"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
      </div>

      <!-- GPS 정렬 및 필터 토글 -->
      <div class="gps-control">
        <button 
          class="gps-btn" 
          :class="{ active: isGpsSorted, loading: geoHelper.loading.value || isLoadingData }"
          :disabled="isLoadingData"
          @click="toggleGpsSort"
        >
          <span class="gps-icon">📍</span>
          {{ geoHelper.loading.value ? '위치 탐색 중...' : isGpsSorted ? '거리순 정렬 완료 (가까운 순)' : '내 주변 가까운 병원 찾기' }}
        </button>
      </div>
    </div>

    <!-- GPS 오류 혹은 로딩 상태 표시 -->
    <div v-if="geoHelper.error.value" class="geo-error-alert fade-in-up">
      ⚠️ {{ geoHelper.error.value }}
    </div>

    <!-- 스켈레톤 로딩 상태 -->
    <div class="hospital-list" v-if="isLoadingData">
      <div v-for="n in 3" :key="n" class="hospital-card skeleton-card fade-in-up">
        <div class="card-top">
          <div class="skeleton-line title"></div>
        </div>
        <div class="card-details" style="margin-top: 1rem;">
          <div class="skeleton-line medium" style="margin-bottom: 0.85rem;"></div>
          <div class="skeleton-line short" style="margin-bottom: 0.85rem;"></div>
          <div class="skeleton-line medium" style="margin-bottom: 0.85rem;"></div>
        </div>
        <div class="card-tips" style="margin-top: 1rem; border: none; background: rgba(0,0,0,0.02);">
          <div class="skeleton-line medium" style="margin-bottom: 0.5rem; width: 30%;"></div>
          <div class="skeleton-line medium"></div>
        </div>
      </div>
    </div>

    <!-- 병원 카드 목록 (로딩 완료) -->
    <div class="hospital-list" v-else-if="filteredHospitals.length > 0">
      <div 
        v-for="(hospital, index) in sortedHospitals" 
        :key="hospital.id"
        class="hospital-card fade-in-up"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="card-top">
          <div class="title-area">
            <h3>{{ hospital.name }}</h3>
            <!-- 내 위치 활성화 시 실시간 거리 배지 노출 -->
            <span v-if="isGpsSorted && hospital.distance !== undefined" class="distance-badge">
              🚗 내 위치에서 {{ hospital.distance }} km
            </span>
            <!-- 상태 배지 노출 -->
            <span v-if="hospital.status === 'paused'" class="status-chip paused">
              <span class="dot"></span> 발급 임시 중단
            </span>
            <span v-else class="status-chip active">
              <span class="dot"></span> 정상 발급 중
            </span>
          </div>
          <span class="update-badge">최근 확인: {{ formatDate(hospital.lastUpdated) }}</span>
        </div>

        <div class="card-details">
          <div class="detail-item address-item">
            <span class="label">🏢 주소:</span>
            <span class="value">{{ hospital.address }}</span>
            <div class="address-actions">
              <button class="copy-btn" @click="copyAddress(hospital.address)">📋 복사</button>

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
            <a :href="`tel:${hospital.tel}`" class="value tel-link">{{ hospital.tel }}</a>
          </div>
          <div class="detail-item">
            <span class="label">💵 발급비:</span>
            <span class="value fee-value">{{ hospital.fee }}</span>
          </div>
        </div>

        <!-- 다이버 유용한 팁 -->
        <div class="card-tips">
          <strong>💡 다이버 팁 & 정보:</strong>
          <p>{{ hospital.tips }}</p>
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
          <button class="review-toggle-btn" @click="toggleReviews(hospital.id)">
            💬 다이버 방문 후기 & 히스토리 ({{ hospital.reviews ? hospital.reviews.length : 0 }}개)
            <span class="toggle-arrow" :class="{ open: openedReviews[hospital.id] }">▼</span>
          </button>
          
          <div 
            class="review-list-wrapper"
            :style="{ maxHeight: openedReviews[hospital.id] ? '2000px' : '0px' }"
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
              <button 
                class="write-toggle-btn"
                :class="{ active: getReviewForm(hospital.id).showForm }"
                @click="toggleReviewForm(hospital.id)"
              >
                <span>{{ getReviewForm(hospital.id).showForm ? '✖️ 작성 취소하기' : '✍️ 나도 한 줄 후기 남기기' }}</span>
              </button>

              <!-- 후기 작성 폼 슬라이더 박스 -->
              <div 
                v-if="getReviewForm(hospital.id).showForm"
                class="review-form-box"
              >
                <div class="form-title">💬 이 병원에 대한 실시간 발급 후기 쓰기</div>
                
                <!-- 입력 필드 그룹 -->
                <div class="form-fields">
                  <!-- 닉네임 / 발급 성공 여부 한 줄 배치 -->
                  <div class="field-row">
                    <div class="field-group nickname-group">
                      <label>🤿 닉네임</label>
                      <input 
                        type="text" 
                        v-model="getReviewForm(hospital.id).author"
                        placeholder="예: 버디다이버"
                        :disabled="getReviewForm(hospital.id).isSubmitting"
                      />
                    </div>
                    
                    <div class="field-group success-toggle-group">
                      <label>📌 발급 결과</label>
                      <div class="toggle-switch-wrapper">
                        <button 
                          type="button"
                          class="toggle-btn success"
                          :class="{ active: getReviewForm(hospital.id).isSuccess }"
                          @click="getReviewForm(hospital.id).isSuccess = true"
                          :disabled="getReviewForm(hospital.id).isSubmitting"
                        >
                          🟢 성공
                        </button>
                        <button 
                          type="button"
                          class="toggle-btn fail"
                          :class="{ active: !getReviewForm(hospital.id).isSuccess }"
                          @click="getReviewForm(hospital.id).isSuccess = false"
                          :disabled="getReviewForm(hospital.id).isSubmitting"
                        >
                          🔴 실패
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 실제 지불 비용 (선택) -->
                  <div class="field-group">
                    <label>💵 실제 지불한 발급비 (선택)</label>
                    <input 
                      type="text" 
                      v-model="getReviewForm(hospital.id).actualFee"
                      placeholder="예: 25,000원"
                      :disabled="getReviewForm(hospital.id).isSubmitting"
                    />
                  </div>

                  <!-- 후기 한 줄 내용 (필수) -->
                  <div class="field-group">
                    <label>📝 생생한 방문 후기 한 줄 (필수)</label>
                    <textarea 
                      v-model="getReviewForm(hospital.id).content"
                      placeholder="대기 시간, 예약 필요성, 또는 의사 선생님 압력 평형성 소견 반응 등 꿀팁을 남겨주세요!"
                      rows="3"
                      :disabled="getReviewForm(hospital.id).isSubmitting"
                    ></textarea>
                  </div>
                </div>

                <!-- 에러 및 성공 메시지 피드백 뷰 -->
                <div v-if="getReviewForm(hospital.id).errorMessage" class="form-message error">
                  {{ getReviewForm(hospital.id).errorMessage }}
                </div>
                <div v-if="getReviewForm(hospital.id).successMessage" class="form-message success">
                  {{ getReviewForm(hospital.id).successMessage }}
                </div>

                <!-- 제출 액션 버튼 -->
                <div class="form-actions">
                  <button 
                    type="button"
                    class="submit-action-btn"
                    :disabled="getReviewForm(hospital.id).isSubmitting"
                    @click="submitReview(hospital.id)"
                  >
                    <span v-if="getReviewForm(hospital.id).isSubmitting" class="spinner"></span>
                    <span>{{ getReviewForm(hospital.id).isSubmitting ? '스프레드시트에 등록 중...' : '📝 후기 제출하기' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 결과 없음 상태 -->
    <div class="empty-state fade-in-up" v-else>
      <span class="empty-icon">🏖️</span>
      <p>조건에 부합하는 메디컬 병원이 리스트에 없습니다.</p>
      <small>스프레드시트에 새로운 발급 성공 병원을 정비하거나, 검색어를 다르게 입력해 주세요.</small>
    </div>

    <!-- 의사 가이드라인 팝업 모달 -->
    <div v-if="showGuideModal" class="guide-modal-overlay" @click.self="showGuideModal = false">
      <div class="guide-modal-content">
        <div class="modal-header">
          <h2>🩺 의사 대상 다이빙 메디컬 가이드</h2>
          <button class="close-modal-btn" @click="showGuideModal = false">×</button>
        </div>
        <div class="modal-body">
          <section class="modal-section">
            <h3>잠수적합성 검사의 본질</h3>
            <p>
              다이빙 메디컬 서류(스탬프)는 의사에게 법적 책임을 묻는 보증서가 아닙니다. 
              다이버(스쿠버/프리다이버)가 <strong>수중 압력 환경에서 급작스러운 의식 상실(LMC/BO)이나 호흡계 및 이비인후과적 급성 압착(Barotrauma)을 일으킬 만한 기저질환(예: 조절되지 않는 간질, 급성 심장 질환, 폐기흉 등)이 없음</strong>을 의학적으로 확인해 주는 소견서입니다.
            </p>
          </section>

          <section class="modal-section">
            <h3>의사 소견 진행 시 설명 요령</h3>
            <ol>
              <li>
                <strong>"일반적인 수영 적합성에 이비인후과(압력 평형) 검사를 보태는 개념입니다."</strong> 라고 의사 선생님을 안심시켜 주세요.
              </li>
              <li>
                기본 질문지에 기재된 이비인후과 압력 평형성(유스타키오관 개통 여부) 및 기본 순환계/심폐 기능에 임상적 결격 사유가 없다는 소견만 확인되면 의사는 흔쾌히 서명할 수 있습니다.
              </li>
              <li>
                종목별 표준 서식을 미리 출력하여 지참하신 후, 서식 하단에 명시된 <strong>의사 지침서(Physician Guidelines)</strong> 페이지를 의사에게 먼저 펼쳐 보여주면 진료가 훨씬 빠르고 원활하게 진행됩니다.
                <br/>
                <span class="sub-desc" style="display: block; font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                  * 스쿠버다이빙: <strong>WRSTC 표준 메디컬 서식</strong>
                  <br/>
                  * 프리다이빙: <strong>AIDA 프리다이빙 메디컬 질문지 사전 작성본</strong>
                </span>
              </li>
            </ol>
          </section>

          <section class="modal-section alert-box">
            <h4>💡 병원 가기 전 다이버 필수 준비물</h4>
            <ul>
              <li>대회 혹은 협회 공식 메디컬 질문 서식 인쇄본 (스쿠버: WRSTC / 프리다이빙: AIDA 등 1부)</li>
              <li>신분증</li>
              <li>최근 6개월 이내의 신체검사 결과표 (지참 시 시간/비용 절약 가능)</li>
            </ul>
          </section>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="showGuideModal = false">확인했습니다</button>
        </div>
      </div>
    </div>

    <!-- 🏥 신규 병원 제보하기 팝업 모달 -->
    <div v-if="showSuggestModal" class="suggest-modal-overlay" @click.self="closeSuggestModal">
      <div class="suggest-modal-content scale-in">
        <div class="modal-header">
          <h2>🏥 발급 성공 병원 제보하기</h2>
          <button class="close-modal-btn" @click="closeSuggestModal">×</button>
        </div>
        
        <div class="modal-body">
          <p class="modal-intro">
            다이버들이 소견서를 발급받는 데 성공한 병원 정보를 제보해 주세요!<br/>
            제보해 주신 병원은 **관리자 검수 후 즉시 지도 목록에 노출**됩니다.
          </p>

          <div class="suggest-form">
            <!-- 병원명 (필수) -->
            <div class="input-group">
              <label class="required">🏢 병원 이름</label>
              <input 
                type="text" 
                v-model="suggestForm.name" 
                placeholder="예: 서울이비인후과의원"
                :disabled="suggestForm.isSubmitting"
              />
            </div>

            <!-- 병원 주소 (필수) -->
            <div class="input-group">
              <label class="required">📍 병원 주소</label>
              <input 
                type="text" 
                v-model="suggestForm.address" 
                placeholder="예: 서울특별시 마포구 독막로 123"
                :disabled="suggestForm.isSubmitting"
              />
            </div>

            <!-- 병원 연락처 (선택) -->
            <div class="input-group">
              <label>📞 병원 전화번호 (선택)</label>
              <input 
                type="text" 
                v-model="suggestForm.tel" 
                placeholder="예: 02-123-4567"
                :disabled="suggestForm.isSubmitting"
              />
            </div>

            <!-- 발급 비용 (선택) -->
            <div class="input-group">
              <label>💵 스탬프 발급 비용 (선택)</label>
              <input 
                type="text" 
                v-model="suggestForm.fee" 
                placeholder="예: 20,000원 (의사 상담비 포함)"
                :disabled="suggestForm.isSubmitting"
              />
            </div>

            <!-- 추천 태그 (선택) -->
            <div class="input-group">
              <label>🏷️ 추천 태그 (선택, 콤마로 구분)</label>
              <input 
                type="text" 
                v-model="suggestForm.tags" 
                placeholder="예: 친절함, 당일발급, 예약불필요"
                :disabled="suggestForm.isSubmitting"
              />
            </div>

            <!-- 의사 소견 꿀팁 및 특징 (선택) -->
            <div class="input-group">
              <label>💡 다이버 팁 & 정보 (선택)</label>
              <textarea 
                v-model="suggestForm.tips" 
                placeholder="예: 검사 전 다이빙 목적을 차분히 설명하면 매우 친절하게 발급해 주십니다. 당일 신체검사표 지참 요망!"
                rows="3"
                :disabled="suggestForm.isSubmitting"
              ></textarea>
            </div>
          </div>

          <!-- 피드백 메시지 -->
          <div v-if="suggestForm.errorMessage" class="form-feedback error">
            {{ suggestForm.errorMessage }}
          </div>
          <div v-if="suggestForm.successMessage" class="form-feedback success">
            {{ suggestForm.successMessage }}
          </div>
        </div>

        <div class="modal-footer">
          <button 
            class="cancel-btn" 
            @click="closeSuggestModal" 
            :disabled="suggestForm.isSubmitting"
          >
            취소
          </button>
          <button 
            class="submit-btn" 
            @click="submitHospitalSuggestion" 
            :disabled="suggestForm.isSubmitting"
          >
            <span v-if="suggestForm.isSubmitting" class="spinner"></span>
            <span>{{ suggestForm.isSubmitting ? '스프레드시트에 제보 중...' : '🏥 제보 제출하기' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import hospitalsData from '@/data/hospitals.json';
import { useGeolocation } from '@/composables/useGeolocation';
import type { Hospital, Review } from '@/types/medical';
import { formatDate } from '@/utils/formatter';
import dayjs from 'dayjs';

interface ExtendedHospital extends Hospital {
  distance?: number;
}


// ⚠️ 구글 Apps Script 배포 후 발급받은 Web App URL 주소는 .env.local 파일에 설정되어 관리됩니다.
const GOOGLE_SHEET_API_URL = (import.meta.env.VITE_GOOGLE_SHEET_API_URL as string) || "";
 

const searchQuery = ref('');
const showGuideModal = ref(false);

// 병원 제보 모달 관련 상태 (방안 B)
const showSuggestModal = ref(false);
const suggestForm = ref({
  name: '',
  address: '',
  tel: '',
  fee: '',
  tags: '',
  tips: '',
  isSubmitting: false,
  errorMessage: '',
  successMessage: ''
});

const openSuggestModal = () => {
  showSuggestModal.value = true;
};

const closeSuggestModal = () => {
  showSuggestModal.value = false;
  initSuggestForm();
};

const initSuggestForm = () => {
  suggestForm.value = {
    name: '',
    address: '',
    tel: '',
    fee: '',
    tags: '',
    tips: '',
    isSubmitting: false,
    errorMessage: '',
    successMessage: ''
  };
};

const isGpsSorted = ref(false);

const geoHelper = useGeolocation();
const rawHospitals = ref<Hospital[]>([]);
const isLoadingData = ref(false);
const isFallbackMode = ref(false);

// 개별 병원 카드 아코디언 상태 관리 (key: hospitalId, value: isOpen)
const openedReviews = ref<Record<string, boolean>>({});

const toggleReviews = (hospitalId: string) => {
  openedReviews.value[hospitalId] = !openedReviews.value[hospitalId];
};


onMounted(async () => {
  await loadHospitalsData();
});

// 비동기 구글 시트 REST API 로드 및 예외 발생 시 로컬 캐시 폴백 처리
const loadHospitalsData = async () => {
  if (!GOOGLE_SHEET_API_URL) {
    // API 주소가 제공되지 않았을 때는 은은하게 즉시 로컬 JSON 로드 (폴백 경고 배지는 미표시)
    rawHospitals.value = hospitalsData as Hospital[];
    isFallbackMode.value = false;
    return;
  }

  isLoadingData.value = true;
  isFallbackMode.value = false;

  try {
    const url = `${GOOGLE_SHEET_API_URL}?origin=${encodeURIComponent(window.location.origin)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      rawHospitals.value = data as Hospital[];
    } else {
      throw new Error('API 리턴 포맷이 배열 형식이 아닙니다.');
    }
  } catch (err) {
    console.warn('구글 스프레드시트 API 로드 실패. 기존 로컬 백업 파일로 복원(폴백)합니다.', err);
    // 통신 장애, CORS 차단 등의 경우 로컬 데이터로 안전 복구
    rawHospitals.value = hospitalsData as Hospital[];
    isFallbackMode.value = true; 
  } finally {
    isLoadingData.value = false;
  }
};

// 클립보드 주소 복사
const copyAddress = (address: string) => {
  navigator.clipboard.writeText(address).then(() => {
    alert('주소가 클립보드에 복사되었습니다.');
  }).catch(() => {
    alert('주소를 복사하는 중 오류가 발생했습니다.');
  });
};

// 텍스트 필터링된 병원 리스트
const filteredHospitals = computed<ExtendedHospital[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  
  // inactive 상태인 병원은 제외
  let list = rawHospitals.value.filter(h => h.status !== 'inactive');
  
  if (query) {
    list = list.filter(h => 
      h.name.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query) ||
      h.tags.some(t => t.toLowerCase().includes(query)) ||
      h.tips.toLowerCase().includes(query)
    );
  }

  // GPS가 켜져 있으면 거리 계산 필드 주입
  if (isGpsSorted.value && geoHelper.coords.value) {
    const userLat = geoHelper.coords.value.latitude;
    const userLng = geoHelper.coords.value.longitude;
    
    return list.map(h => ({
      ...h,
      distance: geoHelper.calculateDistance(userLat, userLng, h.lat, h.lng)
    }));
  }

  return list;
});

// 거리순 혹은 기본 정렬된 병원 리스트
const sortedHospitals = computed(() => {
  const list = [...filteredHospitals.value];
  
  if (isGpsSorted.value && geoHelper.coords.value) {
    // 거리 오름차순 (가까운 순)
    return list.sort((a, b) => {
      const distA = a.distance ?? 99999;
      const distB = b.distance ?? 99999;
      return distA - distB;
    });
  }
  
  return list;
});

// GPS 정렬 활성화 / 비활성화 토글
const toggleGpsSort = async () => {
  if (isGpsSorted.value) {
    isGpsSorted.value = false;
    return;
  }

  try {
    await geoHelper.getCoords();
    isGpsSorted.value = true;
  } catch (err) {
    isGpsSorted.value = false;
    console.error('위치 권한 획득 실패:', err);
  }
};

// ==========================================
// 개별 병원 카드 후기 입력 폼 상태 및 비동기 제출 관리
// ==========================================
interface ReviewForm {
  author: string;
  isSuccess: boolean;
  actualFee: string;
  content: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  showForm: boolean;
}

const reviewForms = ref<Record<string, ReviewForm>>({});

const initReviewForm = (hospitalId: string) => {
  reviewForms.value[hospitalId] = {
    author: '',
    isSuccess: true,
    actualFee: '',
    content: '',
    isSubmitting: false,
    errorMessage: '',
    successMessage: '',
    showForm: false
  };
};

const getReviewForm = (hospitalId: string): ReviewForm => {
  if (!reviewForms.value[hospitalId]) {
    initReviewForm(hospitalId);
  }
  return reviewForms.value[hospitalId];
};

const toggleReviewForm = (hospitalId: string) => {
  const form = getReviewForm(hospitalId);
  form.showForm = !form.showForm;
  if (!form.showForm) {
    // 폼을 닫을 때 입력값 초기화
    initReviewForm(hospitalId);
  }
};

const submitReview = async (hospitalId: string) => {
  const form = getReviewForm(hospitalId);
  
  // 클라이언트 단 필수 값 유효성 검사
  const authorVal = form.author.trim();
  const contentVal = form.content.trim();
  
  if (!authorVal) {
    form.errorMessage = '닉네임을 입력해 주세요.';
    return;
  }
  if (!contentVal) {
    form.errorMessage = '후기 내용을 입력해 주세요.';
    return;
  }
  
  form.errorMessage = '';
  form.successMessage = '';
  form.isSubmitting = true;
  
  try {
    const payload = {
      action: 'addReview',
      hospitalId,
      author: authorVal,
      isSuccess: form.isSuccess,
      actualFee: form.actualFee.trim(),
      content: contentVal,
      origin: window.location.origin
    };
    
    // 만약 GOOGLE_SHEET_API_URL이 설정되어 있지 않다면 (로컬 모드 시뮬레이션 HMR)
    if (!GOOGLE_SHEET_API_URL) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newReview: Review = {
        author: authorVal,
        isSuccess: form.isSuccess,
        actualFee: form.actualFee.trim() || undefined,
        content: contentVal,
        date: dayjs().format('YYYY-MM-DD')
      };
      
      const targetHospital = rawHospitals.value.find(h => h.id === hospitalId);
      if (targetHospital) {
        if (!targetHospital.reviews) {
          targetHospital.reviews = [];
        }
        targetHospital.reviews.unshift(newReview);
      }
      
      form.successMessage = '🎉 [로컬 데이터] 후기가 등록되었습니다!';
      setTimeout(() => {
        toggleReviewForm(hospitalId);
      }, 1500);
      return;
    }
    
    // 실시간 POST API 전송
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`전송에 실패했습니다 (HTTP ${response.status})`);
    }
    
    const resData = await response.json();
    if (resData.status === 'success') {
      const inserted = resData.insertedData;
      const newReview: Review = {
        author: inserted.author,
        isSuccess: inserted.isSuccess,
        actualFee: inserted.actualFee || undefined,
        content: inserted.content,
        date: inserted.date
      };
      
      const targetHospital = rawHospitals.value.find(h => h.id === hospitalId);
      if (targetHospital) {
        if (!targetHospital.reviews) {
          targetHospital.reviews = [];
        }
        targetHospital.reviews.unshift(newReview);
      }
      
      form.successMessage = '🎉 후기가 스프레드시트에 실시간 등록되었습니다!';
      setTimeout(() => {
        toggleReviewForm(hospitalId);
      }, 1500);
    } else {
      throw new Error(resData.message || '알 수 없는 API 오류가 발생했습니다.');
    }
    
  } catch (err: any) {
    console.error('후기 등록 에러:', err);
    form.errorMessage = `⚠️ 전송 실패: ${err.message || '네트워크 연결을 확인하세요.'}`;
  } finally {
    form.isSubmitting = false;
  }
};

// 🏥 신규 발급 가능 병원 제보 API 전송 함수 (방안 B)
const submitHospitalSuggestion = async () => {
  const nameVal = suggestForm.value.name.trim();
  const addressVal = suggestForm.value.address.trim();
  
  if (!nameVal) {
    suggestForm.value.errorMessage = '⚠️ 병원 이름을 입력해 주세요.';
    return;
  }
  if (!addressVal) {
    suggestForm.value.errorMessage = '⚠️ 병원 주소를 입력해 주세요.';
    return;
  }
  
  suggestForm.value.errorMessage = '';
  suggestForm.value.successMessage = '';
  suggestForm.value.isSubmitting = true;
  
  try {
    const payload = {
      action: 'suggestHospital', // 백엔드 분기 액션 키
      name: nameVal,
      address: addressVal,
      tel: suggestForm.value.tel.trim(),
      fee: suggestForm.value.fee.trim(),
      tags: suggestForm.value.tags.trim(),
      tips: suggestForm.value.tips.trim(),
      origin: window.location.origin
    };
    
    // 만약 GOOGLE_SHEET_API_URL이 비어 있다면 (로컬 캐시/HMR 테스트 시뮬레이션)
    if (!GOOGLE_SHEET_API_URL) {
      await new Promise(resolve => setTimeout(resolve, 800));
      suggestForm.value.successMessage = '🎉 [로컬 테스트] 성공적으로 병원이 제보되었습니다! 관리자 검토 대기 상태로 등록됩니다.';
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
      return;
    }
    
    // 실시간 POST 전송
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`전송 실패 (HTTP ${response.status})`);
    }
    
    const resData = await response.json();
    if (resData.status === 'success') {
      suggestForm.value.successMessage = '🎉 제보가 안전하게 완료되었습니다! 관리자 검수(active 전환) 후 리스트에 정식 노출됩니다.';
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
    } else {
      throw new Error(resData.message || '알 수 없는 서버 오류가 발생했습니다.');
    }
  } catch (err: any) {
    console.error('병원 제보 등록 중 오류 발생:', err);
    suggestForm.value.errorMessage = `⚠️ 전송 실패: ${err.message || '네트워크 상태를 확인해 주세요.'}`;
  } finally {
    suggestForm.value.isSubmitting = false;
  }
};

</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_medical.scss';
</style>
