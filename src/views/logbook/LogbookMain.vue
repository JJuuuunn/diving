<template>
  <div class="logbook-container">
    <Header title="다이빙 로그북" subtitle="Diving Log Book 🤿" />

    <main class="main-content">
      <div v-if="logbookStore.storageError" class="logbook-alert" role="alert">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <span>{{ logbookStore.storageError }}</span>
      </div>

      <CustomButton
        class="form-toggle-btn"
        :aria-expanded="isFormOpen"
        aria-controls="logbook-entry-form"
        @click="toggleForm"
      >
        <span>
          <i class="fa-solid fa-pen-nib" aria-hidden="true"></i>
          {{ formToggleLabel }}
        </span>
        <i class="fa-solid fa-chevron-down toggle-icon" :class="{ 'is-active': isFormOpen }" aria-hidden="true"></i>
      </CustomButton>

      <transition name="fade">
        <div v-if="isFormOpen" id="logbook-entry-form" class="log-form-card">
          <h2 class="form-title">{{ editingLogId ? '다이빙 로그 수정' : '새로운 다이빙 로그' }}</h2>

          <div class="diving-type-tabs" role="group" aria-label="다이빙 종류">
            <CustomButton
              class="tab-btn"
              :class="{ 'is-active': form.type === 'scuba' }"
              :aria-pressed="form.type === 'scuba'"
              @click="form.type = 'scuba'"
            >
              <i class="fa-solid fa-water" aria-hidden="true"></i> 스쿠버 다이빙
            </CustomButton>
            <CustomButton
              class="tab-btn"
              :class="{ 'is-active': form.type === 'freediving' }"
              :aria-pressed="form.type === 'freediving'"
              @click="form.type = 'freediving'"
            >
              <i class="fa-solid fa-fish" aria-hidden="true"></i> 프리다이빙
            </CustomButton>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="location">📍 다이빙 포인트 / 장소</label>
              <CustomInput id="location" v-model="form.location" type="text" :trim="true" placeholder="예: 가평 K26 / 제주도 문섬" />
            </div>
            <div class="form-group">
              <label for="logbook-date">📅 다이빙 일자</label>
              <CustomDatePicker id="logbook-date" v-model="form.date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="maxDepth">🌊 최대 수심 (m)</label>
              <CustomNumberInput id="maxDepth" v-model="form.maxDepth" :min="0" :max="350" :step="0.1" placeholder="0.0" />
            </div>
            <div class="form-group">
              <label for="temp">🌡️ 수온 (℃)</label>
              <CustomNumberInput id="temp" v-model="form.temp" :min="-10" :max="50" :step="1" placeholder="20" />
            </div>
          </div>

          <div v-if="form.type === 'scuba'" class="form-row">
            <div class="form-group">
              <label for="durationMinutes">⏱️ 다이빙 시간 (분)</label>
              <CustomNumberInput id="durationMinutes" v-model="form.durationMinutes" :min="0" :max="1440" :step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label for="buddyName">👤 버디 이름</label>
              <CustomInput id="buddyName" v-model="form.buddyName" type="text" :trim="true" placeholder="함께한 다이버 이름" />
            </div>
          </div>

          <div v-if="form.type === 'scuba'" class="form-row">
            <div class="form-group">
              <label for="entryPressureBar">🏁 입수 압력 (bar)</label>
              <CustomNumberInput id="entryPressureBar" v-model="form.entryPressureBar" :min="0" :max="350" :step="5" placeholder="200" />
            </div>
            <div class="form-group">
              <label for="exitPressureBar">🏳️ 출수 압력 (bar)</label>
              <CustomNumberInput id="exitPressureBar" v-model="form.exitPressureBar" :min="0" :max="350" :step="5" placeholder="50" />
            </div>
          </div>

          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="apneaTime">⏱️ 최대 무호흡 시간 (분:초)</label>
              <CustomInput id="apneaTime" v-model="form.apneaTime" type="text" placeholder="예: 01:45" />
            </div>
            <div class="form-group">
              <label for="discipline">🏆 시도 종목</label>
              <CustomSelect id="discipline" v-model="form.discipline" :options="disciplineOptions" />
            </div>
          </div>

          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="weightKg">⚖️ 착용 웨이트 (kg)</label>
              <CustomNumberInput id="weightKg" v-model="form.weightKg" :min="0" :max="50" :step="0.5" placeholder="0" />
            </div>
            <div class="form-group">
              <label for="equalizingMethod">👂 이퀄라이징 기법</label>
              <CustomSelect id="equalizingMethod" v-model="form.equalizingMethod" :options="equalizingMethodOptions" />
            </div>
          </div>

          <div v-if="form.type === 'freediving'" class="form-row">
            <div class="form-group">
              <label for="buddyNameFree">👤 세이프티 버디</label>
              <CustomInput id="buddyNameFree" v-model="form.buddyName" type="text" :trim="true" placeholder="함께한 세이프티 이름" />
            </div>
            <div class="form-group">
              <label for="diveCount">🔁 세션 총 다이빙 횟수</label>
              <CustomNumberInput id="diveCount" v-model="form.diveCount" :min="0" :max="1000" :step="1" placeholder="예: 8" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group full-width">
              <label for="notes">📝 다이빙 메모</label>
              <CustomTextarea id="notes" v-model="form.notes" :max-length="300" placeholder="오늘의 다이빙 경험을 기록해주세요. (최대 300자)" />
            </div>
          </div>

          <div class="signature-trigger-wrapper">
            <span class="field-label">✍️ 버디(세이프티) 서명 인증</span>
            <CustomButton class="signature-preview-area" aria-label="버디 서명 그리기" @click="showSignatureModal = true">
              <img v-if="form.buddySignature" :src="form.buddySignature" alt="현재 버디 서명" />
              <span v-else class="placeholder-text">
                <i class="fa-solid fa-signature" aria-hidden="true"></i>
                <span>서명을 받으려면 선택하세요</span>
              </span>
            </CustomButton>
          </div>

          <div class="form-actions">
            <CustomButton v-if="editingLogId" class="cancel-btn" @click="cancelEditing">수정 취소</CustomButton>
            <CustomButton class="submit-btn" @click="saveDiveLog">
              <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
              {{ editingLogId ? '수정 내용 저장하기' : '로그북 저장하기' }}
            </CustomButton>
          </div>
        </div>
      </transition>

      <section class="logbook-tools" aria-label="로그북 관리">
        <div class="tool-fields">
          <CustomInput v-model="searchQuery" type="search" aria-label="로그 검색" placeholder="장소, 버디, 메모 검색" />
          <CustomSelect v-model="typeFilter" aria-label="다이빙 종류 필터" :options="filterOptions" />
          <CustomSelect v-model="sortOrder" aria-label="로그 정렬" :options="sortOptions" />
        </div>
        <div class="backup-actions">
          <CustomButton @click="exportLogbook"><i class="fa-solid fa-download" aria-hidden="true"></i> 백업</CustomButton>
          <CustomButton @click="openImportPicker"><i class="fa-solid fa-upload" aria-hidden="true"></i> 복원</CustomButton>
          <input ref="importInputRef" class="visually-hidden-input" type="file" accept="application/json,.json" @change="importLogbook" />
        </div>
      </section>

      <LogCardDesignPicker v-model="selectedCardDesign" />

      <section class="logs-section">
        <h2 class="section-title">
          🤿 나의 다이빙 기록
          <span>{{ visibleLogs.length }}/{{ logbookStore.logs.length }}개의 로그</span>
        </h2>

        <div v-if="logbookStore.logs.length === 0" class="no-logs">
          <i class="fa-solid fa-umbrella-beach" aria-hidden="true"></i>
          <p>아직 등록된 로그가 없습니다.<br />오늘의 다이빙 기록을 남겨보세요!</p>
        </div>
        <div v-else-if="visibleLogs.length === 0" class="no-logs">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <p>검색 조건에 맞는 로그가 없습니다.</p>
        </div>

        <LogCard
          v-for="log in visibleLogs"
          :key="log.id"
          :log="log"
          :design="selectedCardDesign"
          @edit="startEditing"
          @delete="deleteLog"
        />
      </section>

      <Footer />
    </main>

    <CanvasSignature v-if="showSignatureModal" @close="showSignatureModal = false" @save="onSignatureSave" />

    <ConfirmModal
      :show="confirmModalState.show"
      :title="confirmModalState.title"
      :message="confirmModalState.message"
      :confirm-text="confirmModalState.confirmText"
      :cancel-text="confirmModalState.cancelText"
      @confirm="handleConfirmModalConfirm"
      @cancel="handleConfirmModalCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { useLogbookStore } from '@/stores/logbook';
