<template>
  <CustomChart
    type="line"
    v-bind="$attrs"
    :title="title"
    :subtitle="subtitle"
    :labels="labels"
    :values="values"
    :series-name="seriesName"
    :datasets="processedDatasets"
    :data="data"
    :options="computedOptions"
    :unit="unit"
    :value-formatter="valueFormatter"
    :height="height"
    :aspect-ratio="aspectRatio"
    :variant="variant"
    :size="size"
    :loading="loading"
    :loading-text="loadingText"
    :empty="empty"
    :empty-text="emptyText"
    :sr-table="srTable"
    :show-table-toggle="showTableToggle"
    :downloadable="downloadable"
    :download-file-name="downloadFileName"
    :aria-label="ariaLabel"
    :animation-duration="animationDuration"
    @chart-click="(payload) => emit('chartClick', payload)"
    @chart-hover="(payload) => emit('chartHover', payload)"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </CustomChart>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CustomLineChartProps, ChartClickPayload, ChartHoverPayload } from '@/types/chart';
import CustomChart from '@/components/CustomChart.vue';

const props = withDefaults(defineProps<CustomLineChartProps>(), {
  variant: 'card',
  size: 'md',
  fill: true,
  tension: 0.35,
  showPoints: true,
  stacked: false,
  loading: false,
  empty: false,
  srTable: true,
  showTableToggle: false,
  downloadable: false,
  valueFormatter: undefined
});

const emit = defineEmits<{
  (e: 'chartClick', payload: ChartClickPayload): void;
  (e: 'chartHover', payload: ChartHoverPayload | null): void;
}>();

const processedDatasets = computed(() => {
  if (!props.datasets) return undefined;
  return props.datasets.map((ds) => ({
    ...ds,
    fill: ds.fill ?? props.fill,
    tension: ds.tension ?? props.tension,
    pointRadius: ds.pointRadius ?? (props.showPoints ? 4 : 0),
    pointHoverRadius: ds.pointHoverRadius ?? (props.showPoints ? 7 : 4)
  }));
});

const computedOptions = computed(() => {
  const opts: any = { ...(props.options || {}) };

  if (props.stacked) {
    opts.scales = {
      ...(opts.scales || {}),
      y: { ...(opts.scales?.y || {}), stacked: true }
    };
  }

  opts.elements = {
    ...(opts.elements || {}),
    line: {
      tension: props.tension,
      ...(opts.elements?.line || {})
    },
    point: {
      radius: props.showPoints ? 4 : 0,
      hoverRadius: props.showPoints ? 7 : 4,
      ...(opts.elements?.point || {})
    }
  };

  return opts;
});
</script>
