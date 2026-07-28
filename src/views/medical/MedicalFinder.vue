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

        <!-- 🔄 실시간 동기화 캐시 새로고침 버튼 -->
        <button 
          class="sync-btn" 
          :class="{ loading: isLoadingData }"
          :disabled="isLoadingData" 
          @click="forceRefreshHospitals"
          title="구글 스프레드시트에서 최신 정보 실시간 동기화"
        >
          <span class="sync-icon">🔄</span>
          <span>{{ isLoadingData ? '동기화 중...' : isCachedData ? `동기화 완료 (${lastSyncTimeStr})` : '실시간 동기화' }}</span>
        </button>
      </div>

      <!-- 실시간 API 폴백 활성화 시 경고 배지 -->
      <div v-if="isFallbackMode" class="fade-in-up delay fallback-badge-container" style="margin-top: 0.5rem; display: flex; justify-content: center;">
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
        <button 
          class="download-center-btn" 
          @click="showFormsModal = true"
          title="공식 스쿠버/프리다이빙 메디컬 질문지 다운로드 센터 열기"
        >
          <span>📄 서식 다운로드 센터 열기</span>
          <span class="arrow-icon">➔</span>
        </button>
      </div>
    </div>

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

      <!-- 데이터 내보내기 그룹 (CSV) -->
      <div class="export-control-group">
        <button 
          class="export-btn csv" 
          :disabled="isLoadingData || sortedHospitals.length === 0" 
          @click="exportHospitalsToCSV"
          title="현재 조건으로 검색된 병원 목록을 CSV 파일로 다운로드합니다."
        >
          <span class="btn-icon">📊</span>
          <span>목록 CSV 다운로드</span>
        </button>
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
        <button 
          class="tab-btn" 
          :class="{ active: mobileActiveTab === 'list' }"
          @click="mobileActiveTab = 'list'"
        >
          📋 리스트 보기
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: mobileActiveTab === 'map' }"
          @click="mobileActiveTab = 'map'"
        >
          🗺️ 지도 보기
        </button>
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
      <div 
        v-for="(hospital, index) in sortedHospitals" 
        :key="hospital.id"
        :id="'hospital-card-' + hospital.id"
        class="hospital-card fade-in-up"
        :style="{ animationDelay: `${index * 0.05}s` }"
        @click="onCardClick(hospital)"
        title="지도에서 이 병원 위치 보기"
      >
        <div class="card-top">
          <div 
            class="title-area" 
          >
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
              @click.stop="copyAddress(hospital.address)"
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
          <button class="review-toggle-btn" @click.stop="toggleReviews(hospital.id)">
            💬 다이버 방문 후기 & 히스토리 ({{ hospital.reviews ? hospital.reviews.length : 0 }}개)
            <span class="toggle-arrow" :class="{ open: openedReviews[hospital.id] }">▼</span>
          </button>
          
          <div 
            class="review-list-wrapper"
            :style="{ maxHeight: openedReviews[hospital.id] ? '2000px' : '0px' }"
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
                      <CustomSwitch 
                        v-model="getReviewForm(hospital.id).isSuccess" 
                        active-text="성공" 
                        inactive-text="실패"
                        active-icon="fa-circle-check"
                        inactive-icon="fa-circle-xmark"
                        :disabled="getReviewForm(hospital.id).isSubmitting"
                      />
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
              <li>
                대회 혹은 협회 공식 메디컬 질문 서식 인쇄본 (1부)
                <div class="modal-download-links">
                  <a 
                    :href="`${baseUrl}forms/Diver-Medical-Participant-Questionnaire.pdf`" 
                    download="Diver-Medical-Participant-Questionnaire.pdf"
                    class="modal-dl-btn scuba"
                    title="스쿠버 메디컬 서식 다운로드 (로컬 파일)"
                  >
                    🤿 스쿠버 (WRSTC 양식) 📥
                  </a>
                  <a 
                    :href="`${baseUrl}forms/AIDA_Medical_Form.pdf`" 
                    download="AIDA_Medical_Form.pdf"
                    class="modal-dl-btn freediving"
                    title="프리다이빙 메디컬 서식 다운로드 (로컬 파일)"
                  >
                    🐬 프리다이빙 (AIDA 양식) 📥
                  </a>
                </div>
                <!-- 🌐 실시간 공식 홈페이지 백업 원본 보기 -->
                <div class="modal-online-links" style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem; font-size: 0.75rem;">
                  <a href="https://www.uhms.org/images/Diver-Medical-Participant-Questionnaire.pdf" target="_blank" rel="noopener noreferrer" style="color: #94a3b8; text-decoration: underline;">UHMS 공식 사이트 🌐</a>
                  <span style="color: #4b5563;">|</span>
                  <a href="https://drive.google.com/drive/folders/1DzpHdxEqGUHwxU7E7cHgVkfvKgRa1wQx" target="_blank" rel="noopener noreferrer" style="color: #94a3b8; text-decoration: underline;">AIDA 구글 드라이브 📂</a>
                </div>
              </li>
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

    <!-- 📄 공식 메디컬 서식 다운로드 센터 팝업 모달 (2-Depth) -->
    <div v-if="showFormsModal" class="forms-modal-overlay" @click.self="showFormsModal = false">
      <div class="forms-modal-content scale-in">
        <div class="modal-header">
          <h2>📄 공식 메디컬 서식 다운로드</h2>
          <button class="close-modal-btn" @click="showFormsModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-intro">
            병원 방문 전에 해당하는 종목의 질문지를 미리 다운로드하여 인쇄한 뒤,<br/>
            <strong>수동으로 자가 질문을 체크한 상태로</strong> 병원을 지참해 주셔야 원활한 소견서 발급이 가능합니다.
          </p>

          <div class="forms-download-list">
            <!-- 스쿠버다이빙 카드 -->
            <div class="form-download-card scuba">
              <div class="card-left">
                <span class="category-badge scuba">SCUBA</span>
                <div class="form-info">
                  <h4>🤿 스쿠버다이빙 (WRSTC 공식 양식)</h4>
                  <p class="desc">전 세계 레저 스쿠버 단체(PADI, SSI, NAUI 등)의 표준 잠수적합성 자가 질의서 양식입니다.</p>
                  <span class="file-meta">파일 형식: PDF (한글/영문 병행)</span>
                </div>
              </div>
              <div class="card-right">
                <a 
                  :href="`${baseUrl}forms/Diver-Medical-Participant-Questionnaire.pdf`" 
                  download="Diver-Medical-Participant-Questionnaire.pdf"
                  class="download-btn-primary scuba"
                  title="스쿠버 메디컬 서식 다운로드 (초고속 로컬)"
                >
                  <span>다운로드</span>
                  <span class="dl-icon">📥</span>
                </a>
                <a 
                  href="https://www.uhms.org/images/Diver-Medical-Participant-Questionnaire.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="download-btn-secondary"
                  title="UHMS 공식 사이트에서 원본 열기"
                >
                  <span>공식 원본 🌐</span>
                </a>
              </div>
            </div>

            <!-- 프리다이빙 카드 -->
            <div class="form-download-card freediving">
              <div class="card-left">
                <span class="category-badge freediving">FREEDIVING</span>
                <div class="form-info">
                  <h4>🐬 프리다이빙 (AIDA 공식 양식)</h4>
                  <p class="desc">AIDA 국제 프리다이빙 대회 및 교육 이수를 위해 필요한 표준 의사 소견서 질문지 양식입니다.</p>
                  <span class="file-meta">파일 형식: PDF (영문 공식 양식)</span>
                </div>
              </div>
              <div class="card-right">
                <a 
                  :href="`${baseUrl}forms/AIDA_Medical_Form.pdf`" 
                  download="AIDA_Medical_Form.pdf"
                  class="download-btn-primary freediving"
                  title="프리다이빙 메디컬 서식 다운로드 (초고속 로컬)"
                >
                  <span>다운로드</span>
                  <span class="dl-icon">📥</span>
                </a>
                <a 
                  href="https://drive.google.com/drive/folders/1DzpHdxEqGUHwxU7E7cHgVkfvKgRa1wQx" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="download-btn-secondary"
                  title="AIDA 구글 드라이브(한글 서식 등) 열기"
                >
                  <span>구글 드라이브 📂</span>
                </a>
              </div>
            </div>
          </div>

          <!-- 유용한 정보 박스 -->
          <div class="forms-modal-tips">
            <h5>💡 다이버를 위한 꿀팁!</h5>
            <ul>
              <li>일반 병원에서는 다이빙 전용 서식을 보유하고 있지 않으므로, <strong>반드시 인쇄하여 지참</strong>하셔야 합니다.</li>
              <li>스쿠버/프리다이빙 서식 모두 의사 확인란(Physician Guidelines)이 포함되어 있습니다.</li>
              <li>진료 시 의사 선생님께 "기본 신체 검사에 이비인후과 압력 평형 검진을 더하는 형태"라고 정중히 설명드리면 발급이 수월합니다.</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="confirm-btn" @click="showFormsModal = false">확인했습니다</button>
        </div>
      </div>
    </div>

    <!-- 전역 푸터 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import hospitalsData from '@/data/hospitals.json';
