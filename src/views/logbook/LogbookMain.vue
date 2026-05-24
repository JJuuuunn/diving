<template>
  <div class="logbook-container">
    <!-- 메인 네비게이션 헤더 -->
    <Header title="다이빙 로그북" subtitle="Diving Log Book 🤿" />

    <main class="main-content">
      <!-- 작성 폼 토글 아코디언 버튼 -->
      <button class="form-toggle-btn" @click="isFormOpen = !isFormOpen">
        <span>
          <i class="fa-solid fa-pen-nib"></i> 
          {{ isFormOpen ? '작성 폼 닫기' : '새로운 다이빙 로그 기록하기' }}
        </span>
        <i class="fa-solid fa-chevron-down toggle-icon" :class="{ 'is-active': isFormOpen }"></i>
      </button>

      <!-- 로그 작성 폼 (트랜지션) -->
      <transition name="fade">
        <div v-if="isFormOpen" class="log-form-card">
          <!-- 스쿠버 / 프리다이빙 선택 세그먼트 탭 -->
          <div class="diving-type-tabs">
            <button 
              class="tab-btn" 
              :class="{ 'is-active': form.type === 'scuba' }" 
              @click="form.type = 'scuba'"
            >
              <i class="fa-solid fa-water"></i> 스쿠버 다이빙
            </button>
            <button 
              class="tab-btn" 
              :class="{ 'is-active': form.type === 'freediving' }" 
              @click="form.type = 'freediving'"
            >
              <i class="fa-solid fa-fish"></i> 프리다이빙
            </button>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="location">📍 다이빙 포인트 / 장소</label>
              <input 
                id="location" 
                v-model="form.location" 
                type="text" 
                placeholder="예: 가평 K26 / 제주도 문섬" 
              />
            </div>
            <div class="form-group">
              <label for="date">📅 다이빙 일시</label>
              <CustomDatePicker 
                v-model="form.date" 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="maxDepth">🌊 최대 수심 (m)</label>
              <CustomNumberInput 
                id="maxDepth" 
                v-model="form.maxDepth" 
                :min="0" 
                :step="0.1" 
                placeholder="0.0"
              />
            </div>
            <div class="form-group">
              <label for="temp">🌡️ 수온 (℃)</label>
              <CustomNumberInput 
                id="temp" 
                v-model="form.temp" 
                :min="-10" 
                :max="50" 
                :step="1" 
                placeholder="0"
              />
            </div>
          </div>

          <!-- 스쿠버다이빙 전용 필드 -->
          <div v-if="form.type === 'scuba'" class="form-row">
            <div class="form-group">
              <label for="diveTime">⏱️ 다이빙 시간 (분)</label>
              <CustomNumberInput 
                id="diveTime" 
                v-model="form.diveTime" 
                :min="0" 
                :step="1" 
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label for="buddyName">👤 버디 이름</label>
              <input 
                id="buddyName" 
                v-model="form.buddyName" 
                type="text" 
                placeholder="함께한 다이버 이름"
              />
            </div>
          </div>

          <div v-if="form.type === 'scuba'" class="form-row">
            <div class="form-group">
              <label for="entryPsi">🏁 입수 기압 (bar)</label>
              <CustomNumberInput 
                id="entryPsi" 
                v-model="form.entryPsi" 
                :min="0" 
                :max="350" 
                :step="5" 
                placeholder="200"
              />
            </div>
            <div class="form-group">
              <label for="exitPsi">🏳️ 출수 기압 (bar)</label>
              <CustomNumberInput 
                id="exitPsi" 
                v-model="form.exitPsi" 
                :min="0" 
                :max="350" 
                :step="5" 
                placeholder="50"
              />
            </div>
          </div>

          <!-- 프리다이빙 전용 필드 -->
          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="apneaTime">⏱️ 최대 무호흡 시간 (분:초)</label>
              <input 
                id="apneaTime" 
                v-model="form.apneaTime" 
                type="text" 
                placeholder="예: 01:45"
              />
            </div>
            <div class="form-group">
              <label for="discipline">🏆 시도 종목</label>
              <CustomSelect 
                id="discipline" 
                v-model="form.discipline" 
                :options="disciplineOptions" 
              />
            </div>
          </div>

          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="weight">⚖️ 착용 웨이트 (kg)</label>
              <CustomNumberInput 
                id="weight" 
                v-model="form.weight" 
                :min="0" 
                :max="50" 
                :step="0.5" 
                placeholder="0"
              />
            </div>
            <div class="form-group">
              <label for="eqType">👂 이퀄라이징 기법</label>
              <CustomSelect 
                id="eqType" 
                v-model="form.eqType" 
                :options="eqTypeOptions" 
              />
            </div>
          </div>

          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="buddyNameFree">👤 세이프티 버디</label>
              <input 
                id="buddyNameFree" 
                v-model="form.buddyName" 
                type="text" 
                placeholder="함께한 세이프티 이름"
              />
            </div>
            <div class="form-group">
              <label for="diveCount">⏱️ 세션 총 다이빙 횟수</label>
              <CustomNumberInput 
                id="diveCount" 
                v-model="form.diveTime" 
                :min="0" 
                :step="1" 
                placeholder="예: 8"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="notes">📝 다이빙 메모</label>
              <CustomTextarea 
                id="notes" 
                v-model="form.notes" 
                :max-length="300"
                placeholder="오늘의 다이빙은 어떠셨나요? 본 수중 생물이나 특별했던 감상을 적어주세요. (최대 300자)"
              />
            </div>
          </div>

          <!-- 버디 서명 영역 -->
          <div class="signature-trigger-wrapper">
            <label>✍️ 버디(세이프티) 서명 인증</label>
            <div class="signature-preview-area" @click="showSignatureModal = true">
              <img 
                v-if="form.buddySignature" 
                :src="form.buddySignature" 
                alt="Buddy Signature Preview" 
              />
              <div v-else class="placeholder-text">
                <i class="fa-solid fa-signature"></i>
                <span>터치하여 버디의 서명을 받아주세요</span>
              </div>
            </div>
          </div>

          <!-- 등록 버튼 -->
          <div class="form-actions">
            <button class="submit-btn" @click="saveDiveLog">
              <i class="fa-solid fa-cloud-arrow-up"></i> 로그북 저장하기
            </button>
          </div>
        </div>
      </transition>

      <!-- 로그 리스트 섹션 -->
      <section class="logs-section">
        <h3 class="section-title">
          🤿 나의 다이빙 기록 로그북 
          <span>{{ logbookStore.logs.length }}개의 로그</span>
        </h3>

        <div v-if="logbookStore.logs.length === 0" class="no-logs">
          <i class="fa-solid fa-umbrella-beach"></i>
          <p>아직 등록된 로그북이 없습니다.<br>오늘의 다이빙 기록을 가장 먼저 남겨보세요!</p>
        </div>

        <!-- 리스트 카드 렌더링 -->
        <LogCard 
          v-for="log in logbookStore.logs" 
          :key="log.id" 
          :log="log"
          @delete="deleteLog"
        />
      </section>

      <!-- 푸터 -->
      <Footer />
    </main>

    <!-- 캔버스 서명 드로잉 오버레이 모달 -->
    <CanvasSignature 
      v-if="showSignatureModal" 
      @close="showSignatureModal = false"
      @save="onSignatureSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useLogbookStore } from '@/stores/logbook';
