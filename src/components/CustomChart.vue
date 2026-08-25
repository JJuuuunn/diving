<template>
  <div
    class="custom-chart-container"
    :class="[
      `custom-chart-container--${variant}`,
      getSizeClass('custom-chart-container', size),
      { 'is-loading': loading }
    ]"
    role="region"
    :aria-label="computedAriaLabel"
  >
    <!-- Chart Header & Toolbar -->
    <header
      v-if="hasHeader"
      class="custom-chart__header"
    >
      <slot name="header">
        <div class="header-titles">
          <slot name="title">
            <h3 v-if="title" class="chart-title">{{ title }}</h3>
          </slot>
          <slot name="subtitle">
            <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
          </slot>
        </div>

        <div class="custom-chart__toolbar">
          <slot name="toolbar">
            <!-- Table View Toggle Button -->
            <CustomButton
              v-if="showTableToggle && !loading && !isEmpty"
              size="xs"
              variant="ghost"
              :aria-label="activeView === 'chart' ? '데이터 표 형태로 보기' : '차트 형태로 보기'"
              :title="activeView === 'chart' ? '데이터 표 보기' : '차트 보기'"
              @click="toggleActiveView"
            >
              <i
                class="fa-solid"
                :class="activeView === 'chart' ? 'fa-table' : 'fa-chart-simple'"
                aria-hidden="true"
              ></i>
              <span>{{ activeView === 'chart' ? '표 보기' : '차트 보기' }}</span>
            </CustomButton>

            <!-- Image Download Button -->
            <CustomButton
              v-if="downloadable && !loading && !isEmpty && activeView === 'chart'"
              size="xs"
              variant="ghost"
              aria-label="차트 이미지(PNG) 다운로드"
              title="차트 이미지 다운로드"
              @click="downloadChartImage"
            >
              <i class="fa-solid fa-download" aria-hidden="true"></i>
              <span>다운로드</span>
            </CustomButton>
          </slot>
        </div>
      </slot>
    </header>

    <!-- Chart Main Body -->
    <div class="custom-chart__body">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="custom-chart__loading"
        role="status"
        :style="{ height: parsedHeight }"
      >
        <slot name="loading">
          <CustomSkeleton type="card" :size="size" class="chart-skeleton-placeholder" />
          <span>{{ loadingText }}</span>
        </slot>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="isEmpty"
        class="custom-chart__empty"
        :style="{ height: parsedHeight }"
      >
        <slot name="empty">
          <i class="fa-solid fa-chart-pie fa-2x" aria-hidden="true"></i>
          <p>{{ emptyText }}</p>
        </slot>
      </div>

      <!-- Accessible Table Alternative View -->
      <div
        v-else-if="activeView === 'table'"
        class="custom-chart__table-view"
      >
        <CustomTable
          :columns="tableData.columns"
          :data="tableData.rows"
          :size="size"
          :variant="variant === 'glass' ? 'glass' : 'striped'"
          hoverable
        />
      </div>

      <!-- Canvas Chart View -->
      <div
        v-show="!loading && !isEmpty && activeView === 'chart'"
        class="custom-chart-canvas-wrapper"
        :style="{ height: parsedHeight }"
      >
        <canvas
          ref="canvasRef"
          role="img"
          :aria-label="computedAriaLabel"
          @click="handleCanvasClick"
          @mouseleave="handleCanvasMouseLeave"
        ></canvas>

        <!-- Hidden Accessible Screen-Reader Table -->
        <table
          v-if="srTable && tableData.columns.length > 0"
          class="sr-only"
        >
          <caption>{{ title || '차트 데이터 요약' }}</caption>
          <thead>
            <tr>
              <th
                v-for="col in tableData.columns"
                :key="col.key"
                scope="col"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rIdx) in tableData.rows"
              :key="rIdx"
            >
              <td
                v-for="col in tableData.columns"
                :key="col.key"
              >
                {{ row[col.key] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, useSlots } from 'vue';
import { Chart as ChartJS, type ChartEvent, type ActiveElement } from 'chart.js';
import type { CustomChartProps, ChartClickPayload, ChartHoverPayload, ChartSimplifiedDataset } from '@/types/chart';
import { getSizeClass } from '@/utils/size';
import { ensureChartRegistered, normalizeChartData, extractTableDataFromChart, formatChartValue } from '@/utils/chart';
import { useChartTheme } from '@/composables/useChartTheme';
import CustomButton from '@/components/CustomButton.vue';
import CustomSkeleton from '@/components/CustomSkeleton.vue';
import CustomTable from '@/components/CustomTable.vue';

const props = withDefaults(defineProps<CustomChartProps>(), {
  type: 'bar',
  variant: 'card',
  size: 'md',
  loading: false,
  loadingText: '차트 데이터를 불러오는 중입니다...',
  empty: false,
  emptyText: '표시할 차트 데이터가 없습니다.',
  srTable: true,
  showTableToggle: false,
  downloadable: false,
  downloadFileName: '',
  aspectRatio: undefined,
  valueFormatter: undefined
});

const emit = defineEmits<{
  (e: 'chartClick', payload: ChartClickPayload): void;
  (e: 'chartHover', payload: ChartHoverPayload | null): void;
}>();

const slots = useSlots();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const hoveredItem = ref<ChartHoverPayload | null>(null);
let chartInstance: ChartJS | null = null;

const { currentMode, themeColors, getMergedOptions } = useChartTheme();
const activeView = ref<'chart' | 'table'>('chart');

const hasHeader = computed(() => {
  return (
    !!props.title ||
    !!props.subtitle ||
    props.showTableToggle ||
    props.downloadable ||
    !!slots.header ||
    !!slots.title ||
    !!slots.toolbar
  );
});

const parsedHeight = computed(() => {
  if (props.height === undefined || props.height === null) {
    return undefined;
  }
  if (typeof props.height === 'number') {
    return `${props.height}px`;
  }
  return props.height;
});

const computedAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;
  if (props.title) return `${props.title} ${props.type} 차트`;
  return `${props.type} 차트 데이터 시각화`;
});

