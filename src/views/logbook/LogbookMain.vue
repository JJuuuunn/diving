<template>
  <div class="logbook-container logbook-list-page">
    <Header title="프리다이빙 로그북" subtitle="나의 무호흡 기록과 세이프티 버디 서명 관리" />

    <main class="main-content">
      <div v-if="logbookStore.storageError" class="logbook-alert-card">
        <CustomAlert variant="warning" dismissible>
          {{ logbookStore.storageError }}
        </CustomAlert>
      </div>

      <!-- 상단 다이버 세션 스탯 오버뷰 콕핏 -->
      <section class="logbook-stats-ribbon" aria-label="나의 프리다이빙 퍼포먼스 통계">
        <div class="cockpit-header">
          <div class="cockpit-title-wrap">
            <i class="fa-solid fa-gauge-high cockpit-icon" aria-hidden="true"></i>
            <span class="cockpit-title">다이빙 퍼포먼스 텔레메트리</span>
          </div>
          <span class="cockpit-badge">
            <span class="badge-dot pulse"></span>
            <span>PB TRACKER</span>
          </span>
        </div>

        <div class="stats-ribbon-grid">
          <div class="stat-pill highlight-depth">
            <div class="stat-icon">
              <i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i>
            </div>
            <div class="stat-data">
              <span class="stat-label">최고 수심 (PB)</span>
              <div class="stat-value-group">
                <strong class="stat-value">{{ maxDepthRecord }}</strong>
                <span class="stat-unit">m</span>
              </div>
            </div>
          </div>

          <div class="stat-pill highlight-apnea">
            <div class="stat-icon">
              <i class="fa-solid fa-stopwatch" aria-hidden="true"></i>
            </div>
            <div class="stat-data">
              <span class="stat-label">최장 무호흡 (PB)</span>
              <div class="stat-value-group">
                <strong class="stat-value">{{ maxApneaRecord }}</strong>
              </div>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-icon">
              <i class="fa-solid fa-book-bookmark" aria-hidden="true"></i>
            </div>
            <div class="stat-data">
              <span class="stat-label">총 다이빙 로그</span>
              <div class="stat-value-group">
                <strong class="stat-value">{{ totalLogsCount }}</strong>
                <span class="stat-unit">개</span>
              </div>
            </div>
          </div>

          <div class="stat-pill">
            <div class="stat-icon">
              <i class="fa-solid fa-water" aria-hidden="true"></i>
            </div>
            <div class="stat-data">
              <span class="stat-label">누적 다이브</span>
              <div class="stat-value-group">
                <strong class="stat-value">{{ totalSessionDives }}</strong>
                <span class="stat-unit">회</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 새 로그 작성 페이지 이동 액션 버튼 -->
      <div class="logbook-hero-action">
        <CustomButton
          class="create-log-primary-btn"
          aria-label="새로운 프리다이빙 로그 작성하기"
          @click="router.push({ name: RouterName.LogbookNew })"
        >
          <div class="btn-inner">
            <span class="btn-icon-wrap">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
            </span>
            <span class="btn-label">새 다이빙 로그 기록하기</span>
          </div>
          <i class="fa-solid fa-chevron-right btn-arrow" aria-hidden="true"></i>
        </CustomButton>
      </div>

      <!-- 툴바 (검색, 정렬, 백업/복원, 종목 필터) -->
      <section class="logbook-tools-section" aria-label="로그북 검색 및 필터">
        <div class="tools-primary-row">
          <div class="search-input-wrap">
            <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
            <CustomInput
              v-model="searchQuery"
              type="search"
              aria-label="다이빙 로그 검색"
              placeholder="포인트 장소, 버디 이름, 메모 내용 검색"
            />
          </div>

          <div class="tools-utility-group">
            <div class="sort-select-wrap">
              <CustomSelect
                v-model="sortOrder"
                aria-label="로그 정렬 기준"
                :options="sortOptions"
              />
            </div>
            <div class="backup-actions">
              <CustomButton
                class="backup-btn"
                aria-label="로그북 데이터 백업"
                title="JSON 파일로 백업"
                @click="exportLogbook"
              >
                <i class="fa-solid fa-download" aria-hidden="true"></i>
                <span>백업</span>
              </CustomButton>
              <CustomButton
                class="restore-btn"
                aria-label="로그북 데이터 복원"
                title="JSON 백업 파일 복원"
                @click="triggerImport"
              >
                <i class="fa-solid fa-upload" aria-hidden="true"></i>
                <span>복원</span>
              </CustomButton>
              <input
                ref="importInputRef"
                type="file"
                accept=".json,application/json"
                class="visually-hidden-input"
                @change="handleImportFile"
              />
            </div>
          </div>
        </div>

        <!-- 종목 필터 칩 바 (현재 로그에 존재하는 종목만 동적 노출) -->
        <div v-if="activeDisciplines.length > 0" class="discipline-chips-bar" role="tablist" aria-label="종목별 필터">
          <CustomButton
            v-for="chip in filterOptions"
            :key="chip.value"
            class="filter-chip-btn"
            :class="{ 'is-active': disciplineFilter === chip.value }"
            :aria-selected="disciplineFilter === chip.value"
            role="tab"
            @click="disciplineFilter = chip.value"
          >
            <span>{{ chip.label }}</span>
            <small class="chip-count">{{ getDisciplineCount(chip.value) }}</small>
          </CustomButton>
        </div>
      </section>

      <!-- 로그 카드 목록 피드 -->
      <section class="logs-feed-section" aria-label="다이빙 로그 목록">
        <!-- 피드 상단 상태 정보 헤더 -->
        <div v-if="visibleLogs.length > 0" class="feed-status-bar">
          <span class="feed-count">
            총 <strong>{{ visibleLogs.length }}</strong>개의 기록
            <span v-if="disciplineFilter !== 'all'" class="active-filter-tag">({{ disciplineFilter }})</span>
          </span>
          <span class="feed-hint">카드를 탭하여 상세 정보 및 버디 서명을 확인하세요</span>
        </div>

        <div v-if="visibleLogs.length === 0" class="logbook-empty-state">
          <div class="empty-icon-wrap">
            <i class="fa-solid fa-water" aria-hidden="true"></i>
          </div>
          <h3 class="empty-title">
            {{ searchQuery || disciplineFilter !== 'all' ? '일치하는 다이빙 로그가 없습니다' : '아직 기록된 다이빙 로그가 없습니다' }}
          </h3>
          <p class="empty-desc">
            {{ searchQuery || disciplineFilter !== 'all' ? '검색어나 종목 필터를 변경해보세요.' : '첫 번째 다이빙 세션을 기록하고 멋진 9:16 카드를 만들어보세요!' }}
          </p>
          <CustomButton
            v-if="!searchQuery && disciplineFilter === 'all'"
            class="empty-cta-btn"
            @click="router.push({ name: RouterName.LogbookNew })"
          >
            <i class="fa-solid fa-pen-nib" aria-hidden="true"></i>
            <span>첫 다이빙 로그 작성하기</span>
          </CustomButton>
        </div>

        <div v-else class="logs-grid-layout">
          <LogCard
            v-for="log in visibleLogs"
            :key="log.id"
            :log="log"
            :design="log.design || 'hud'"
            :readonly="true"
            @view="openDetail"
            @edit="startEditing"
            @delete="deleteLog"
          />
        </div>
      </section>

      <Footer />
    </main>

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
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { RouterName } from '@/mappings/enum';
import { useLogbookStore } from '@/stores/logbook';
import { useToast } from '@/composables/useToast';
import type { DiveLog } from '@/types/logbook';
import { formatApneaTime } from '@/utils/logbook';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomAlert from '@/components/CustomAlert.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import LogCard from './LogCard.vue';

