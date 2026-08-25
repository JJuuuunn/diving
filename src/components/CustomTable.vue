<template>
  <div
    class="custom-table-container"
    :class="[
      `custom-table-container--${variant}`,
      getSizeClass('custom-table-container', size),
      {
        'is-card-on-mobile': cardOnMobile
      }
    ]"
    role="region"
    aria-label="데이터 테이블"
  >
    <div class="custom-table-responsive">
      <table
        class="custom-table"
        :class="[
          `custom-table--${variant}`,
          getSizeClass('custom-table', size),
          {
            'is-hoverable': hoverable,
            'is-sticky-header': stickyHeader
          }
        ]"
      >
        <!-- Table Header -->
        <thead>
          <tr>
            <!-- Expand Column Header -->
            <th v-if="expandable" class="cell-expand" scope="col">
              <span class="sr-only">상세 보기 열</span>
            </th>

            <!-- Selection Column Header -->
            <th v-if="selectable" class="cell-checkbox" scope="col">
              <input
                v-if="selectionType === 'checkbox'"
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                :disabled="disabled || !displayData.length"
                aria-label="전체 항목 선택"
                @change="toggleSelectAll"
              />
              <span v-else class="sr-only">선택 열</span>
            </th>

            <!-- Data Column Headers -->
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="{ width: col.width, textAlign: col.align || 'left' }"
              :class="[
                `align-${col.align || 'left'}`,
                {
                  'is-sortable': col.sortable,
                  'is-sorted': sortState.key === col.key && sortState.order !== null
                }
              ]"
              :aria-sort="
                sortState.key === col.key
                  ? sortState.order === 'asc'
                    ? 'ascending'
                    : sortState.order === 'desc'
                    ? 'descending'
                    : 'none'
                  : undefined
              "
              @click="col.sortable && handleSort(col)"
              @keydown.enter.prevent="col.sortable && handleSort(col)"
              :tabindex="col.sortable ? 0 : undefined"
            >
              <slot :name="`header-${col.key}`" :column="col">
                <slot name="header" :column="col">
                  <span>{{ col.label }}</span>
                </slot>
              </slot>

              <!-- Sort Icon -->
              <span
                v-if="col.sortable"
                class="custom-table__sort-icon"
                :class="{ 'is-active': sortState.key === col.key && sortState.order !== null }"
                aria-hidden="true"
              >
                <i
                  v-if="sortState.key === col.key && sortState.order === 'asc'"
                  class="fa-solid fa-arrow-up"
                ></i>
                <i
                  v-else-if="sortState.key === col.key && sortState.order === 'desc'"
                  class="fa-solid fa-arrow-down"
                ></i>
                <i v-else class="fa-solid fa-sort"></i>
              </span>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody v-if="!loading && displayData.length > 0">
          <template v-for="(row, idx) in displayData" :key="getRowKey(row, idx)">
            <!-- Primary Row -->
            <tr
              :class="{
                'is-selected': isRowSelected(getRowKey(row, idx)),
                'is-expanded': isRowExpanded(getRowKey(row, idx))
              }"
              @click="onRowClick(row, idx, $event)"
            >
              <!-- Expand Toggle Cell -->
              <td v-if="expandable" class="cell-expand">
                <CustomButton
                  size="xs"
                  variant="ghost"
                  :aria-label="isRowExpanded(getRowKey(row, idx)) ? '상세 접기' : '상세 펼치기'"
                  :aria-expanded="isRowExpanded(getRowKey(row, idx))"
                  @click.stop="toggleRowExpand(row, idx)"
                >
                  <i
                    class="fa-solid"
                    :class="isRowExpanded(getRowKey(row, idx)) ? 'fa-chevron-down' : 'fa-chevron-right'"
                    aria-hidden="true"
                  ></i>
                </CustomButton>
              </td>

              <!-- Selection Checkbox / Radio Cell -->
              <td v-if="selectable" class="cell-checkbox">
                <input
                  :type="selectionType"
                  :name="selectionType === 'radio' ? radioGroupName : undefined"
                  :checked="isRowSelected(getRowKey(row, idx))"
                  :disabled="disabled"
                  :aria-label="`항목 ${idx + 1} 선택`"
                  @change.stop="toggleRowSelection(row, idx)"
                  @click.stop
                />
              </td>

              <!-- Data Cells -->
              <td
                v-for="col in columns"
                :key="col.key"
                :data-label="col.label"
                :class="`align-${col.align || 'left'}`"
                :style="{ textAlign: col.align || 'left' }"
              >
                <slot
                  :name="`cell-${col.key}`"
                  :row="row"
                  :column="col"
                  :index="idx"
                  :value="getRawValue(row, col.key)"
                >
                  <slot
                    name="cell"
                    :row="row"
                    :column="col"
                    :index="idx"
                    :value="getRawValue(row, col.key)"
                  >
                    {{ getFormattedValue(col, row, idx) }}
                  </slot>
                </slot>
              </td>
            </tr>

            <!-- Expanded Detail Row -->
            <tr
              v-if="expandable && isRowExpanded(getRowKey(row, idx))"
              :key="`expand-${getRowKey(row, idx)}`"
              class="custom-table__expand-row"
            >
              <td :colspan="totalColSpan">
                <slot name="expand" :row="row" :index="idx">
                  <pre>{{ JSON.stringify(row, null, 2) }}</pre>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>

        <!-- Summary Footer Row -->
        <tfoot v-if="!loading && displayData.length > 0 && showSummary">
          <tr class="custom-table__summary-row">
            <td v-if="expandable" class="cell-expand"></td>
            <td v-if="selectable" class="cell-checkbox"></td>
            <td
              v-for="(col, colIdx) in columns"
              :key="col.key"
              :class="`align-${col.align || 'left'}`"
              :style="{ textAlign: col.align || 'left' }"
            >
              <slot :name="`summary-${col.key}`" :column="col" :summary="summaryValues[col.key]">
                <slot name="summary" :column="col" :summary="summaryValues[col.key]">
                  <strong v-if="colIdx === 0 && !col.summary">{{ summaryText }}</strong>
                  <span v-else-if="col.summary !== undefined">{{ summaryValues[col.key] }}</span>
                </slot>
              </slot>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Loading State -->
      <div v-if="loading" class="custom-table__loading" role="status">
        <slot name="loading">
          <CustomSkeleton type="list" :size="size" />
          <span>{{ loadingText }}</span>
        </slot>
      </div>

      <!-- Empty State -->
      <div v-else-if="displayData.length === 0" class="custom-table__empty">
        <slot name="empty">
          <i class="fa-solid fa-inbox fa-2x" aria-hidden="true"></i>
          <p>{{ emptyText }}</p>
        </slot>
      </div>
    </div>

    <!-- Integrated Pagination Component -->
    <div v-if="paginated && totalItems > 0" class="custom-table__pagination">
      <CustomPagination
        :current-page="activeCurrentPage"
        :page-size="activePageSize"
        :total-items="totalItems"
        :page-size-options="pageSizeOptions"
        :size="size"
        :disabled="disabled"
        @update:current-page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T = any">
