import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  SubTitle
} from 'chart.js';
import type { ChartData, ChartDataset } from 'chart.js';
import type { BaseChartProps, ChartType } from '@/types/chart';
import type { ThemeMode } from '@/stores/theme';

let isRegistered = false;

/**
 * Chart.js의 필수 모듈 및 플러그인을 멱등하게 전역 등록합니다.
 */
export function ensureChartRegistered(): void {
  if (isRegistered) return;
  ChartJS.register(
    Title,
    SubTitle,
    Tooltip,
    Legend,
    Filler,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    BarController,
    LineController,
    PieController,
    DoughnutController,
    RadarController,
    PolarAreaController
  );
  isRegistered = true;
}

export interface SemanticColorDefinition {
  solid: string;
  alpha: (opacity: number) => string;
}

/**
 * 테마 모드별 시각화 최적화 다이빙 팔레트를 반환합니다.
 * 인접한 시리즈 간 높은 대비(Blue vs Pink vs Green vs Gold vs Violet)를 보장합니다.
 */
export function getThemeColorPalette(themeMode: ThemeMode = 'light'): string[] {
  switch (themeMode) {
    case 'abyss':
      return [
        '#00f2fe', // Luminescent Aqua
        '#ff007f', // Hot Pink
        '#00f5d4', // Neon Mint
        '#fee440', // Deep Sun Gold
        '#7000ff', // Ultraviolet
        '#4facfe', // Electric Cyan
        '#9b5de5'  // Plasma Purple
      ];
    case 'coral':
      return [
        '#ff6b81', // Coral Pink
        '#1e90ff', // Marine Blue
        '#2ed573', // Reef Green
        '#ffa502', // Sun Gold
        '#9c88ff', // Lilac Anemone
        '#00d2d3', // Tropical Teal
        '#ff4757'  // Deep Crimson
      ];
    case 'dark':
      return [
        '#38bdf8', // Ocean Sky Blue
        '#fb7185', // Coral Rose Pink
        '#34d399', // Emerald Mint Green
        '#fbbf24', // Warm Amber Gold
        '#a78bfa', // Electric Violet
        '#22d3ee', // Bright Turquoise
        '#f43f5e'  // Deep Ruby
      ];
    case 'light':
    default:
      return [
        '#0284c7', // Ocean Blue
        '#f43f5e', // Coral Rose
        '#10b981', // Emerald Green
        '#f59e0b', // Amber Gold
        '#8b5cf6', // Violet Purple
        '#06b6d4', // Cyan
        '#ec4899'  // Pink
      ];
  }
}

/**
 * HEX 색상을 RGBA 문자열로 변환합니다.
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

import { formatDuration } from './formatter.ts';
export { formatDuration };

/**
 * 차트 축 및 툴팁에 표시할 데이터 값을 단위 및 커스텀 포맷터와 함께 변환합니다.
 */
export function formatChartValue(
  val: unknown,
  unit?: string,
  valueFormatter?: (val: any) => string
): string {
  if (val === null || val === undefined) return '';
  if (valueFormatter) {
    return valueFormatter(val);
  }
  if (typeof val === 'number') {
    const formattedNum = Number.isInteger(val) ? String(val) : val.toFixed(1);
    return unit ? `${formattedNum}${unit}` : formattedNum;
  }
  return unit ? `${val}${unit}` : String(val);
}

/**
 * 도넛/파이 차트의 슬라이스 구분 테두리 기본 색상을 테마에 맞추어 반환합니다.
 */
function getSliceBorderColor(themeMode: ThemeMode): string {
  switch (themeMode) {
    case 'abyss':
      return '#030712';
    case 'dark':
      return '#0f172a';
    case 'coral':
      return '#fff1f2';
    case 'light':
    default:
      return '#ffffff';
  }
}

/**
 * 전달받은 BaseChartProps를 표준 Chart.js ChartData 객체로 정규화합니다.
 * 호버 인터랙션(hoverOffset, hoverBackgroundColor, pointHoverRadius 등)을 자동 주입합니다.
 */