type SortOrder = 'date-desc' | 'date-asc' | 'updated-desc';

const AIDA_DISCIPLINE_ORDER = ['CWT', 'CWTB', 'CNF', 'FIM', 'STA', 'DYN', 'DYNB', 'DNF'];

const sortOptions = [
  { value: 'date-desc', label: '최신순' },
  { value: 'date-asc', label: '오래된순' },
  { value: 'updated-desc', label: '최근 수정순' }
];

const router = useRouter();
const logbookStore = useLogbookStore();
const { triggerToast } = useToast();

const searchQuery = ref('');
const disciplineFilter = ref<string>('all');
const sortOrder = ref<SortOrder>('date-desc');
const importInputRef = ref<HTMLInputElement | null>(null);

// 현재 저장된 로그에 존재하는 종목만 동적으로 추출
const activeDisciplines = computed(() => {
  const present = new Set<string>();
  for (const log of logbookStore.logs) {
    if (log.type === 'freediving' && log.discipline) {
      present.add(log.discipline);
    }
  }
  const ordered = AIDA_DISCIPLINE_ORDER.filter((d) => present.has(d));
  const others = Array.from(present).filter((d) => !AIDA_DISCIPLINE_ORDER.includes(d));
  return [...ordered, ...others];
});

// 종목 필터 옵션 (전체 + 현재 존재하는 종목)
const filterOptions = computed(() => {
  const base = [{ value: 'all', label: '전체 종목' }];
  const dynamic = activeDisciplines.value.map((d) => ({ value: d, label: d }));
  return [...base, ...dynamic];
});

