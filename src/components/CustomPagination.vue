<template>
  <nav
    class="custom-pagination-container"
    :class="[
      `custom-pagination-container--${variant}`,
      getSizeClass('custom-pagination', size),
      {
        'is-compact': compact,
        'is-disabled': disabled
      }
    ]"
    role="navigation"
    aria-label="페이지 이동 네비게이션"
  >
    <!-- 1. 좌측 정보 영역 (전체 항목 수 / 현재 범위) -->
    <div v-if="showTotal" class="custom-pagination__total">
      <slot name="total" :total="totalItemsCount" :start="startItemIndex" :end="endItemIndex">
        <span class="custom-pagination__total-text">
          총 <strong>{{ totalItemsCount }}</strong>건
          <span v-if="totalItemsCount > 0" class="custom-pagination__range">
            ({{ startItemIndex }}-{{ endItemIndex }}건)
          </span>
        </span>
      </slot>
    </div>

    <!-- 2. 중앙 페이지 버튼 네비게이션 -->
    <div class="custom-pagination__nav">
      <!-- 2-1. 모바일 / 축소 모드 (Compact Mode) -->
      <template v-if="compact">
        <CustomButton
          size="xs"
          variant="outline"
          :disabled="disabled || activePage <= 1"
          aria-label="이전 페이지"
          @click="changePage(activePage - 1)"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </CustomButton>

        <span class="custom-pagination__compact-info" aria-live="polite">
          <strong>{{ activePage }}</strong> / {{ totalPagesCount }}
        </span>

        <CustomButton
          size="xs"
          variant="outline"
          :disabled="disabled || activePage >= totalPagesCount"
          aria-label="다음 페이지"
          @click="changePage(activePage + 1)"
        >
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </CustomButton>
      </template>

      <!-- 2-2. 일반 수치 버튼 모드 (Full Mode) -->
      <template v-else>
        <!-- 맨 처음으로 이동 -->
        <CustomButton
          v-if="showFirstLast"
          size="xs"
          variant="outline"
          :disabled="disabled || activePage <= 1"
          aria-label="첫 페이지로 이동"
          @click="changePage(1)"
        >
          <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
        </CustomButton>

        <!-- 이전 페이지로 이동 -->
        <CustomButton
          size="xs"
          variant="outline"
          :disabled="disabled || activePage <= 1"
          aria-label="이전 페이지로 이동"
          @click="changePage(activePage - 1)"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </CustomButton>

        <!-- 번호 버튼 목록 -->
        <div class="custom-pagination__pages" role="list">
          <template v-for="(p, idx) in pageList" :key="idx">
            <span v-if="p === '...'" class="custom-pagination__ellipsis" role="listitem">...</span>
            <CustomButton
              v-else
              size="xs"
              :variant="activePage === p ? 'primary' : 'outline'"
              class="custom-pagination__page-btn"
              :class="{ 'is-active': activePage === p }"
              :disabled="disabled"
              :aria-label="`${p} 페이지`"
              :aria-current="activePage === p ? 'page' : undefined"
              role="listitem"
              @click="changePage(Number(p))"
            >
              {{ p }}
            </CustomButton>
          </template>
        </div>

        <!-- 다음 페이지로 이동 -->
        <CustomButton
          size="xs"
          variant="outline"
          :disabled="disabled || activePage >= totalPagesCount"
          aria-label="다음 페이지로 이동"
          @click="changePage(activePage + 1)"
        >
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </CustomButton>

        <!-- 맨 끝으로 이동 -->
        <CustomButton
          v-if="showFirstLast"
          size="xs"
          variant="outline"
          :disabled="disabled || activePage >= totalPagesCount"
          aria-label="마지막 페이지로 이동"
          @click="changePage(totalPagesCount)"
        >
          <i class="fa-solid fa-angles-right" aria-hidden="true"></i>
        </CustomButton>
      </template>
    </div>

    <!-- 3. 우측 컨트롤 영역 (페이지당 개수 변경 & Quick Jumper) -->
    <div v-if="(showPageSize && pageSizeOptions && pageSizeOptions.length > 1) || showQuickJumper" class="custom-pagination__controls">
      <!-- 페이지 당 개수 셀렉트/칩 -->
      <div v-if="showPageSize && pageSizeOptions && pageSizeOptions.length > 1" class="custom-pagination__page-size">
        <CustomButton
          v-for="opt in pageSizeOptions"
          :key="opt"
          size="xs"
          :variant="currentPageSize === opt ? 'primary' : 'ghost'"
          :disabled="disabled"
          :aria-label="`페이지당 ${opt}개씩 보기`"
          @click="changePageSize(opt)"
        >
          {{ opt }}개씩
        </CustomButton>
      </div>

      <!-- Quick Jumper (페이지 직접 이동) -->
      <div v-if="showQuickJumper" class="custom-pagination__jumper">
        <label :for="jumperInputId" class="sr-only">이동할 페이지 번호</label>
        <input
          :id="jumperInputId"
          v-model="jumperInputValue"
          type="number"
          min="1"
          :max="totalPagesCount"
          aria-valuemin="1"
          :aria-valuemax="totalPagesCount"
          class="custom-pagination__jumper-input"
          :disabled="disabled"
          placeholder="페이지"
          @keydown.enter="handleJumperSubmit"
          @blur="handleJumperSubmit"
        />
        <span class="custom-pagination__jumper-text">/ {{ totalPagesCount }}페이지</span>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PaginationProps } from '@/types/components';
