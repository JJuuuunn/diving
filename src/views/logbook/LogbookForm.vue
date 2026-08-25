<template>
  <div class="logbook-container logbook-form-page">
    <Header
      :title="isEditing ? '다이빙 로그 수정' : '새 다이빙 로그 작성'"
      subtitle="무호흡 기록, 세이프티 버디 서명 및 9:16 비주얼 카드를 구성하세요"
    />

    <main class="main-content">
      <div class="log-form-card">
        <div class="form-header-row">
          <h2 class="form-title">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
            {{ isEditing ? '다이빙 세션 기록 수정' : '다이빙 세션 기록 입력' }}
          </h2>
          <CustomButton
            variant="ghost"
            class="header-back-btn"
            @click="navigateBack"
          >
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            <span>닫기</span>
          </CustomButton>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> 다이빙 포인트 / 장소</label>
            <CustomInput
              id="location"
              v-model="form.location"
              type="text"
              :trim="true"
              placeholder="예: 가평 K26 / 용인 딥스테이션 / 제주 문섬"
            />
          </div>
          <div class="form-group">
            <label for="logbook-date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> 다이빙 일자</label>
            <CustomDatePicker id="logbook-date" v-model="form.date" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="maxDepth"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> 최대 수심 (m)</label>
            <CustomNumberInput
              id="maxDepth"
              v-model="form.maxDepth"
              :min="0"
              :max="350"
              :step="0.1"
              placeholder="0.0"
            />
          </div>
          <div class="form-group">
            <label for="temp"><i class="fa-solid fa-temperature-half" aria-hidden="true"></i> 수온 (℃)</label>
            <CustomNumberInput
              id="temp"
              v-model="form.temp"
              :min="-10"
              :max="50"
              :step="1"
              placeholder="20"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="apneaTime"><i class="fa-solid fa-stopwatch" aria-hidden="true"></i> 최대 무호흡 시간 (분:초)</label>
            <CustomInput
              id="apneaTime"
              v-model="form.apneaTime"
              type="text"
              placeholder="예: 01:45"
            />
          </div>
          <div class="form-group">
            <label for="discipline"><i class="fa-solid fa-person-swimming" aria-hidden="true"></i> 시도 종목</label>
            <CustomSelect
              id="discipline"
              v-model="form.discipline"
              :options="disciplineOptions"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="weightKg"><i class="fa-solid fa-weight-hanging" aria-hidden="true"></i> 착용 웨이트 (kg)</label>
            <CustomNumberInput
              id="weightKg"
              v-model="form.weightKg"
              :min="0"
              :max="50"
              :step="0.5"
              placeholder="0"
            />
          </div>
          <div class="form-group">
            <label for="diveCount"><i class="fa-solid fa-repeat" aria-hidden="true"></i> 세션 총 다이빙 횟수</label>
            <CustomNumberInput
              id="diveCount"
              v-model="form.diveCount"
              :min="0"
              :max="1000"
              :step="1"
              placeholder="예: 8"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="buddyName"><i class="fa-solid fa-user-shield" aria-hidden="true"></i> 세이프티 버디</label>
            <CustomInput
              id="buddyName"
              v-model="form.buddyName"
              type="text"
              :trim="true"
              placeholder="함께한 세이프티 버디 이름"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="notes"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> 다이빙 메모</label>
            <CustomTextarea
              id="notes"
              v-model="form.notes"
              :max-length="300"
              placeholder="오늘의 다이빙 컨디션, 시야, 수중 느낌 등을 자유롭게 기록해주세요. (최대 300자)"
            />
          </div>
        </div>

        <!-- 버디 서명 영역 (메모 아래 위치) -->
        <div class="signature-trigger-wrapper">
          <span class="field-label"><i class="fa-solid fa-signature" aria-hidden="true"></i> 세이프티 버디 서명 인증</span>
          <CustomButton
            class="signature-preview-area"
            aria-label="세이프티 서명 그리기"
            @click="showSignatureModal = true"
          >
            <img v-if="form.buddySignature" :src="form.buddySignature" alt="현재 세이프티 버디 서명" />
            <span v-else class="placeholder-text">
              <i class="fa-solid fa-signature" aria-hidden="true"></i>
              <span>터치하여 버디 서명을 받으세요</span>
            </span>
          </CustomButton>
        </div>

        <!-- 카드 디자인 선택기 -->
        <LogCardDesignPicker v-model="form.design" />

        <!-- 실시간 비주얼 카드 미리보기 (수정/작성 모드 전용) -->
        <div class="form-card-editor-block">
          <div class="editor-block-heading">
            <div class="heading-text">
              <h3 class="title">
                <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                실시간 카드 미리보기
              </h3>
              <p class="desc">
                선택한 디자인 테마에 작성 중인 다이빙 데이터가 실시간으로 반영됩니다.
              </p>
            </div>
          </div>

          <div class="editor-canvas-wrap">
            <LogCard
              :log="previewLog"
              :design="form.design"
              :is-editor="true"
              @update:hud-layout="onHudLayoutUpdate"
              @update:photo-url="onPhotoUrlUpdate"
            />
          </div>
        </div>

        <div class="form-actions">
          <CustomButton class="cancel-btn" @click="navigateBack">취소</CustomButton>
          <CustomButton class="submit-btn" @click="saveDiveLog">
            <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
            <span>{{ isEditing ? '수정 내용 저장하기' : '로그북 저장하기' }}</span>
          </CustomButton>
        </div>
      </div>

      <Footer />
    </main>

    <CanvasSignature
      v-if="showSignatureModal"
      @close="showSignatureModal = false"
      @save="onSignatureSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RouterName } from '@/mappings/enum';