import { useToast } from '@/composables/useToast';
import type {
  DiveLog,
  DiveLogDraft,
  EqualizingMethod,
  FreedivingDiscipline,
  LogCardDesign
} from '@/types/logbook';
import { formatApneaTime, parseApneaTime, validateDiveLogDraft } from '@/utils/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import LogCard from './LogCard.vue';
import CanvasSignature from './CanvasSignature.vue';
import LogCardDesignPicker from './LogCardDesignPicker.vue';

type TypeFilter = 'all' | 'scuba' | 'freediving';
type SortOrder = 'date-desc' | 'date-asc' | 'updated-desc';

const disciplineOptions = [
  { value: 'CWT', label: 'CWT (Constant Weight)' },
  { value: 'FIM', label: 'FIM (Free Immersion)' },
  { value: 'CNF', label: 'CNF (Constant No Fins)' },
  { value: 'STA', label: 'STA (Static Apnea)' },
  { value: 'DYN', label: 'DYN (Dynamic Apnea)' }
];
const equalizingMethodOptions = [
  { value: 'Frenzel', label: 'Frenzel (프렌젤)' },
  { value: 'Valsalva', label: 'Valsalva (발살바)' },
  { value: 'Mouthfill', label: 'Mouthfill (마우스필)' }
];
const filterOptions = [
  { value: 'all', label: '전체 종류' },
  { value: 'scuba', label: '스쿠버' },
  { value: 'freediving', label: '프리다이빙' }
];
const sortOptions = [
  { value: 'date-desc', label: '다이빙 날짜 최신순' },
  { value: 'date-asc', label: '다이빙 날짜 오래된순' },
  { value: 'updated-desc', label: '최근 수정순' }
];

const getTodayDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createEmptyForm = () => ({
  type: 'scuba' as 'scuba' | 'freediving',
  location: '',
  date: getTodayDate(),
  maxDepth: 0,
  temp: 20,
  buddyName: '',
  buddySignature: '',
  notes: '',
  durationMinutes: 0,
  entryPressureBar: 200,
  exitPressureBar: 50,
  diveCount: 0,
  apneaTime: '',
  discipline: 'CWT' as FreedivingDiscipline,
  weightKg: 0,
  equalizingMethod: 'Frenzel' as EqualizingMethod
});

const logbookStore = useLogbookStore();
const { triggerToast } = useToast();
const form = reactive(createEmptyForm());
const isFormOpen = ref(false);
const showSignatureModal = ref(false);
const editingLogId = ref<string | null>(null);
const searchQuery = ref('');
const typeFilter = ref<TypeFilter>('all');
const sortOrder = ref<SortOrder>('date-desc');
const LOGBOOK_CARD_DESIGN_KEY = 'diving:logbook:card_design:v1';
const LEGACY_LOGBOOK_CARD_DESIGN_KEY = 'diving:logbook:card-design:v1';

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const current = localStorage.getItem(LOGBOOK_CARD_DESIGN_KEY);
  const legacy = localStorage.getItem(LEGACY_LOGBOOK_CARD_DESIGN_KEY);
  if (!current && legacy !== null) {
    localStorage.setItem(LOGBOOK_CARD_DESIGN_KEY, legacy);
  }
  if (legacy !== null) {
    localStorage.removeItem(LEGACY_LOGBOOK_CARD_DESIGN_KEY);
  }
}

const selectedCardDesign = useStorage<LogCardDesign>(LOGBOOK_CARD_DESIGN_KEY, 'ocean');
const importInputRef = ref<HTMLInputElement | null>(null);

if (!(['ocean', 'expedition', 'coral', 'minimal'] as LogCardDesign[]).includes(selectedCardDesign.value)) {
  selectedCardDesign.value = 'ocean';
}

const formToggleLabel = computed(() => {
  if (editingLogId.value) return isFormOpen.value ? '수정 폼 닫기' : '수정 중인 로그 열기';
  return isFormOpen.value ? '작성 폼 닫기' : '새로운 다이빙 로그 기록하기';
});

const visibleLogs = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ko-KR');
  return logbookStore.logs
    .filter((log) => typeFilter.value === 'all' || log.type === typeFilter.value)
    .filter((log) => !query || [log.location, log.buddyName, log.notes]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query)))
    .slice()
    .sort((a, b) => {
      if (sortOrder.value === 'updated-desc') return b.updatedAt.localeCompare(a.updatedAt);
      const comparison = a.date.localeCompare(b.date);
      return sortOrder.value === 'date-asc' ? comparison : -comparison;
    });
});

const resetForm = (): void => {
  Object.assign(form, createEmptyForm());
};

const toggleForm = (): void => {
  isFormOpen.value = !isFormOpen.value;
};

const cancelEditing = (): void => {
  editingLogId.value = null;
  resetForm();
  isFormOpen.value = false;
};

const onSignatureSave = (signatureData: string): void => {
  form.buddySignature = signatureData;
  showSignatureModal.value = false;
  triggerToast('버디 서명이 완료되었습니다! ✍️');
};

const buildDraft = (): DiveLogDraft | null => {
  const common = {
    date: form.date,
    location: form.location.trim(),
    maxDepth: form.maxDepth,
    temp: form.temp,
    buddyName: form.buddyName.trim(),
    buddySignature: form.buddySignature,
    notes: form.notes
  };

  if (form.type === 'scuba') {
    return {
      type: 'scuba',
      ...common,
      durationMinutes: form.durationMinutes,
      entryPressureBar: form.entryPressureBar,
      exitPressureBar: form.exitPressureBar
    };
  }

  const apneaSeconds = parseApneaTime(form.apneaTime);
  if (apneaSeconds === null) {
    triggerToast('최대 무호흡 시간을 분:초 형식으로 입력해주세요. (예: 01:45)', true);
    return null;
  }
  return {
    type: 'freediving',
    ...common,
    diveCount: form.diveCount,
    apneaSeconds,
    discipline: form.discipline,
    weightKg: form.weightKg,
    equalizingMethod: form.equalizingMethod
  };
};