import { ref, computed, watch } from 'vue';
import type { TableProps, TableColumn } from '@/types/components';
import { getSizeClass } from '@/utils/size';
import CustomButton from '@/components/CustomButton.vue';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import CustomPagination from '@/components/CustomPagination.vue';

const props = withDefaults(defineProps<TableProps<T>>(), {
  variant: 'default',
  size: 'md',
  hoverable: true,
  emptyText: '데이터가 없습니다.',
  loading: false,
  loadingText: '데이터를 불러오는 중입니다...',
  stickyHeader: false,
  rowKey: undefined,
  selectable: false,
  selectionType: 'checkbox',
  selectedKeys: () => [],
  paginated: false,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  currentPage: 1,
  total: undefined,
  manualPagination: false,
  expandable: false,
  expandedKeys: () => [],
  showSummary: false,
  summaryText: '합계',
  cardOnMobile: false
});

const emit = defineEmits<{
  (e: 'update:selectedKeys', keys: (string | number)[]): void;
  (e: 'selectionChange', selectedRows: T[], keys: (string | number)[]): void;
  (e: 'update:currentPage', page: number): void;
  (e: 'pageChange', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'pageSizeChange', size: number): void;
  (e: 'update:expandedKeys', keys: (string | number)[]): void;
  (e: 'sortChange', payload: { key: string; order: 'asc' | 'desc' | null }): void;
  (e: 'rowClick', row: T, index: number, event: MouseEvent): void;
}>();