import { useLogbookStore } from '@/stores/logbook';
import { useToast } from '@/composables/useToast';
import type {
  DiveLog,
  DiveLogDraft,
  FreedivingDiscipline,
  HudLayoutMap,
  LogCardDesign
} from '@/types/logbook';
import { formatApneaTime, parseApneaTime, validateDiveLogDraft } from '@/utils/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomDatePicker from '@/components/CustomDatePicker.vue';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomTextarea from '@/components/CustomTextarea.vue';
import CanvasSignature from './CanvasSignature.vue';
import LogCardDesignPicker from './LogCardDesignPicker.vue';
import LogCard from './LogCard.vue';

const route = useRoute();
const router = useRouter();
const logbookStore = useLogbookStore();
const { triggerToast } = useToast();

const isEditing = computed(() => Boolean(route.params.id));
const logId = computed(() => String(route.params.id || ''));
const showSignatureModal = ref(false);

const disciplineOptions = [
  { value: 'CWT', label: 'CWT' },
  { value: 'CWTB', label: 'CWTB' },
  { value: 'CNF', label: 'CNF' },
  { value: 'FIM', label: 'FIM' },
  { value: 'STA', label: 'STA' },
  { value: 'DYN', label: 'DYN' },
  { value: 'DYNB', label: 'DYNB' },
  { value: 'DNF', label: 'DNF' }
];

const getTodayDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const form = reactive({
  location: '',
  date: getTodayDate(),
  maxDepth: 0,
  temp: 20,
  buddyName: '',
  buddySignature: '',
  notes: '',
  diveCount: 1,
  apneaTime: '',
  discipline: 'CWT' as FreedivingDiscipline,
  weightKg: 0,
  design: 'hud' as LogCardDesign,
  photoUrl: '',
  hudLayout: undefined as HudLayoutMap | undefined
});