const saveDiveLog = (): void => {
  const draft = buildDraft();
  if (!draft) return;
  const validationError = validateDiveLogDraft(draft);
  if (validationError) return triggerToast(validationError, true);

  try {
    if (editingLogId.value) {
      if (!logbookStore.updateLog(editingLogId.value, draft)) {
        return triggerToast('수정할 로그를 찾지 못했습니다.', true);
      }
      triggerToast('다이빙 로그를 수정했습니다.');
    } else {
      logbookStore.addLog(draft);
      triggerToast('새로운 다이빙 로그가 저장되었습니다! 🌊🐬');
    }
    editingLogId.value = null;
    resetForm();
    isFormOpen.value = false;
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : '로그를 저장하지 못했습니다.', true);
  }
};

const startEditing = async (log: DiveLog): Promise<void> => {
  resetForm();
  Object.assign(form, {
    type: log.type,
    date: log.date,
    location: log.location,
    maxDepth: log.maxDepth,
    temp: log.temp,
    buddyName: log.buddyName,
    buddySignature: log.buddySignature,
    notes: log.notes
  });
  if (log.type === 'scuba') {
    Object.assign(form, {
      durationMinutes: log.durationMinutes,
      entryPressureBar: log.entryPressureBar,
      exitPressureBar: log.exitPressureBar
    });
  } else {
    Object.assign(form, {
      diveCount: log.diveCount,
      apneaTime: formatApneaTime(log.apneaSeconds),
      discipline: log.discipline,
      weightKg: log.weightKg,
      equalizingMethod: log.equalizingMethod
    });
  }
  editingLogId.value = log.id;
  isFormOpen.value = true;
  await nextTick();
  document.getElementById('logbook-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const confirmModalState = reactive<{
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (() => void | Promise<void>) | null;
}>({
  show: false,
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: null
});

const openConfirmModal = (options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}): void => {
  confirmModalState.title = options.title;
  confirmModalState.message = options.message;
  confirmModalState.confirmText = options.confirmText ?? '확인';
  confirmModalState.cancelText = options.cancelText ?? '취소';
  confirmModalState.onConfirm = options.onConfirm;
  confirmModalState.show = true;
};

const handleConfirmModalConfirm = async (): Promise<void> => {
  confirmModalState.show = false;
  if (confirmModalState.onConfirm) {
    const fn = confirmModalState.onConfirm;
    confirmModalState.onConfirm = null;
    await fn();
  }
};

const handleConfirmModalCancel = (): void => {
  confirmModalState.show = false;
  confirmModalState.onConfirm = null;
};

const deleteLog = (id: string): void => {
  openConfirmModal({
    title: '로그 삭제',
    message: '정말로 이 다이빙 로그를 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소',
    onConfirm: () => {
      try {
        logbookStore.deleteLog(id);
        if (editingLogId.value === id) cancelEditing();
        triggerToast('로그북이 삭제되었습니다.');
      } catch (error) {
        triggerToast(error instanceof Error ? error.message : '로그를 삭제하지 못했습니다.', true);
      }
    }
  });
};

const exportLogbook = (): void => {
  try {
    const blob = new Blob([logbookStore.exportBackup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diving-logbook-${getTodayDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('로그북 백업 파일을 저장했습니다.');
  } catch {
    triggerToast('로그북 백업 파일을 만들지 못했습니다.', true);
  }
};

const openImportPicker = (): void => importInputRef.value?.click();

const importLogbook = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('백업 파일은 10MB 이하여야 합니다.');
    const content = await file.text();
    openConfirmModal({
      title: '로그북 복원',
      message: '현재 로그를 백업 파일의 내용으로 교체하시겠습니까?',
      confirmText: '복원',
      cancelText: '취소',
      onConfirm: () => {
        try {
          const result = logbookStore.importBackup(content);
          triggerToast(result.discarded
            ? `${result.logs.length}개를 복원하고 손상된 ${result.discarded}개를 제외했습니다.`
            : `${result.logs.length}개의 로그를 복원했습니다.`);
        } catch (error) {
          triggerToast(error instanceof Error ? error.message : '로그북을 복원하지 못했습니다.', true);
        }
      }
    });
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : '로그북을 복원하지 못했습니다.', true);
  } finally {
    input.value = '';
  }
};
</script>

<style lang="scss">
@use '@/assets/scss/pages/_logbook.scss';
</style>