const radioGroupName = `table-radio-${Math.random().toString(36).substring(2, 9)}`;

// Row Key Resolver
const getRowKey = (row: T, index: number): string | number => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index);
  }
  const record = row as Record<string, unknown>;
  if (props.rowKey && record[props.rowKey as string] !== undefined) {
    return record[props.rowKey as string] as string | number;
  }
  if (record?.id !== undefined && record?.id !== null) {
    return record.id as string | number;
  }
  return index;
};

// Sort State
const sortState = ref<{ key: string; order: 'asc' | 'desc' | null }>({
  key: '',
  order: null
});

const handleSort = (col: TableColumn<T>) => {
  if (sortState.value.key === col.key) {
    if (sortState.value.order === 'asc') {
      sortState.value.order = 'desc';
    } else if (sortState.value.order === 'desc') {
      sortState.value.key = '';
      sortState.value.order = null;
    } else {
      sortState.value.order = 'asc';
    }
  } else {
    sortState.value.key = col.key;
    sortState.value.order = 'asc';
  }

  emit('sortChange', { ...sortState.value });
};

// Raw & Formatted Values
const getRawValue = (row: T, key: string): unknown => {
  return (row as Record<string, unknown>)[key];
};

const getFormattedValue = (col: TableColumn<T>, row: T, index: number) => {
  const val = getRawValue(row, col.key);
  if (col.formatter) {
    return col.formatter(val, row, index);
  }
  return val ?? '';
};

// Client-side Sorted Data
const sortedData = computed<T[]>(() => {
  if (!props.data || props.data.length === 0) return [];
  if (props.manualPagination || !sortState.value.key || !sortState.value.order) {
    return props.data;
  }

  const { key, order } = sortState.value;
  return [...props.data].sort((a, b) => {
    const valA = getRawValue(a, key);
    const valB = getRawValue(b, key);

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let res = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      res = valA - valB;
    } else {
      res = String(valA).localeCompare(String(valB), 'ko-KR', { numeric: true });
    }
    return order === 'asc' ? res : -res;
  });
});

// Pagination Sync
const activeCurrentPage = ref(props.currentPage || 1);
const activePageSize = ref(props.pageSize || 10);

watch(
  () => props.currentPage,
  (val) => {
    if (val && val !== activeCurrentPage.value) {
      activeCurrentPage.value = val;
    }
  }
);

watch(
  () => props.pageSize,
  (val) => {
    if (val && val !== activePageSize.value) {
      activePageSize.value = val;
    }
  }
);

const totalItems = computed<number>(() => {
  if (props.total !== undefined && props.total !== null) {
    return props.total;
  }
  return props.data ? props.data.length : 0;
});

// Processed Display Data (Pagination applied client-side if not manual)
const displayData = computed<T[]>(() => {
  if (props.paginated && !props.manualPagination) {
    const start = (activeCurrentPage.value - 1) * activePageSize.value;
    const end = start + activePageSize.value;
    return sortedData.value.slice(start, end);
  }
  return sortedData.value;
});

const handlePageChange = (page: number) => {
  activeCurrentPage.value = page;
  emit('update:currentPage', page);
  emit('pageChange', page);
};

const handlePageSizeChange = (size: number) => {
  activePageSize.value = size;
  activeCurrentPage.value = 1;
  emit('update:pageSize', size);
  emit('pageSizeChange', size);
  emit('update:currentPage', 1);
  emit('pageChange', 1);
};

// Selection logic
const internalSelectedKeys = ref<(string | number)[]>([...props.selectedKeys]);

watch(
  () => props.selectedKeys,
  (val) => {
    internalSelectedKeys.value = [...(val || [])];
  },
  { deep: true }
);

const isRowSelected = (key: string | number) => {
  if (!props.selectable) return false;
  return internalSelectedKeys.value.includes(key);
};