import { useToast } from '@/composables/useToast';
import type { DiveLog, ScubaDiveLog, FreedivingDiveLog } from '@/types/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import LogCard from './LogCard.vue';
import CanvasSignature from './CanvasSignature.vue';

const disciplineOptions = [
  { value: 'CWT', label: 'CWT (Constant Weight)' },
  { value: 'FIM', label: 'FIM (Free Immersion)' },
  { value: 'CNF', label: 'CNF (Constant No Fins)' },
  { value: 'STA', label: 'STA (Static Apnea)' },
  { value: 'DYN', label: 'DYN (Dynamic Apnea)' }
];

const eqTypeOptions = [
  { value: 'Frenzel', label: 'Frenzel (프렌젤)' },
  { value: 'Valsalva', label: 'Valsalva (발살바)' },
  { value: 'Mouthfill', label: 'Mouthfill (마우스필)' }
];

const logbookStore = useLogbookStore();
const { triggerToast } = useToast();

const isFormOpen = ref(false);
const showSignatureModal = ref(false);

// 오늘 날짜 기본값 취득 (yyyy-mm-dd 포맷)
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const form = reactive({
  type: 'scuba' as 'scuba' | 'freediving', // 기본값 스쿠버
  location: '',
  date: getTodayDate(),
  maxDepth: 0,
  diveTime: 0, // 스쿠버: 분, 프리다이빙: 다이빙 횟수로 매핑 호환
  temp: 20,
  buddyName: '',
  buddySignature: '',
  notes: '',
  
  // 스쿠버다이빙 전용
  entryPsi: 200,
  exitPsi: 50,

  // 프리다이빙 전용
  apneaTime: '',
  discipline: 'CWT',
  weight: 0,
  eqType: 'Frenzel'
});