const normalizedData = computed(() => {
  return normalizeChartData(props, currentMode.value);
});

const isEmpty = computed(() => {
  if (props.empty) return true;
  const datasets = normalizedData.value.datasets;
  if (!datasets || datasets.length === 0) return true;
  return datasets.every((ds) => !ds.data || ds.data.length === 0);
});

const tableData = computed(() => {
  return extractTableDataFromChart(normalizedData.value, props.unit, props.valueFormatter);
});

const toggleActiveView = () => {
  activeView.value = activeView.value === 'chart' ? 'table' : 'chart';
  if (activeView.value === 'chart') {
    nextTick(() => {
      initOrUpdateChart();
    });
  }
};

const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
};

const handleChartHoverEvent = (event: ChartEvent, elements: ActiveElement[]) => {
  if (event.native?.target && event.native.target instanceof HTMLElement) {
    event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
  }

  if (elements && elements.length > 0) {
    const el = elements[0];
    const datasetIndex = el.datasetIndex;
    const index = el.index;
    const dataset = normalizedData.value.datasets[datasetIndex];
    const label = (normalizedData.value.labels?.[index] as string) || '';
    const value = Array.isArray(dataset?.data) ? dataset.data[index] : undefined;

    const payload: ChartHoverPayload = {
      index,
      datasetIndex,
      label,
      value,
      dataset: dataset as ChartSimplifiedDataset,
      event: event.native || event
    };

    hoveredItem.value = payload;
    emit('chartHover', payload);
  } else {
    if (hoveredItem.value !== null) {
      hoveredItem.value = null;
      emit('chartHover', null);
    }
  }
};

const handleCanvasMouseLeave = () => {
  if (hoveredItem.value !== null) {
    hoveredItem.value = null;
    emit('chartHover', null);
  }
};

const buildChartOptions = () => {
  const mergedOptions = getMergedOptions(
    props.type,
    props.options,
    props.unit,
    props.valueFormatter,
    props.animationDuration
  );

  return {
    ...mergedOptions,
    onHover: (event: ChartEvent, elements: ActiveElement[]) => {
      handleChartHoverEvent(event, elements);
    }
  };
};

const createChart = () => {
  if (!canvasRef.value) return;
  destroyChart();
  ensureChartRegistered();

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  chartInstance = new ChartJS(ctx, {
    type: props.type,
    data: normalizedData.value,
    options: buildChartOptions()
  });
};

const initOrUpdateChart = () => {
  if (props.loading || isEmpty.value || activeView.value !== 'chart') {
    destroyChart();
    return;
  }

  if (!chartInstance) {
    createChart();
    return;
  }

  // 차트 타입이 변경되었을 경우 인스턴스 재생성
  if ((chartInstance.config as { type: string }).type !== props.type) {
    createChart();
    return;
  }

  // 기존 차트 인스턴스 데이터 및 옵션 갱신
  chartInstance.data = normalizedData.value;
  chartInstance.options = buildChartOptions();
  chartInstance.update();
};

const handleCanvasClick = (event: MouseEvent) => {
  if (!chartInstance) return;
  const elements = chartInstance.getElementsAtEventForMode(
    event,
    'nearest',
    { intersect: true },
    true
  );

  if (elements && elements.length > 0) {
    const el = elements[0];
    const datasetIndex = el.datasetIndex;
    const index = el.index;
    const dataset = normalizedData.value.datasets[datasetIndex];
    const label = (normalizedData.value.labels?.[index] as string) || '';
    const value = Array.isArray(dataset?.data) ? dataset.data[index] : undefined;

    emit('chartClick', {
      index,
      datasetIndex,
      label,
      value,
      dataset: dataset as ChartSimplifiedDataset,
      event
    });
  }
};

const downloadChartImage = () => {
  if (!chartInstance) return;
  const dataUrl = chartInstance.toBase64Image('image/png', 1);
  const fileName = props.downloadFileName || `${props.title ? props.title.replace(/\s+/g, '_') : 'chart'}_${Date.now()}.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  nextTick(() => {
    initOrUpdateChart();
  });
});

onBeforeUnmount(() => {
  destroyChart();
});

watch(
  () => [
    props.type,
    props.data,
    props.labels,
    props.values,
    props.datasets,
    props.options,
    props.loading,
    props.empty,
    props.unit,
    props.valueFormatter,
    themeColors.value
  ],
  () => {
    nextTick(() => {
      initOrUpdateChart();
    });
  },
  { deep: true }
);

defineExpose({
  chartInstance: computed(() => chartInstance),
  downloadImage: downloadChartImage,
  toggleView: toggleActiveView,
  hoveredItem: computed(() => hoveredItem.value)
});
</script>
