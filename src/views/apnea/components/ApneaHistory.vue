<template>
  <div class="apnea-history">
    <!-- 1. 백업 및 데이터 관리 툴바 -->
    <div class="apnea-card apnea-history-toolbar">
      <div class="toolbar-info">
        <h4>훈련 히스토리 보관소</h4>
        <p>총 {{ apneaStore.histories.length }}개의 세션 기록이 보관 중입니다.</p>
      </div>

      <div class="toolbar-actions">
        <!-- 뷰 모드 스위치 -->
        <CustomSegmentedControl
          v-model="viewMode"
          :options="[
            { label: '테이블 뷰', value: 'table', icon: 'fa-solid fa-table-list' },
            { label: '카드 뷰', value: 'card', icon: 'fa-solid fa-grip' }
          ]"
          size="xs"
        />

        <span class="toolbar-divider"></span>

        <!-- 선택 삭제 버튼 (선택 항목 있을 때만 활성화) -->
        <CustomButton
          v-if="selectedKeys.length > 0"
          variant="danger"
          size="sm"
          @click="showBatchDeleteConfirm = true"
        >
          <template #leading><i class="fa-solid fa-trash-can" aria-hidden="true"></i></template>
          선택 삭제 ({{ selectedKeys.length }}개)
        </CustomButton>

        <CustomButton
          variant="outline"
          size="sm"
          @click="handleExport"
        >
          <template #leading><i class="fa-solid fa-download" aria-hidden="true"></i></template>
          JSON 백업
        </CustomButton>

        <CustomButton
          variant="outline"
          size="sm"
          @click="triggerFileInput"
        >
          <template #leading><i class="fa-solid fa-upload" aria-hidden="true"></i></template>
          기록 복원
        </CustomButton>

        <CustomButton
          v-if="apneaStore.histories.length > 0"
          variant="ghost"
          size="sm"
          @click="showClearConfirm = true"
        >
          <template #leading><i class="fa-solid fa-trash" aria-hidden="true"></i></template>
          전체 삭제
        </CustomButton>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        class="sr-only"
        @change="handleImportFile"
      />
    </div>

    <!-- 2. 히스토리 빈 상태 -->
    <div v-if="apneaStore.histories.length === 0" class="apnea-card apnea-empty-box">
      <div class="empty-icon">🌊</div>
      <h3>아직 기록된 훈련 세션이 없습니다</h3>
      <p>테이블 트레이닝이나 자유 측정을 시작하여 나만의 스태틱 숨참기 기록을 쌓아보세요.</p>
    </div>

    <!-- 3-A. 테이블 뷰 (CustomTable 활용) -->
    <div v-else-if="viewMode === 'table'" class="history-table-view">
      <CustomTable
        v-model:selected-keys="selectedKeys"
        :columns="historyColumns"
        :data="apneaStore.histories"
        variant="striped"
        size="sm"
        :paginated="true"
        :page-size="10"
        :selectable="true"
        :expandable="true"
        :show-summary="true"
        summary-text="평균 / 합계"
        card-on-mobile
      >
        <!-- 훈련 종류 셀 커스텀 배지 -->
        <template #cell-type="{ value }">
          <CustomBadge
            :variant="
              value === 'co2'
                ? 'ocean'
                : value === 'o2'
                ? 'coral'
                : value === 'pyramid'
                ? 'warning'
                : value === 'one-breath'
                ? 'abyss'
                : 'neutral'
            "
            size="xs"
            pill
          >
            {{ getTypeLabel(value) }}
          </CustomBadge>
        </template>

        <!-- 삭제 버튼 셀 -->
        <template #cell-actions="{ row }">
          <CustomButton
            variant="ghost"
            size="xs"
            aria-label="기록 삭제"
            @click.stop="apneaStore.removeHistory(row.id)"
          >
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </CustomButton>
        </template>

        <!-- 행 확장 상세 노트 -->
        <template #expand="{ row }">
          <div class="history-expand-detail">
            <div class="expand-item">
              <strong>📅 상세 일시:</strong> {{ formatDate(row.date) }}
            </div>
            <div class="expand-item">
              <strong>⏱️ 첫 수축 시점:</strong>
              {{ row.firstContractionSec ? formatDuration(row.firstContractionSec) : '미บันทึก / 수축 없음' }}
            </div>
            <div v-if="row.note" class="expand-item note">
              <strong>📝 메모 노트:</strong> {{ row.note }}
            </div>
          </div>
        </template>
      </CustomTable>
    </div>

    <!-- 3-B. 카드 뷰 -->
    <div v-else class="history-feed-list">
      <div
        v-for="item in apneaStore.histories"
        :key="item.id"
        class="history-session-card"
      >
        <div class="session-card-header">
          <div class="badge-group">
            <span class="session-type-pill" :class="item.type">
              {{ getTypeLabel(item.type) }}
            </span>
            <span class="session-timestamp">{{ formatDate(item.date) }}</span>
          </div>

          <CustomButton
            variant="ghost"
            size="xs"
            aria-label="세션 기록 삭제"
            @click="apneaStore.removeHistory(item.id)"
          >
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </CustomButton>
        </div>

        <div class="session-metrics-grid">
          <div class="session-metric-item">
            <div class="metric-label">최대 숨참기</div>
            <div class="metric-val highlight">{{ formatDuration(item.maxHoldSec) }}</div>
          </div>
          <div class="session-metric-item">
            <div class="metric-label">완료 라운드</div>
            <div class="metric-val">{{ item.completedRounds }} / {{ item.totalRounds }}</div>
          </div>
          <div class="session-metric-item">
            <div class="metric-label">첫 수축 시점</div>
            <div class="metric-val">
              {{ item.firstContractionSec ? formatDuration(item.firstContractionSec) : '-' }}
            </div>
          </div>
        </div>

        <div v-if="item.note" class="apnea-session-note">
          <i class="fa-regular fa-comment-dots" aria-hidden="true"></i>
          {{ item.note }}
        </div>
      </div>
    </div>

    <!-- 선택 삭제 확인 모달 -->
    <ConfirmModal
      :show="showBatchDeleteConfirm"
      title="선택 기록 삭제"
      :message="`선택한 ${selectedKeys.length}개의 훈련 기록을 삭제하시겠습니까?`"
      confirm-text="삭제하기"
      cancel-text="취소"
      danger
      @confirm="handleConfirmBatchDelete"
      @cancel="showBatchDeleteConfirm = false"
    />

    <!-- 전체 삭제 확인 모달 -->
    <ConfirmModal
      :show="showClearConfirm"
      title="모든 훈련 기록 삭제"
      message="정말로 모든 훈련 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      confirm-text="삭제하기"
      cancel-text="취소"
      danger
      @confirm="handleConfirmClear"
      @cancel="showClearConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ApneaHistoryItem } from '@/types/apnea';