// 선택되어 있던 종목이 로그 삭제 등으로 사라지면 'all'로 리셋
watch(activeDisciplines, (newDisciplines) => {
  if (disciplineFilter.value !== 'all' && !newDisciplines.includes(disciplineFilter.value)) {
    disciplineFilter.value = 'all';
  }
});

// 통계 계산
const totalLogsCount = computed(() => logbookStore.logs.length);

const maxDepthRecord = computed(() => {
  if (logbookStore.logs.length === 0) return 0;
  const max = Math.max(...logbookStore.logs.map((l) => l.maxDepth || 0));
  return Number.isFinite(max) ? max : 0;
});

const maxApneaRecord = computed(() => {
  const freeLogs = logbookStore.logs.filter((l) => l.type === 'freediving');
  if (freeLogs.length === 0) return '00:00';
  const maxSeconds = Math.max(...freeLogs.map((l) => (l.type === 'freediving' ? l.apneaSeconds : 0)));
  return Number.isFinite(maxSeconds) && maxSeconds > 0 ? formatApneaTime(maxSeconds) : '00:00';
});

const totalSessionDives = computed(() => {
  return logbookStore.logs.reduce((acc, cur) => {
    return acc + (cur.type === 'freediving' ? cur.diveCount || 1 : 1);
  }, 0);
});

const getDisciplineCount = (discipline: string): number => {
  if (discipline === 'all') return logbookStore.logs.length;
  return logbookStore.logs.filter((l) => l.type === 'freediving' && l.discipline === discipline).length;
};

const visibleLogs = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ko-KR');
  return logbookStore.logs
    .filter((log) => {
      if (disciplineFilter.value === 'all') return true;
      if (log.type === 'freediving') return log.discipline === disciplineFilter.value;
      return true;
    })
    .filter((log) => !query || [log.location, log.buddyName, log.notes]
      .some((value) => value.toLocaleLowerCase('ko-KR').includes(query)))
    .slice()
    .sort((a, b) => {
      if (sortOrder.value === 'updated-desc') return b.updatedAt.localeCompare(a.updatedAt);
      const comparison = a.date.localeCompare(b.date);
      return sortOrder.value === 'date-asc' ? comparison : -comparison;
    });
});

const openDetail = (log: DiveLog): void => {
  router.push({ name: RouterName.LogbookDetail, params: { id: log.id } });
};

const startEditing = (log: DiveLog): void => {
  router.push({ name: RouterName.LogbookEdit, params: { id: log.id } });
};

const deleteTargetId = ref<string | null>(null);
const confirmModalState = ref({
  show: false,
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소'
});

const deleteLog = (id: string): void => {
  deleteTargetId.value = id;
  confirmModalState.value = {
    show: true,
    title: '로그 삭제',
    message: '이 다이빙 로그를 삭제하시겠습니까?',
    confirmText: '삭제',
    cancelText: '취소'
  };
};

const handleConfirmModalConfirm = (): void => {
  if (deleteTargetId.value) {
    logbookStore.deleteLog(deleteTargetId.value);
    deleteTargetId.value = null;
    triggerToast('로그가 삭제되었습니다.');
  }
  confirmModalState.value.show = false;
};

const handleConfirmModalCancel = (): void => {
  deleteTargetId.value = null;
  confirmModalState.value.show = false;
};

const exportLogbook = (): void => {
  const payload = logbookStore.exportBackup();
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `diving-logbook-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  triggerToast('로그북 백업 파일이 다운로드되었습니다.');
};

const triggerImport = (): void => {
  importInputRef.value?.click();
};

const handleImportFile = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const result = logbookStore.importBackup(raw);
    triggerToast(`총 ${result.logs.length}개 로그를 가져왔습니다.`);
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : '백업 파일을 가져오지 못했습니다.', true);
  } finally {
    if (target) target.value = '';
  }
};
</script>

<style lang="scss">
@use '@/assets/scss/pages/_logbook.scss';
</style>
