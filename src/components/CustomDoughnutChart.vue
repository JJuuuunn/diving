<template>
  <CustomChart
    type="doughnut"
    v-bind="$attrs"
    :title="title"
    :subtitle="subtitle"
    :labels="labels"
    :values="values"
    :series-name="seriesName"
    :datasets="datasets"
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
import type { CustomDoughnutChartProps, ChartClickPayload, ChartHoverPayload } from '@/types/chart';
import CustomChart from '@/components/CustomChart.vue';

const props = withDefaults(defineProps<CustomDoughnutChartProps>(), {
  variant: 'card',
  size: 'md',
  cutout: '60%',
  rotation: 0,
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

const computedOptions = computed(() => {
  const opts: any = { ...(props.options || {}) };
  if (props.cutout !== undefined) {
    opts.cutout = props.cutout;
  }
  if (props.rotation !== undefined) {
    opts.rotation = props.rotation;
  }
  return opts;
});
</script>