import type { TableColumn } from '@/types/components';
import { formatDuration } from '@/utils/apnea';
import { useApneaStore } from '@/stores/apnea';
import CustomButton from '@/components/CustomButton.vue';
import CustomBadge from '@/components/CustomBadge.vue';
import CustomTable from '@/components/CustomTable.vue';
import CustomSegmentedControl from '@/components/CustomSegmentedControl.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const apneaStore = useApneaStore();
const viewMode = ref<'table' | 'card'>('table');
const selectedKeys = ref<(string | number)[]>([]);
const showBatchDeleteConfirm = ref(false);
const showClearConfirm = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const historyColumns: TableColumn<ApneaHistoryItem>[] = [
  {
    key: 'date',
    label: '일시',
    sortable: true,
    formatter: (val) => formatDate(val)
  },
  {
    key: 'type',
    label: '훈련 종류',
    sortable: true
  },
  {
    key: 'maxHoldSec',
    label: '최대 숨참기',
    align: 'right',
    sortable: true,
    summary: 'avg',
    formatter: (val) => formatDuration(val)
  },
  {
    key: 'completedRounds',
    label: '완료 라운드',
    align: 'center',
    sortable: true,
    summary: 'sum',
    formatter: (val, row) => `${val} / ${row.totalRounds}`
  },
  {
    key: 'firstContractionSec',
    label: '첫 수축 시점',
    align: 'right',
    sortable: true,
    summary: 'avg',
    formatter: (val) => (val ? formatDuration(val) : '-')
  },
  {
    key: 'actions',
    label: '관리',
    align: 'center',
    width: '70px'
  }
];

const getTypeLabel = (type?: unknown) => {
  const t = String(type || '');
  switch (t) {
    case 'co2':
      return 'CO₂ Table';
    case 'o2':
      return 'O₂ Table';
    case 'pyramid':
      return 'Pyramid';
    case 'one-breath':
      return 'One-Breath';
    default:
      return 'Custom STA';
  }
};

const formatDate = (isoDate?: unknown) => {
  const str = String(isoDate || '');
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return str;
  }
};

const handleExport = () => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(apneaStore.exportBackup());
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `apnea-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
};

const handleImportFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      const result = apneaStore.importBackup(content);
      alert(result.message);
    }
  };
  reader.readAsText(file);
};

const handleConfirmBatchDelete = () => {
  showBatchDeleteConfirm.value = false;
  selectedKeys.value.forEach((id) => {
    apneaStore.removeHistory(String(id));
  });
  selectedKeys.value = [];
};

const handleConfirmClear = () => {
  showClearConfirm.value = false;
  apneaStore.clearHistories();
  selectedKeys.value = [];
};
</script>