const onSignatureSave = (signatureData: string) => {
  form.buddySignature = signatureData;
  showSignatureModal.value = false;
  triggerToast('버디 서명이 완료되었습니다! ✍️');
};

const deleteLog = (id: string) => {
  if (confirm('정말로 이 다이빙 로그를 삭제하시겠습니까?')) {
    logbookStore.deleteLog(id);
    triggerToast('로그북이 성공적으로 삭제되었습니다.');
  }
};

const saveDiveLog = () => {
  // 공통 필수 입력값 검증
  if (!form.location.trim()) {
    return triggerToast('다이빙 장소(포인트)를 입력해주세요.', true);
  }
  if (!form.date) {
    return triggerToast('다이빙 일시를 입력해주세요.', true);
  }
  if (form.maxDepth <= 0) {
    return triggerToast('올바른 최대 수심(m)을 입력해주세요.', true);
  }

  // 타입별 입력값 검증
  if (form.type === 'scuba') {
    if (form.diveTime <= 0) {
      return triggerToast('올바른 다이빙 시간(분)을 입력해주세요.', true);
    }
    if (form.entryPsi < form.exitPsi) {
      return triggerToast('입수 기압은 출수 기압보다 커야 합니다.', true);
    }
  } else {
    if (!form.apneaTime.trim()) {
      return triggerToast('최대 무호흡 시간(분:초)을 입력해주세요. (예: 01:45)', true);
    }
    if (form.diveTime <= 0) {
      return triggerToast('올바른 세션 총 다이빙 횟수를 입력해주세요.', true);
    }
  }

  // 스토어 전송용 데이터 포맷 가공
  let logData: Omit<DiveLog, 'id'>;

  const baseData = {
    location: form.location,
    date: form.date,
    maxDepth: form.maxDepth,
    diveTime: form.diveTime,
    temp: form.temp,
    buddyName: form.buddyName,
    buddySignature: form.buddySignature,
    notes: form.notes
  };

  if (form.type === 'scuba') {
    logData = {
      type: 'scuba',
      ...baseData,
      entryPsi: form.entryPsi,
      exitPsi: form.exitPsi
    } as Omit<ScubaDiveLog, 'id'>;
  } else {
    logData = {
      type: 'freediving',
      ...baseData,
      apneaTime: form.apneaTime,
      discipline: form.discipline,
      weight: form.weight,
      eqType: form.eqType
    } as Omit<FreedivingDiveLog, 'id'>;
  }

  // 로그 저장 진행
  logbookStore.addLog(logData);

  // 폼 초기화 및 닫기
  form.location = '';
  form.date = getTodayDate();
  form.maxDepth = 0;
  form.diveTime = 0;
  form.temp = 20;
  form.buddyName = '';
  form.buddySignature = '';
  form.notes = '';
  
  // 스쿠버값 초기화
  form.entryPsi = 200;
  form.exitPsi = 50;

  // 프리다이빙값 초기화
  form.apneaTime = '';
  form.discipline = 'CWT';
  form.weight = 0;
  form.eqType = 'Frenzel';

  isFormOpen.value = false;
  triggerToast('새로운 다이빙 로그가 저장되었습니다! 🌊🐬');
};
</script>

<style lang="scss">
@import '@/assets/scss/pages/_logbook.scss';
</style>
