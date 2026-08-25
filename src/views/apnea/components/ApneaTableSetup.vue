<template>
  <div class="apnea-table-setup">
    <!-- 1. 훈련 테이블 목록 카드 (Step 1 이거나 step 이 지정되지 않았을 때 표시) -->
    <div v-if="step === 0 || step === 1" class="apnea-card apnea-table-list-card">
      <div class="list-header-row">
        <div class="header-title">
          <i class="fa-solid fa-table-list icon-ocean" aria-hidden="true"></i>
          <div>
            <h4>훈련 테이블 목록 (총 {{ availableTables.length }}개)</h4>
            <p class="header-sub-text">원하는 테이블을 선택하여 상세 일정을 확인하고 훈련을 시작하세요.</p>
          </div>
        </div>
        <div class="header-actions">
          <CustomButton
            size="xs"
            variant="primary"
            @click="addNewCustomTable"
          >
            <template #leading><i class="fa-solid fa-plus" aria-hidden="true"></i></template>
            새 테이블 만들기
          </CustomButton>
        </div>
      </div>

      <!-- 테이블 리스트 그리드 (클릭하여 상세 정보 보기 및 바로 다음 단계 이동) -->
      <div class="table-cards-grid">
        <div
          v-for="tbl in availableTables"
          :key="tbl.id"
          class="table-overview-card"
          :class="{ 'is-active': activeTableId === tbl.id }"
          role="button"
          tabindex="0"
          @click="onSelectTableCard(tbl.id); if (step === 1) emit('next-step')"
          @keydown.enter="onSelectTableCard(tbl.id); if (step === 1) emit('next-step')"
          @keydown.space.prevent="onSelectTableCard(tbl.id); if (step === 1) emit('next-step')"
        >
          <div class="card-top-info">
            <span class="type-badge">{{ getTableTypeLabel(tbl.type) }}</span>
            <span v-if="activeTableId === tbl.id" class="active-indicator-badge">선택됨</span>
          </div>
          <div class="card-title">{{ tbl.name }}</div>
          <div class="card-meta-text">
            <span><i class="fa-solid fa-rotate" aria-hidden="true"></i> {{ tbl.rounds }} 라운드</span>
            <span>·</span>
            <span><i class="fa-regular fa-clock" aria-hidden="true"></i> {{ formatDuration(getTableTotalDuration(tbl.id)) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 선택된 테이블 상세 카드 (Step 2 이거나 step 이 지정되지 않았을 때 표시) -->
    <div v-if="(step === 0 || step === 2) && activeTable" class="apnea-card setup-main-card">
      <div v-if="step === 2" class="step-nav-bar" style="margin-bottom: 1.25rem;">
        <CustomButton variant="outline" size="sm" @click="emit('prev-step')">
          <template #leading><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></template>
          ← 이전 단계 (테이블 선택 목록으로 돌아가기)
        </CustomButton>
      </div>

      <!-- 3. 상세 라운드 테이블 (기본 Read-Only, 편집 모드 토글 버튼) -->
      <div class="timeline-table-section">
        <div class="timeline-header">
          <div class="title-meta-group">
            <h4>
              <i class="fa-solid fa-sliders" aria-hidden="true"></i>
              {{ activeTableName }} 상세 라운드
            </h4>
            <span class="round-count-tag">총 {{ roundCount }}라운드</span>
            <span class="mode-state-tag" :class="{ 'is-editing': isEditMode }">
              {{ isEditMode ? '편집 모드' : '읽기 전용' }}
            </span>
          </div>

          <div class="table-action-group">
            <!-- 편집 모드 토글 버튼 -->
            <CustomButton
              size="xs"
              :variant="isEditMode ? 'primary' : 'outline'"
              @click="isEditMode = !isEditMode"
            >
              <template #leading>
                <i :class="isEditMode ? 'fa-solid fa-check' : 'fa-solid fa-pen-to-square'" aria-hidden="true"></i>
              </template>
              {{ isEditMode ? '편집 완료 (읽기 전용)' : '시간/라운드 편집' }}
            </CustomButton>

            <!-- 편집 모드일 때만 표시되는 버튼들 -->
            <template v-if="isEditMode">
              <div class="round-adjust-btns">
                <CustomButton size="xs" variant="outline" @click="updateRoundCount(-1)">
                  -1R 삭제
                </CustomButton>
                <CustomButton size="xs" variant="outline" @click="updateRoundCount(1)">
                  +1R 추가
                </CustomButton>
              </div>

              <CustomButton size="xs" variant="outline" @click="showSaveModal = true">
                <template #leading><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i></template>
                테이블 저장
              </CustomButton>
            </template>
          </div>
        </div>

        <!-- 전략 템플릿 재설정 (편집 모드일 때 테이블 바로 위 노출) -->
        <div v-if="isEditMode" class="apnea-setup-grid fade-in-up" style="margin-top: 1rem; margin-bottom: 1.25rem;">
          <div class="setup-section-block">
            <div class="section-title-row">
              <span class="section-label">
                <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
                전략 템플릿 재설정
              </span>
              <span class="section-val-display preset-sub-info">
                {{ roundCount }} 라운드
              </span>
            </div>
            <div class="chips-group">
              <CustomButton
                v-for="tmpl in templates"
                :key="tmpl.id"
                size="xs"
                :variant="selectedTemplate === tmpl.id ? 'primary' : 'outline'"
                @click="applyTemplate(tmpl.id)"
              >
                {{ tmpl.icon }} {{ tmpl.name }}
              </CustomButton>
            </div>
          </div>
        </div>

        <div class="plan-table-wrapper">
          <CustomTable
            :columns="planColumns"
            :data="activePlans"
            variant="striped"
            size="sm"
            :show-summary="true"
            summary-text="총 소요시간"
            card-on-mobile
          >
            <!-- 휴식 시간: 읽기 전용 vs 편집 모드 공용 UI CustomSelect 사용 -->
            <template #cell-restDurationSec="{ row, index }">
              <div v-if="isEditMode" class="editable-time-cell">
                <CustomSelect
                  :model-value="row.restDurationSec"
                  :options="selectTimeOptions"
                  size="xs"
                  aria-label="휴식 시간 선택"
                  @update:model-value="onRestTimeChange(index, $event)"
                />
              </div>
              <span v-else class="read-time-cell rest">
                {{ formatDuration(row.restDurationSec) }}
              </span>
            </template>

            <!-- 숨참기 시간: 읽기 전용 vs 편집 모드 공용 UI CustomSelect 사용 -->
            <template #cell-holdDurationSec="{ row, index }">
              <div v-if="isEditMode" class="editable-time-cell">
                <CustomSelect
                  :model-value="row.holdDurationSec"
                  :options="selectTimeOptions"
                  size="xs"
                  aria-label="숨참기 시간 선택"
                  @update:model-value="onHoldTimeChange(index, $event)"
                />
              </div>
              <span v-else class="read-time-cell hold">
                {{ formatDuration(row.holdDurationSec) }}
              </span>
            </template>
          </CustomTable>
        </div>
      </div>

      <!-- 4. 세션 시작 버튼 -->
      <div class="apnea-start-action">
        <CustomButton
          variant="primary"
          size="lg"
          block
          @click="handleStart"
        >
          <template #leading>
            <i class="fa-solid fa-play" aria-hidden="true"></i>
          </template>
          {{ activeTableName }} 훈련 세션 시작하기 ({{ roundCount }}R)
        </CustomButton>
      </div>
    </div>

    <!-- 테이블 저장 모달 -->
    <div v-if="showSaveModal" class="apnea-result-backdrop">
      <div class="apnea-card modal-content-card">
        <h3>커스텀 테이블 저장</h3>
        <CustomInput
          v-model="presetNameInput"
          label="테이블 이름"
          placeholder="예: 6R 변형 피라미드"
        />
        <div class="modal-btn-row">
          <CustomButton variant="ghost" @click="showSaveModal = false">취소</CustomButton>
          <CustomButton variant="primary" :disabled="!presetNameInput.trim()" @click="saveCustomPreset">저장</CustomButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ApneaCustomTablePreset, ApneaRoundPlan, ApneaTrainingType } from '@/types/apnea';
import type { SelectOption } from '@/types/inputs';
import type { TableColumn } from '@/types/components';
import {
  formatDuration,
  formatDurationKorean,
  generateTablePlan,
  generatePyramidPlan,
  generateOneBreathPlan,
  calculateTotalPlanDuration
} from '@/utils/apnea';
import { useApneaStore } from '@/stores/apnea';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import CustomTable from '@/components/CustomTable.vue';

const props = withDefaults(defineProps<{
  step?: number;
  selectedTableId?: string;
}>(), {
  step: 0,
  selectedTableId: ''
});

const emit = defineEmits<{
  (e: 'start', payload: { type: ApneaTrainingType; plans: ApneaRoundPlan[]; prepareSec: number }): void;
  (e: 'select-table', tableId: string): void;
  (e: 'next-step'): void;
  (e: 'prev-step'): void;
}>();

const apneaStore = useApneaStore();

// Read-Only (default) vs Edit Mode Toggle
const isEditMode = ref(false);

const planColumns = computed<TableColumn<ApneaRoundPlan>[]>(() => [
  {
    key: 'roundNumber',
    label: '라운드',
    align: 'center',
    width: '130px',
    formatter: (val) => `Round ${val}`
  },
  {
    key: 'restDurationSec',
    label: '휴식 시간',
    align: 'right',
    width: '30%',
    summary: (vals: number[]) => {
      const sum = vals.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      return formatDurationKorean(sum);
    }
  },
  {
    key: 'holdDurationSec',
    label: '숨참기 시간',
    align: 'right',
    width: '30%',
    summary: (vals: number[]) => {
      const sum = vals.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      return formatDurationKorean(sum);
    }
  },
  {
    key: 'totalSec',
    label: '라운드 소요',
    align: 'right',
    width: '30%',
    summary: () => {
      const roundTotalSec = calculateTotalPlanDuration(activePlans.value, 0);
      return formatDurationKorean(roundTotalSec);
    },
    formatter: (_, row) => formatDuration(row.restDurationSec + row.holdDurationSec)
  }
]);

// 초 단위(1초~600초/10분) 선택 옵션 리스트 (Read 모드와 동일한 MM:SS 포맷)
const selectTimeOptions: SelectOption[] = Array.from({ length: 600 }, (_, i) => {
  const s = i + 1;
  return {
    label: formatDuration(s),
    value: s
  };
});

const currentPbSec = computed(() => apneaStore.pbHoldSec || 180);
const prepareDurationSec = ref<number>(apneaStore.settings.defaultPrepareDurationSec || 120);

const templates = [
  { id: 'co2' as const, name: 'CO₂ 내성', icon: '🫁' },
  { id: 'o2' as const, name: 'O₂ 저산소', icon: '🧠' },
  { id: 'pyramid' as const, name: '피라미드', icon: '🔺' },
  { id: 'flat' as const, name: '고정 인터벌', icon: '⚡' },
  { id: 'one-breath' as const, name: '원 브레스', icon: '🌬️' }
];

// Active Table & Available Tables (Default: no table pre-selected in Step 1)
const activeTableId = ref<string>(props.selectedTableId || '');
const selectedTemplate = ref<string>('co2');
const activePlans = ref<ApneaRoundPlan[]>([]);
const roundCount = computed(() => activePlans.value.length || 8);

const showSaveModal = ref(false);
const presetNameInput = ref('');

const standardTables = [
  { id: 'std-co2', name: '표준 CO₂ 테이블', type: 'co2' as const, rounds: 8 },
  { id: 'std-o2', name: '표준 O₂ 테이블', type: 'o2' as const, rounds: 8 },
  { id: 'std-pyramid', name: '피라미드 테이블', type: 'pyramid' as const, rounds: 6 }
];

const availableTables = computed(() => {
  const customList = apneaStore.customPresets.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    rounds: p.rounds
  }));
  return [...standardTables, ...customList];
});