const toggleRowSelection = (row: T, index: number) => {
  const key = getRowKey(row, index);
  let updated: (string | number)[] = [];

  if (props.selectionType === 'radio') {
    updated = [key];
  } else {
    if (isRowSelected(key)) {
      updated = internalSelectedKeys.value.filter((k) => k !== key);
    } else {
      updated = [...internalSelectedKeys.value, key];
    }
  }

  internalSelectedKeys.value = updated;
  emit('update:selectedKeys', updated);

  const selectedRows = props.data.filter((r, idx) => updated.includes(getRowKey(r, idx)));
  emit('selectionChange', selectedRows, updated);
};

const visibleKeys = computed(() => displayData.value.map((row, idx) => getRowKey(row, idx)));

const isAllSelected = computed(() => {
  if (!visibleKeys.value.length) return false;
  return visibleKeys.value.every((key) => internalSelectedKeys.value.includes(key));
});

const isIndeterminate = computed(() => {
  if (!visibleKeys.value.length) return false;
  const count = visibleKeys.value.filter((key) => internalSelectedKeys.value.includes(key)).length;
  return count > 0 && count < visibleKeys.value.length;
});

const toggleSelectAll = () => {
  let updated: (string | number)[] = [];

  if (isAllSelected.value) {
    updated = internalSelectedKeys.value.filter((k) => !visibleKeys.value.includes(k));
  } else {
    const toAdd = visibleKeys.value.filter((k) => !internalSelectedKeys.value.includes(k));
    updated = [...internalSelectedKeys.value, ...toAdd];
  }

  internalSelectedKeys.value = updated;
  emit('update:selectedKeys', updated);

  const selectedRows = props.data.filter((r, idx) => updated.includes(getRowKey(r, idx)));
  emit('selectionChange', selectedRows, updated);
};

// Expandable logic
const internalExpandedKeys = ref<(string | number)[]>([...props.expandedKeys]);

watch(
  () => props.expandedKeys,
  (val) => {
    internalExpandedKeys.value = [...(val || [])];
  },
  { deep: true }
);

const isRowExpanded = (key: string | number) => {
  if (!props.expandable) return false;
  return internalExpandedKeys.value.includes(key);
};

const toggleRowExpand = (row: T, index: number) => {
  const key = getRowKey(row, index);
  let updated: (string | number)[] = [];

  if (isRowExpanded(key)) {
    updated = internalExpandedKeys.value.filter((k) => k !== key);
  } else {
    updated = [...internalExpandedKeys.value, key];
  }

  internalExpandedKeys.value = updated;
  emit('update:expandedKeys', updated);
};

// Row click handler
const onRowClick = (row: T, index: number, event: MouseEvent) => {
  emit('rowClick', row, index, event);
};

// Total ColSpan calculation
const totalColSpan = computed(() => {
  let span = props.columns.length;
  if (props.expandable) span += 1;
  if (props.selectable) span += 1;
  return span;
});

// Summary calculations
const summaryValues = computed<Record<string, string | number>>(() => {
  const res: Record<string, string | number> = {};
  if (!props.showSummary || !props.data.length) return res;

  props.columns.forEach((col) => {
    if (!col.summary) return;

    const values = props.data.map((r) => getRawValue(r, col.key));
    if (typeof col.summary === 'function') {
      res[col.key] = col.summary(values);
      return;
    }

    if (col.summary === 'sum') {
      const sum = values.reduce<number>((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      res[col.key] = Number.isInteger(sum) ? sum : sum.toFixed(2);
    } else if (col.summary === 'avg') {
      const numVals = values.filter((val) => typeof val === 'number') as number[];
      if (!numVals.length) {
        res[col.key] = 0;
      } else {
        const avg = numVals.reduce<number>((acc, val) => acc + val, 0) / numVals.length;
        res[col.key] = Number.isInteger(avg) ? avg : avg.toFixed(2);
      }
    } else if (col.summary === 'count') {
      res[col.key] = values.filter((v) => v !== null && v !== undefined && v !== '').length;
    }
  });

  return res;
});
</script>