const previewLog = computed<DiveLog>(() => {
  return {
    id: logId.value || 'preview-log',
    type: 'freediving',
    location: form.location.trim() || '다이빙 포인트',
    date: form.date,
    maxDepth: form.maxDepth || 0,
    temp: form.temp ?? 20,
    buddyName: form.buddyName.trim() || '',
    buddySignature: form.buddySignature || '',
    notes: form.notes || '',
    photoUrl: form.photoUrl || '',
    design: form.design,
    hudLayout: form.hudLayout,
    diveCount: form.diveCount || 1,
    apneaSeconds: parseApneaTime(form.apneaTime) || 60,
    discipline: form.discipline,
    weightKg: form.weightKg || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

onMounted(() => {
  if (isEditing.value) {
    const target = logbookStore.logs.find((l) => l.id === logId.value);
    if (!target) {
      triggerToast('수정할 로그를 찾을 수 없습니다.', true);
      router.replace({ name: RouterName.Logbook });
      return;
    }

    form.location = target.location;
    form.date = target.date;
    form.maxDepth = target.maxDepth;
    form.temp = target.temp;
    form.buddyName = target.buddyName;
    form.buddySignature = target.buddySignature;
    form.notes = target.notes;
    form.design = (target.design && ['hud', 'ticket', 'sports', 'classic'].includes(target.design) ? target.design : 'hud') as LogCardDesign;
    form.photoUrl = target.photoUrl || '';
    form.hudLayout = target.hudLayout;

    if (target.type === 'freediving') {
      form.diveCount = target.diveCount;
      form.apneaTime = formatApneaTime(target.apneaSeconds);
      form.discipline = target.discipline;
      form.weightKg = target.weightKg;
    }
  }
});

const onHudLayoutUpdate = (newLayout: HudLayoutMap) => {
  form.hudLayout = newLayout;
};

const onPhotoUrlUpdate = (newPhotoUrl: string) => {
  form.photoUrl = newPhotoUrl;
};

const navigateBack = () => {
  router.push({ name: RouterName.Logbook });
};

const onSignatureSave = (signatureData: string): void => {
  form.buddySignature = signatureData;
  showSignatureModal.value = false;
  triggerToast('세이프티 버디 서명이 완료되었습니다! ✍️');
};

const buildDraft = (): DiveLogDraft | null => {
  const common = {
    date: form.date,
    location: form.location.trim(),
    maxDepth: form.maxDepth,
    temp: form.temp,
    buddyName: form.buddyName.trim(),
    buddySignature: form.buddySignature,
    notes: form.notes,
    design: form.design,
    photoUrl: form.photoUrl || undefined,
    hudLayout: form.hudLayout
  };

  const apneaSeconds = parseApneaTime(form.apneaTime);
  if (apneaSeconds === null) {
    triggerToast('최대 무호흡 시간을 분:초 형식으로 입력해주세요. (예: 01:45)', true);
    return null;
  }

  return {
    type: 'freediving',
    ...common,
    diveCount: form.diveCount || 1,
    apneaSeconds,
    discipline: form.discipline,
    weightKg: form.weightKg
  };
};

const saveDiveLog = (): void => {
  const draft = buildDraft();
  if (!draft) return;
  const validationError = validateDiveLogDraft(draft);
  if (validationError) return triggerToast(validationError, true);

  try {
    if (isEditing.value) {
      if (!logbookStore.updateLog(logId.value, draft)) {
        return triggerToast('수정할 로그를 찾지 못했습니다.', true);
      }
      triggerToast('다이빙 로그가 수정되었습니다.');
    } else {
      logbookStore.addLog(draft);
      triggerToast('새 다이빙 로그가 저장되었습니다! 🐬');
    }
    router.push({ name: RouterName.Logbook });
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : '로그를 저장하지 못했습니다.', true);
  }
};
</script>

<style lang="scss">
@use '@/assets/scss/pages/_logbook.scss';

.logbook-form-page {
  .form-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--page-card-border);

    .form-title {
      margin: 0;
    }

    .header-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--page-text-secondary);
      font-size: var(--text-sm);
      font-weight: 600;

      &:hover {
        color: var(--ui-accent);
      }
    }
  }

  .form-card-editor-block {
    margin: var(--spacing-2xl) 0;
    padding: var(--spacing-xl);
    background: var(--ui-option-hover-bg);
    border: 1px solid var(--page-card-border);
    border-radius: var(--radius-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);

    .editor-block-heading {
      .eyebrow {
        font-size: var(--text-2xs);
        font-weight: 800;
        letter-spacing: 0.1em;
        color: var(--ui-accent);
        margin-bottom: 4px;
      }

      .title {
        font-size: var(--text-base);
        font-weight: 800;
        color: var(--page-text-primary);
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          color: var(--ui-accent);
        }
      }

      .desc {
        font-size: var(--text-xs);
        color: var(--page-text-secondary);
        margin: 0;
        line-height: 1.5;
      }
    }

    .editor-canvas-wrap {
      display: flex;
      justify-content: center;

      .log-card-item {
        max-width: 420px;
        width: 100%;
        box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.2);

        // 보딩패스(16:9)는 가로로 넓게
        &.log-card--ticket {
          max-width: 100%;
        }
      }
    }
  }
}
</style>