const activeTable = computed(() => {
  if (!activeTableId.value) {
    if (props.step === 2) {
      return availableTables.value[0] || null;
    }
    return null;
  }
  return availableTables.value.find((t) => t.id === activeTableId.value) || availableTables.value[0];
});

const activeTableName = computed(() => {
  return activeTable.value ? activeTable.value.name : '커스텀 테이블';
});

const getTableTypeLabel = (type: string) => {
  switch (type) {
    case 'co2': return '🫁 CO₂ 내성';
    case 'o2': return '🧠 O₂ 저산소';
    case 'pyramid': return '🔺 피라미드';
    case 'one-breath': return '🌬️ 원 브레스';
    case 'flat': return '⚡ 고정';
    default: return '🛠️ 커스텀';
  }
};

const rebuildPlansForType = (type: string, rounds = 8) => {
  const pb = currentPbSec.value;
  if (type === 'co2') {
    activePlans.value = generateTablePlan('co2', pb, rounds);
  } else if (type === 'o2') {
    activePlans.value = generateTablePlan('o2', pb, rounds);
  } else if (type === 'pyramid') {
    const baseHold = Math.round((pb * 0.5) / 5) * 5 || 90;
    activePlans.value = generatePyramidPlan(baseHold, 60, rounds);
  } else if (type === 'one-breath') {
    const baseHold = Math.round((pb * 0.5) / 5) * 5 || 90;
    activePlans.value = generateOneBreathPlan(baseHold, 15, rounds);
  } else if (type === 'flat') {
    const baseHold = Math.round((pb * 0.5) / 5) * 5 || 90;
    activePlans.value = Array.from({ length: rounds }, (_, i) => ({
      roundNumber: i + 1,
      restDurationSec: 60,
      holdDurationSec: baseHold
    }));
  }
};

