import type {
  ChartType as ChartJsType,
  ChartData as ChartJsData,
  ChartOptions as ChartJsOptions,
  ChartDataset as ChartJsDataset,
  ChartEvent
} from 'chart.js';
import type { BaseUIComponentProps, ComponentSize } from './inputs';

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polarArea'
  | 'scatter'
  | 'bubble';

export type ChartVariant = 'default' | 'card' | 'bordered' | 'glass';

export interface ChartSimplifiedDataset<T = number> {
  label: string;
  data: T[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean | string;
  tension?: number;
  borderRadius?: number;
  stack?: string;
  type?: ChartType;
  [key: string]: any;
}

export interface ChartClickPayload {
  index: number;
  datasetIndex: number;
  label: string;
  value: any;
  dataset: ChartSimplifiedDataset | ChartJsDataset;
  event?: MouseEvent | Event | ChartEvent;
}

export interface ChartHoverPayload {
  index: number;
  datasetIndex: number;
  label: string;
  value: any;
  dataset: ChartSimplifiedDataset | ChartJsDataset;
  event?: MouseEvent | Event | ChartEvent;
}

export interface BaseChartProps extends BaseUIComponentProps<ChartVariant> {
  /** 차트 제목 */
  title?: string;
  /** 차트 부제목/설명 */
  subtitle?: string;
  /** X축 또는 카테고리 라벨 목록 */
  labels?: string[];
  /** 단일 시리즈 간편 데이터 값 배열 */
  values?: number[];
  /** 단일 시리즈 라벨 (values와 함께 사용) */
  seriesName?: string;
  /** 다중 데이터셋 간편 정의 */
  datasets?: ChartSimplifiedDataset[];
  /** Chart.js 원본 Data 객체 (passthrough) */
  data?: ChartJsData<any, any, any>;
  /** Chart.js 원본 Options 객체 (passthrough) */
  options?: ChartJsOptions<any>;
  /** 데이터 단위 표시 (예: 'm', '초', '회', '원') */
  unit?: string;
  /** 커스텀 값 포맷터 함수 (예: formatDuration, formatNumber 등) */
  valueFormatter?: (val: any) => string;
  /** 차트 높이 (CSS height 또는 숫자 px) */
  height?: string | number;
  /** 종횡비 (maintainAspectRatio: true 일 때 적용) */
  aspectRatio?: number;
  /** 로딩 상태 여부 */
  loading?: boolean;
  /** 로딩 문구 */
  loadingText?: string;
  /** 데이터 없음 상태 강제 표시 */
  empty?: boolean;
  /** 데이터 없을 때 문구 */
  emptyText?: string;
  /** 스크린 리더용 숨김 테이블 생성 여부 (기본: true) */
  srTable?: boolean;
  /** 사용자가 차트 ↔ 데이터 테이블로 토글할 수 있는 버튼 표시 여부 */
  showTableToggle?: boolean;
  /** 이미지(PNG) 다운로드 버튼 표시 여부 */
  downloadable?: boolean;
  /** 차트 이미지 다운로드 시 기본 파일명 */
  downloadFileName?: string;
  /** 접근성 라벨 (미지정 시 title 또는 기본값 사용) */
  ariaLabel?: string;
  /** 애니메이션 지속시간 (ms) */
  animationDuration?: number;
}

export interface CustomChartProps extends BaseChartProps {
  /** 차트 시각화 타입 */
  type: ChartType;
}

export interface CustomBarChartProps extends BaseChartProps {
  /** 수평 막대 그래프 여부 */
  horizontal?: boolean;
  /** 누적 막대 그래프 여부 */
  stacked?: boolean;
  /** 막대 둥근 모서리 반경 */
  borderRadius?: number;
}

export interface CustomLineChartProps extends BaseChartProps {
  /** 영역 채우기 여부 */
  fill?: boolean;
  /** 곡선 스무딩 정도 (0 = 직선, 0.4 = 부드러운 곡선) */
  tension?: number;
  /** 포인트 표시 여부 */
  showPoints?: boolean;
  /** 누적 라인 그래프 여부 */
  stacked?: boolean;
}

export interface CustomPieChartProps extends BaseChartProps {
  /** 파이 조각 시작 각도 (도 단위) */
  rotation?: number;
}

export interface CustomDoughnutChartProps extends BaseChartProps {
  /** 중앙 구멍 크기 백분율 (기본값: '60%') */
  cutout?: string | number;
  /** 파이 조각 시작 각도 (도 단위) */
  rotation?: number;
}

export interface CustomRadarChartProps extends BaseChartProps {
  /** 영역 채우기 여부 (기본: true) */
  fill?: boolean;
  /** 최소값 */
  min?: number;
  /** 최대값 */
  max?: number;
}
