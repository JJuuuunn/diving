<template>
  <CustomChart
    type="bar"
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
import type { CustomBarChartProps, ChartClickPayload, ChartHoverPayload } from '@/types/chart';
import CustomChart from '@/components/CustomChart.vue';

const props = withDefaults(defineProps<CustomBarChartProps>(), {
  variant: 'card',
  size: 'md',
  horizontal: false,
  stacked: false,
  borderRadius: 6,
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
    borderRadius: ds.borderRadius ?? props.borderRadius
  }));
});

const computedOptions = computed(() => {
  const opts: any = { ...(props.options || {}) };

  if (props.horizontal) {
    opts.indexAxis = 'y';
  }

  if (props.stacked) {
    opts.scales = {
      ...(opts.scales || {}),
      x: { ...(opts.scales?.x || {}), stacked: true },
      y: { ...(opts.scales?.y || {}), stacked: true }
    };
  }

  if (props.borderRadius !== undefined) {
    opts.elements = {
      ...(opts.elements || {}),
      bar: {
        borderRadius: props.borderRadius,
        ...(opts.elements?.bar || {})
      }
    };
  }

  return opts;
});
</script>
