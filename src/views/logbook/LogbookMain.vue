<template>
  <div class="logbook-container">
    <!-- 메인 네비게이션 헤더 -->
    <Header />

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
              <input 
                id="date" 
                v-model="form.date" 
                type="date" 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="maxDepth">🌊 최대 수심 (m)</label>
              <input 
                id="maxDepth" 
                v-model.number="form.maxDepth" 
                type="number" 
                placeholder="0.0"
              />
            </div>
            <div class="form-group">
              <label for="diveTime">⏱️ 다이빙 시간 (분)</label>
              <input 
                id="diveTime" 
                v-model.number="form.diveTime" 
                type="number" 
                placeholder="0"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="temp">🌡️ 수온 (℃)</label>
              <input 
                id="temp" 
                v-model.number="form.temp" 
                type="number" 
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

          <div class="form-row">
            <div class="form-group">
              <label for="entryPsi">🏁 입수 기압 (bar)</label>
              <input 
                id="entryPsi" 
                v-model.number="form.entryPsi" 
                type="number" 
                placeholder="200"
              />
            </div>
            <div class="form-group">
              <label for="exitPsi">🏳️ 출수 기압 (bar)</label>
              <input 
                id="exitPsi" 
                v-model.number="form.exitPsi" 
                type="number" 
                placeholder="50"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="notes">📝 다이빙 메모</label>
              <textarea 
                id="notes" 
                v-model="form.notes" 
                placeholder="오늘의 다이빙은 어떠셨나요? 본 수중 생물이나 특별했던 감상을 적어주세요."
              ></textarea>
            </div>
          </div>

          <!-- 버디 서명 영역 -->
          <div class="signature-trigger-wrapper">
            <label>✍️ 버디 서명 인증</label>
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
import Header from '../settlement/Header.vue';
import Footer from '../settlement/Footer.vue';
import LogCard from './LogCard.vue';
import CanvasSignature from './CanvasSignature.vue';

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
  location: '',
  date: getTodayDate(),
  maxDepth: 0,
  diveTime: 0,
  temp: 20,
  entryPsi: 200,
  exitPsi: 50,
  buddyName: '',
  buddySignature: '',
  notes: ''
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
  // 필수 입력값 검증
  if (!form.location.trim()) {
    return triggerToast('다이빙 장소(포인트)를 입력해주세요.', true);
  }
  if (!form.date) {
    return triggerToast('다이빙 일시를 입력해주세요.', true);
  }
  if (form.maxDepth <= 0) {
    return triggerToast('올바른 최대 수심(m)을 입력해주세요.', true);
  }
  if (form.diveTime <= 0) {
    return triggerToast('올바른 다이빙 시간(분)을 입력해주세요.', true);
  }
  if (form.entryPsi < form.exitPsi) {
    return triggerToast('입수 기압은 출수 기압보다 커야 합니다.', true);
  }

  // 로그 저장 진행
  logbookStore.addLog({
    location: form.location,
    date: form.date,
    maxDepth: form.maxDepth,
    diveTime: form.diveTime,
    temp: form.temp,
    entryPsi: form.entryPsi,
    exitPsi: form.exitPsi,
    buddyName: form.buddyName,
    buddySignature: form.buddySignature,
    notes: form.notes
  });

  // 폼 초기화 및 닫기
  form.location = '';
  form.date = getTodayDate();
  form.maxDepth = 0;
  form.diveTime = 0;
  form.temp = 20;
  form.entryPsi = 200;
  form.exitPsi = 50;
  form.buddyName = '';
  form.buddySignature = '';
  form.notes = '';

  isFormOpen.value = false;
  triggerToast('새로운 다이빙 로그가 저장되었습니다! 🌊🤿');
};
</script>

<style lang="scss">
@import '@/assets/scss/pages/_logbook.scss';
</style>