const getTableTotalDuration = (tableId: string) => {
  const custom = apneaStore.customPresets.find((p) => p.id === tableId);
  if (custom) {
    return calculateTotalPlanDuration(custom.plans, 0);
  }
  const std = standardTables.find((t) => t.id === tableId);
  if (std) {
    const pb = currentPbSec.value;
    let plans: ApneaRoundPlan[] = [];
    if (std.type === 'co2') plans = generateTablePlan('co2', pb, std.rounds);
    else if (std.type === 'o2') plans = generateTablePlan('o2', pb, std.rounds);
    else if (std.type === 'pyramid') plans = generatePyramidPlan(Math.round((pb * 0.5) / 5) * 5 || 90, 60, std.rounds);
    return calculateTotalPlanDuration(plans, 0);
  }
  return calculateTotalPlanDuration(activePlans.value, 0);
};

const selectActiveTable = (id: string) => {
  activeTableId.value = id;
  isEditMode.value = false; // Reset to Read-Only when switching tables
  const custom = apneaStore.customPresets.find((p) => p.id === id);
  if (custom) {
    selectedTemplate.value = 'custom';
    activePlans.value = JSON.parse(JSON.stringify(custom.plans));
  } else {
    const std = standardTables.find((t) => t.id === id);
    if (std) {
      selectedTemplate.value = std.type;
      rebuildPlansForType(std.type, std.rounds);
    }
  }
};