import { useGeolocation } from '@/composables/useGeolocation';
import { useToast } from '@/composables/useToast';
import { useKakaoMap } from '@/composables/useKakaoMap';
import type { Hospital, Review } from '@/types/medical';
import { formatDate } from '@/utils/formatter';
import dayjs from 'dayjs';
import CustomSwitch from '@/components/CustomSwitch.vue';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import Footer from '@/components/Footer.vue';

interface ExtendedHospital extends Hospital {
  distance?: number;
}


// ⚠️ 구글 Apps Script 배포 후 발급받은 Web App URL 주소는 .env.local 파일에 설정되어 관리됩니다.
const MEDICAL_GOOGLE_APPS_SCRIPT_API_URL =
  (import.meta.env.VITE_MEDICAL_GOOGLE_APPS_SCRIPT_API_URL as string) || "";
 

const searchQuery = ref('');
const selectedStatuses = ref<string[]>(['active', 'paused']);
const showGuideModal = ref(false);
const showFormsModal = ref(false);
const baseUrl = import.meta.env.BASE_URL;

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
const { triggerToast } = useToast();
const rawHospitals = ref<Hospital[]>([]);
const isLoadingData = ref(false);
const isFallbackMode = ref(false);

const CACHE_KEY = 'medical_hospitals_cache';
const CACHE_TIME_KEY = 'medical_hospitals_cache_time';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간(1일) (ms 단위)

