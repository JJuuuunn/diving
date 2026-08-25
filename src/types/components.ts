import type { BaseFormFieldProps, BaseUIComponentProps } from './inputs';
export * from './chart';

export interface SwitchProps extends BaseFormFieldProps {
  modelValue: boolean;
  activeText: string;
  inactiveText: string;
  activeIcon?: string;
  inactiveIcon?: string;
}

export interface TextareaProps extends BaseFormFieldProps {
  modelValue: string;
  maxLength?: number;
  rows?: number;
}

export interface SkeletonProps extends BaseUIComponentProps {
  type?: 'card' | 'list' | 'text';
}

export interface SidebarProps {
  isOpen: boolean;
}

export interface DarkModeToggleProps extends BaseUIComponentProps {
  modelValue?: boolean;
  /** 사이드바 확장 상태와 동일한 와이드 UI를 강제 표시 (플레이그라운드 등) */
  expanded?: boolean;
}

export interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ErrorBoundaryProps {
  title?: string;
  message?: string;
  showDetails?: boolean;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export interface PlaygroundNavSection {
  id: string;
  icon: string;
  label: string;
}

export type PaginationVariant = 'default' | 'outline' | 'ghost' | 'pills';

export interface PaginationProps extends BaseUIComponentProps<PaginationVariant> {
  currentPage: number;
  totalItems?: number;
  totalPages?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  maxPageButtons?: number;
  showTotal?: boolean;
  showPageSize?: boolean;
  showQuickJumper?: boolean;
  showFirstLast?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  formatter?: (val: any, row: T, index: number) => string | number | boolean | null | undefined;
  summary?: 'sum' | 'avg' | 'count' | ((values: any[]) => string | number);
}

export type TableVariant = 'default' | 'striped' | 'bordered' | 'glass';

export interface TableProps<T = any> extends BaseUIComponentProps<TableVariant> {
  columns: TableColumn<T>[];
  data: T[];
  variant?: TableVariant;
  hoverable?: boolean;
  emptyText?: string;
  loading?: boolean;
  loadingText?: string;
  stickyHeader?: boolean;
  rowKey?: keyof T | (string & {}) | ((row: T, index: number) => string | number);
  selectable?: boolean;
  selectionType?: 'checkbox' | 'radio';
  selectedKeys?: (string | number)[];
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  total?: number;
  manualPagination?: boolean;
  expandable?: boolean;
  expandedKeys?: (string | number)[];
  showSummary?: boolean;
  summaryText?: string;
  cardOnMobile?: boolean;
}