export function normalizeChartData(
  props: BaseChartProps & { type?: ChartType },
  themeMode: ThemeMode = 'light'
): ChartData {
  const palette = getThemeColorPalette(themeMode);
  const sliceBorder = getSliceBorderColor(themeMode);
  const isPieFamily = props.type === 'pie' || props.type === 'doughnut' || props.type === 'polarArea';

  // 1. 원본 data prop이 전달된 경우
  if (props.data) {
    const rawData = props.data;

    const datasets = (rawData.datasets || []).map((ds, idx) => {
      const color = palette[idx % palette.length];
      const count = (rawData.labels || []).length || (Array.isArray(ds.data) ? ds.data.length : 1);

      let bg = ds.backgroundColor;
      let border = ds.borderColor;

      if (!bg) {
        if (isPieFamily) {
          bg = Array.from({ length: count }, (_, i) => hexToRgba(palette[i % palette.length], 0.9));
        } else if (props.type === 'line' || props.type === 'radar') {
          bg = hexToRgba(color, 0.22);
        } else {
          bg = hexToRgba(color, 0.88);
        }
      }

      if (!border) {
        if (isPieFamily) {
          border = Array.from({ length: count }, () => sliceBorder);
        } else {
          border = color;
        }
      }

      return {
        ...ds,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: ds.borderWidth ?? (isPieFamily ? 2 : props.type === 'line' ? 2.5 : 1.5),
        hoverOffset: ds.hoverOffset ?? (isPieFamily ? 8 : undefined),
        hoverBorderColor: ds.hoverBorderColor ?? '#ffffff',
        hoverBorderWidth: ds.hoverBorderWidth ?? (isPieFamily ? 2 : 2),
        pointRadius: ds.pointRadius ?? 4,
        pointHoverRadius: ds.pointHoverRadius ?? 7,
        pointBackgroundColor: ds.pointBackgroundColor ?? color,
        pointHoverBackgroundColor: ds.pointHoverBackgroundColor ?? '#ffffff',
        pointHoverBorderColor: ds.pointHoverBorderColor ?? color,
        pointHoverBorderWidth: ds.pointHoverBorderWidth ?? 3,
        borderRadius: ds.borderRadius ?? (props.type === 'bar' ? 6 : undefined)
      };
    });

    return {
      labels: rawData.labels || [],
      datasets: datasets as ChartDataset[]
    };
  }

  const labels = props.labels || [];

  // 2. 단일 values 배열로 넘긴 경우
  if (props.values && Array.isArray(props.values)) {
    const color = palette[0];
    const bgColors = isPieFamily
      ? props.values.map((_, i) => hexToRgba(palette[i % palette.length], 0.9))
      : props.type === 'line' || props.type === 'radar'
      ? hexToRgba(color, 0.22)
      : hexToRgba(color, 0.88);

    const borderColors = isPieFamily
      ? props.values.map(() => sliceBorder)
      : color;

    return {
      labels,
      datasets: [
        {
          label: props.seriesName || props.title || '데이터',
          data: props.values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: isPieFamily ? 2 : props.type === 'line' ? 2.5 : 1.5,
          fill: props.type === 'line' || props.type === 'radar' ? true : false,
          tension: props.type === 'line' ? 0.35 : 0,
          hoverOffset: isPieFamily ? 8 : undefined,
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: color,
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: color,
          pointHoverBorderWidth: 3,
          borderRadius: props.type === 'bar' ? 6 : undefined
        }
      ]
    };
  }

  // 3. 다중 datasets 배열로 넘긴 경우
  if (props.datasets && Array.isArray(props.datasets)) {
    const formattedDatasets = props.datasets.map((ds, idx) => {
      const color = palette[idx % palette.length];
      const count = labels.length || ds.data.length;

      let bg = ds.backgroundColor;
      let border = ds.borderColor;

      if (!bg) {
        if (isPieFamily) {
          bg = Array.from({ length: count }, (_, i) => hexToRgba(palette[i % palette.length], 0.9));
        } else if (props.type === 'line' || props.type === 'radar') {
          bg = hexToRgba(color, 0.22);
        } else {
          bg = hexToRgba(color, 0.88);
        }
      }

      if (!border) {
        if (isPieFamily) {
          border = Array.from({ length: count }, () => sliceBorder);
        } else {
          border = color;
        }
      }

      return {
        ...ds,
        backgroundColor: bg,
        borderColor: border,
        borderWidth: ds.borderWidth ?? (isPieFamily ? 2 : props.type === 'line' ? 2.5 : 1.5),
        fill: ds.fill ?? (props.type === 'radar' ? true : false),
        tension: ds.tension ?? (props.type === 'line' ? 0.35 : 0),
        hoverOffset: ds.hoverOffset ?? (isPieFamily ? 8 : undefined),
        hoverBorderColor: ds.hoverBorderColor ?? '#ffffff',
        hoverBorderWidth: ds.hoverBorderWidth ?? 2,
        pointRadius: ds.pointRadius ?? 4,
        pointHoverRadius: ds.pointHoverRadius ?? 7,
        pointBackgroundColor: ds.pointBackgroundColor ?? color,
        pointHoverBackgroundColor: ds.pointHoverBackgroundColor ?? '#ffffff',
        pointHoverBorderColor: ds.pointHoverBorderColor ?? color,
        pointHoverBorderWidth: ds.pointHoverBorderWidth ?? 3,
        borderRadius: ds.borderRadius ?? (props.type === 'bar' ? 6 : undefined)
      };
    });

    return {
      labels,
      datasets: formattedDatasets as ChartDataset[]
    };
  }

  return {
    labels: [],
    datasets: []
  };
}

export interface ChartTableData {
  columns: { key: string; label: string; align?: 'left' | 'center' | 'right' }[];
  rows: Record<string, any>[];
}

/**
 * ChartData로부터 접근성 데이터 테이블(CustomTable)을 생성하기 위한 행/열을 추출합니다.
 */
export function extractTableDataFromChart(
  chartData: ChartData,
  unit?: string,
  valueFormatter?: (val: any) => string
): ChartTableData {
  const labels = (chartData.labels || []) as string[];
  const datasets = chartData.datasets || [];

  if (!labels.length && !datasets.length) {
    return { columns: [], rows: [] };
  }

  const columns: ChartTableData['columns'] = [
    { key: 'label', label: '항목 / 라벨', align: 'left' }
  ];

  datasets.forEach((ds, idx) => {
    columns.push({
      key: `dataset_${idx}`,
      label: ds.label || `시리즈 ${idx + 1}`,
      align: 'right'
    });
  });

  const rows: Record<string, any>[] = labels.map((lbl, rowIdx) => {
    const row: Record<string, any> = { label: lbl };
    datasets.forEach((ds, dsIdx) => {
      const val = Array.isArray(ds.data) ? ds.data[rowIdx] : undefined;
      row[`dataset_${dsIdx}`] = formatChartValue(val, unit, valueFormatter);
    });
    return row;
  });

  return { columns, rows };
}