const onSelectTableCard = (id: string) => {
  selectActiveTable(id);
  emit('select-table', id);
};

watch(
  () => props.selectedTableId,
  (newId) => {
    if (newId) {
      selectActiveTable(newId);
    } else if (props.step === 2 && !activeTableId.value) {
      selectActiveTable(availableTables.value[0]?.id || 'std-co2');
    }
  },
  { immediate: true }
);

watch(currentPbSec, () => {
  if (activeTableId.value && selectedTemplate.value !== 'custom') {
    rebuildPlansForType(selectedTemplate.value, activePlans.value.length || 8);
  }
}, { immediate: true });

const applyTemplate = (tmplId: string) => {
  selectedTemplate.value = tmplId;
  rebuildPlansForType(tmplId, activePlans.value.length || 8);
};

const updateRoundCount = (delta: number) => {
  const next = activePlans.value.length + delta;
  if (next < 2 || next > 16) return;

  if (delta > 0) {
    const last = activePlans.value[activePlans.value.length - 1];
    activePlans.value.push({
      roundNumber: next,
      restDurationSec: last ? last.restDurationSec : 60,
      holdDurationSec: last ? last.holdDurationSec : 90
    });
  } else {
    activePlans.value.pop();
  }
};

const onRestTimeChange = (roundIdx: number, val: unknown) => {
  selectedTemplate.value = 'custom';
  const sec = typeof val === 'number' ? val : Number(val);
  if (!isNaN(sec) && activePlans.value[roundIdx]) {
    activePlans.value[roundIdx].restDurationSec = sec;
  }
};

const onHoldTimeChange = (roundIdx: number, val: unknown) => {
  selectedTemplate.value = 'custom';
  const sec = typeof val === 'number' ? val : Number(val);
  if (!isNaN(sec) && activePlans.value[roundIdx]) {
    activePlans.value[roundIdx].holdDurationSec = sec;
  }
};

const addNewCustomTable = () => {
  const count = apneaStore.customPresets.length + 1;
  const newTable: ApneaCustomTablePreset = {
    id: `custom-${Date.now()}`,
    name: `커스텀 테이블 ${count}`,
    type: 'custom',
    rounds: 6,
    plans: generateTablePlan('co2', currentPbSec.value, 6),
    createdAt: new Date().toISOString()
  };
  apneaStore.saveCustomPreset(newTable);
  selectActiveTable(newTable.id);
  isEditMode.value = true; // Auto open edit mode for new table
  emit('select-table', newTable.id);
};

const saveCustomPreset = () => {
  if (!presetNameInput.value.trim()) return;

  const newPreset: ApneaCustomTablePreset = {
    id: `custom-${Date.now()}`,
    name: presetNameInput.value.trim(),
    type: 'custom',
    rounds: activePlans.value.length,
    plans: JSON.parse(JSON.stringify(activePlans.value)),
    createdAt: new Date().toISOString()
  };

  apneaStore.saveCustomPreset(newPreset);
  activeTableId.value = newPreset.id;
  presetNameInput.value = '';
  showSaveModal.value = false;
  isEditMode.value = false;
};

const totalDuration = computed(() => {
  return calculateTotalPlanDuration(activePlans.value, prepareDurationSec.value);
});

const handleStart = () => {
  emit('start', {
    type: selectedTemplate.value as ApneaTrainingType,
    plans: activePlans.value,
    prepareSec: prepareDurationSec.value
  });
};
</script>