const isCachedData = ref(false);
const lastSyncTimeStr = ref('');

// 모바일 전용 액티브 뷰 탭 상태 ('list' 또는 'map')
const mobileActiveTab = ref<'list' | 'map'>('list');

// 개별 병원 카드 아코디언 상태 관리 (key: hospitalId, value: isOpen)
const openedReviews = ref<Record<string, boolean>>({});

const toggleReviews = (hospitalId: string) => {
  openedReviews.value[hospitalId] = !openedReviews.value[hospitalId];
};

// 🗺️ 카카오 지도 API 설정 및 훅 연동
const KAKAO_MAP_API_KEY = (import.meta.env.VITE_KAKAO_MAP_API_KEY as string) || "";
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



// 🏢 구글 스프레드시트 혹은 로컬 스토리지 데이터의 lat/lng 좌표가 string인 경우 strict float(Number)로 확실하게 캐스팅 보정
const sanitizeHospitalsCoordinates = (list: Hospital[]): Hospital[] => {
  return list.map(h => ({
    ...h,
    lat: Number(h.lat),
    lng: Number(h.lng)
  }));
};

onMounted(async () => {
  await loadHospitalsData();

  // 💡 Vue 렌더링 엔진이 스켈레톤 상태를 끄고 지도 컨테이너 DOM을 완벽히 구축할 때까지 대기
  await nextTick();

  // 지도 인스턴스 초기화 수행
  if (KAKAO_MAP_API_KEY) {
    const success = await initMapSdk(KAKAO_MAP_API_KEY);
    if (success) {
      // 최초 지도 타겟: 리스트 첫 병원 위치, 없을 시 서울 시청 부근
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
    // API 키 누락 시 은은하고 명확한 예외 피드백 노출
    mapError.value = 'VITE_KAKAO_MAP_API_KEY가 비어있어 지도가 비활성화되었습니다. (.env.local 파일을 구성하여 로드할 수 있습니다.)';
  }
});

// 비동기 구글 시트 REST API 로드 및 예외 발생 시 로컬 캐시 폴백 처리
const loadHospitalsData = async (force = false) => {
  if (!MEDICAL_GOOGLE_APPS_SCRIPT_API_URL) {
    // API 주소가 제공되지 않았을 때는 은은하게 즉시 로컬 JSON 로드 (폴백 경고 배지는 미표시)
    rawHospitals.value = sanitizeHospitalsCoordinates(hospitalsData as Hospital[]);
    isFallbackMode.value = false;
    isCachedData.value = false;
    return;
  }

  // 1. 강제 갱신이 아니고 캐시가 유효한 경우 로컬스토리지에서 즉각 로드
  if (!force) {
    const cachedDataStr = localStorage.getItem(CACHE_KEY);
    const cachedTimeStr = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedDataStr && cachedTimeStr) {
      const cachedTime = parseInt(cachedTimeStr, 10);
      const now = Date.now();
      
      if (now - cachedTime < CACHE_TTL) {
        try {
          const parsed = JSON.parse(cachedDataStr);
          if (Array.isArray(parsed)) {
            rawHospitals.value = sanitizeHospitalsCoordinates(parsed as Hospital[]);
            isFallbackMode.value = false;
            isCachedData.value = true;
            updateLastSyncTimeText(cachedTime);
            return;
          }
        } catch (e) {
          console.warn('캐시 데이터 파싱 실패. API 호출을 재시도합니다.', e);
        }
      }
    }
  }

  isLoadingData.value = true;
  isFallbackMode.value = false;
  isCachedData.value = false;

  try {
    const url = `${MEDICAL_GOOGLE_APPS_SCRIPT_API_URL}?origin=${encodeURIComponent(window.location.origin)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      rawHospitals.value = sanitizeHospitalsCoordinates(data as Hospital[]);
      // 2. 캐시 스토리지 갱신
      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      const now = Date.now();
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      updateLastSyncTimeText(now);
    } else {
      throw new Error('API 리턴 포맷이 배열 형식이 아닙니다.');
    }
  } catch (err) {
    console.warn('구글 스프레드시트 API 로드 실패. 기존 로컬 백업 파일로 복원(폴백)합니다.', err);
    // 통신 장애, CORS 차단 등의 경우 로컬 데이터로 안전 복구
    rawHospitals.value = sanitizeHospitalsCoordinates(hospitalsData as Hospital[]);
    isFallbackMode.value = true; 
  } finally {
    isLoadingData.value = false;
  }
};

const updateLastSyncTimeText = (timestamp: number) => {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes <= 0) {
    lastSyncTimeStr.value = '방금 전';
  } else if (diffMinutes < 60) {
    lastSyncTimeStr.value = `${diffMinutes}분 전`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    lastSyncTimeStr.value = `${hours}시간 전`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    lastSyncTimeStr.value = `${days}일 전`;
  }
};

const forceRefreshHospitals = async () => {
  if (isLoadingData.value) return;
  await loadHospitalsData(true);
};

// 클립보드 주소 복사
const copyAddress = (address: string) => {
  navigator.clipboard.writeText(address).then(() => {
    triggerToast('주소가 클립보드에 복사되었습니다. 📋');
  }).catch(() => {
    triggerToast('주소를 복사하는 중 오류가 발생했습니다.', true);
  });
};

// 텍스트 필터링된 병원 리스트
const filteredHospitals = computed<ExtendedHospital[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  
  // 선택된 상태 목록에 부합하는 병원만 필터링
  let list = rawHospitals.value.filter(h => h.status && selectedStatuses.value.includes(h.status));
  
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

// 리액티브 필터링/검색된 리스트 변화 감지 시 지도 마커 자동 리드로잉
watch(filteredHospitals, (newList) => {
  if (isMapLoaded.value) {
    updateMarkers(newList, (hospital) => {
      scrollToHospitalCard(hospital.id);
    });
  }
}, { deep: true });

// 내 현재 위치 마커 실시간 업데이트 동기화 (GPS 정렬 활성화 시 내 위치 블루핀 표시)
watch([isGpsSorted, () => geoHelper.coords.value], ([sorted, coords]) => {
  if (isMapLoaded.value) {
    if (sorted && coords) {
      updateUserLocationMarker(coords.latitude, coords.longitude);
    } else {
      updateUserLocationMarker(null, null);
    }
  }
}, { immediate: true });

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
    
    // 메디컬 Apps Script API가 설정되어 있지 않다면 (로컬 모드 시뮬레이션 HMR)
    if (!MEDICAL_GOOGLE_APPS_SCRIPT_API_URL) {
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
    const response = await fetch(MEDICAL_GOOGLE_APPS_SCRIPT_API_URL, {
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
      
      // 캐시 스토리지 갱신
      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      
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
    
    // 메디컬 Apps Script API가 비어 있다면 (로컬 캐시/HMR 테스트 시뮬레이션)
    if (!MEDICAL_GOOGLE_APPS_SCRIPT_API_URL) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dummyId = 'h_dummy_' + Date.now();
      const kstDateStr = dayjs().format('YYYY-MM-DD');
      const newHospital: Hospital = {
        id: dummyId,
        name: nameVal,
        address: addressVal,
        tel: suggestForm.value.tel.trim() || '정보 없음',
        fee: suggestForm.value.fee.trim() || '변동성 (로컬 제보 테스트)',
        lat: 37.5665,
        lng: 126.9780,
        status: 'pending',
        lastUpdated: kstDateStr,
        tags: suggestForm.value.tags.trim() 
          ? suggestForm.value.tags.split(',').map(t => t.trim()) 
          : ['로컬테스트'],
        tips: suggestForm.value.tips.trim() || '로컬 환경에서 제보 시뮬레이션된 병원입니다.',
        reviews: []
      };
      
      rawHospitals.value.unshift(newHospital);
      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      const now = Date.now();
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      updateLastSyncTimeText(now);
      isCachedData.value = true;
      
      if (!selectedStatuses.value.includes('pending')) {
        selectedStatuses.value.push('pending');
      }
      
      suggestForm.value.successMessage = '🎉 [로컬 테스트] 성공적으로 병원이 제보되었습니다! 즉시 캐시 및 목록에 등록되어 바로 확인하실 수 있습니다.';
      setTimeout(() => {
        closeSuggestModal();
      }, 1500);
      return;
    }
    
    // 실시간 POST 전송
    const response = await fetch(MEDICAL_GOOGLE_APPS_SCRIPT_API_URL, {
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
      const inserted = resData.insertedData;
      
      // 1. 제보 완료된 병원 객체를 Hospital 규격에 맞추어 실시간 조립
      const newHospital: Hospital = {
        id: inserted.id,
        name: nameVal,
        address: addressVal,
        tel: suggestForm.value.tel.trim() || '정보 없음',
        fee: suggestForm.value.fee.trim() || '변동성 (제보 검수 대기)',
        lat: 0,
        lng: 0,
        status: 'pending',
        lastUpdated: inserted.date,
        tags: suggestForm.value.tags.trim() 
          ? suggestForm.value.tags.split(',').map(t => t.trim()) 
          : ['다이버제보'],
        tips: suggestForm.value.tips.trim() || '사용자가 제안한 신규 발급 가능 병원입니다.',
        reviews: []
      };
      
      // 2. 프론트엔드 리스트 맨 앞에 제보 병원 즉시 삽입
      rawHospitals.value.unshift(newHospital);
      
      // 3. 로컬 캐시와 타임스탬프 실시간 갱신 저장
      localStorage.setItem(CACHE_KEY, JSON.stringify(rawHospitals.value));
      const now = Date.now();
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      updateLastSyncTimeText(now);
      isCachedData.value = true;
      
      // 4. 제보 완료 후 병원을 즉시 볼 수 있게 'pending(검수 대기)' 필터 칩 자동 활성화
      if (!selectedStatuses.value.includes('pending')) {
        selectedStatuses.value.push('pending');
      }
      
      suggestForm.value.successMessage = '🎉 제보가 안전하게 완료되었습니다! 즉석에서 캐시 및 목록에 등록되어 바로 확인하실 수 있습니다.';
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

// ==========================================
// 📥 병원 목록 CSV 내보내기 구현
// ==========================================

const exportHospitalsToCSV = () => {
  if (sortedHospitals.value.length === 0) {
    triggerToast('내보낼 병원 데이터가 없습니다.', true);
    return;
  }

  // 1. CSV 헤더 정의
  const headers = ['병원명', '주소', '연락처', '발급 비용', '발급 상태', '추천 태그', '다이버 유용한 팁', '최근 확인일'];
  
  // 2. CSV 로우 생성
  const rows = sortedHospitals.value.map(h => {
    const statusMap: Record<string, string> = {
      active: '정상 발급 중',
      paused: '임시 중단',
      pending: '검수 대기',
      inactive: '발급 불가'
    };
    return [
      h.name,
      h.address,
      h.tel,
      h.fee,
      h.status ? (statusMap[h.status] ?? h.status) : '미지정',
      h.tags.join(', '),
      h.tips.replace(/"/g, '""'), // 따옴표 이스케이프
      formatDate(h.lastUpdated)
    ];
  });

  // 3. UTF-8 BOM 주입하여 한글 깨짐 방지
  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');

  // 4. Blob을 사용하여 즉각 다운로드 링크 생성
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const dateStr = dayjs().format('YYYYMMDD');
  link.setAttribute('href', url);
  link.setAttribute('download', `diving_medical_hospitals_${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  triggerToast('병원 목록 CSV 파일이 다운로드되었습니다! 📊');
};


</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_medical.scss';
</style>
