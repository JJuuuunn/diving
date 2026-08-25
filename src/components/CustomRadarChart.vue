<template>
  <CustomChart
    type="radar"
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
import type { ChartOptions, RadialLinearScaleOptions } from 'chart.js';
import type { CustomRadarChartProps, ChartClickPayload, ChartHoverPayload } from '@/types/chart';
import CustomChart from '@/components/CustomChart.vue';

const props = withDefaults(defineProps<CustomRadarChartProps>(), {
  variant: 'card',
  size: 'md',
  fill: true,
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
    fill: ds.fill ?? props.fill
  }));
});

const computedOptions = computed<ChartOptions<'radar'>>(() => {
  const opts = { ...(props.options || {}) } as ChartOptions<'radar'>;
  const existingR = (opts.scales?.r || {}) as Partial<RadialLinearScaleOptions>;

  opts.scales = {
    ...opts.scales,
    r: {
      ...existingR,
      ...(props.min !== undefined ? { min: props.min } : {}),
      ...(props.max !== undefined ? { max: props.max } : {}),
      ticks: {
        ...(existingR.ticks || {}),
        showLabelBackdrop: false,
        backdropColor: 'transparent'
      }
    }
  };

  return opts;
});
</script>