import { getSizeClass } from '@/utils/size';
import CustomButton from '@/components/CustomButton.vue';

const props = withDefaults(defineProps<PaginationProps>(), {
  variant: 'default',
  size: 'md',
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  maxPageButtons: 7,
  showTotal: true,
  showPageSize: true,
  showQuickJumper: false,
  showFirstLast: true,
  compact: false,
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
  (e: 'pageChange', page: number): void;
  (e: 'update:pageSize', size: number): void;
  (e: 'pageSizeChange', size: number): void;
}>();

const jumperInputId = `pagination-jumper-${Math.random().toString(36).substring(2, 9)}`;
const jumperInputValue = ref('');

const activePage = ref(props.currentPage || 1);
const currentPageSize = ref(Math.max(1, props.pageSize || 10));

watch(() => props.currentPage, (val) => {
  if (typeof val === 'number' && val >= 1 && val !== activePage.value) {
    activePage.value = val;
  }
});

watch(() => props.pageSize, (val) => {
  if (typeof val === 'number' && val >= 1 && val !== currentPageSize.value) {
    currentPageSize.value = val;
  }
});

const totalItemsCount = computed(() => {
  return Math.max(0, props.totalItems || 0);
});

const totalPagesCount = computed(() => {
  if (props.totalItems && props.totalItems > 0) {
    return Math.ceil(props.totalItems / currentPageSize.value);
  }
  return 1;
});

watch(totalPagesCount, (newTotalPages) => {
  if (activePage.value > newTotalPages && newTotalPages > 0) {
    activePage.value = newTotalPages;
    emit('update:currentPage', newTotalPages);
    emit('pageChange', newTotalPages);
  }
});

const startItemIndex = computed(() => {
  if (totalItemsCount.value === 0) return 0;
  return (activePage.value - 1) * currentPageSize.value + 1;
});

const endItemIndex = computed(() => {
  if (totalItemsCount.value === 0) return 0;
  return Math.min(activePage.value * currentPageSize.value, totalItemsCount.value);
});

const pageList = computed<(number | string)[]>(() => {
  const total = totalPagesCount.value;
  const current = activePage.value;
  const maxButtons = Math.max(5, props.maxPageButtons);

  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  pages.push(1);

  const half = Math.floor((maxButtons - 3) / 2);
  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (current <= half + 2) {
    end = Math.min(total - 1, maxButtons - 2);
  } else if (current >= total - half - 1) {
    start = Math.max(2, total - (maxButtons - 3));
  }

  if (start > 2) {
    pages.push('...');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < total - 1) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
});

const changePage = (page: number) => {
  if (props.disabled) return;
  if (page < 1 || page > totalPagesCount.value) return;
  activePage.value = page;
  emit('update:currentPage', page);
  emit('pageChange', page);
};

const changePageSize = (size: number) => {
  if (props.disabled) return;
  currentPageSize.value = size;
  activePage.value = 1;
  emit('update:pageSize', size);
  emit('pageSizeChange', size);
  emit('update:currentPage', 1);
  emit('pageChange', 1);
};

const handleJumperSubmit = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target || !target.value) return;

  const page = parseInt(target.value, 10);
  if (!isNaN(page) && page >= 1 && page <= totalPagesCount.value) {
    changePage(page);
  }
  target.value = '';
};
</script>
