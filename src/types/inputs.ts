export interface SelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

export type SelectItem = SelectOption | string | number;

export type ComponentSizeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ComponentSize = ComponentSizeLevel | `${ComponentSizeLevel}` | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export type ComponentVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'ghost'
  | 'outline';

export type ComponentState = 'default' | 'success' | 'warning' | 'error';

/**
 * 공용 UI 컴포넌트 Props 기본 인터페이스
 * size, variant, state, disabled, clearable, block 공통 속성을 규격화합니다.
 */
export interface BaseUIComponentProps<V = ComponentVariant> {
  size?: ComponentSize;
  variant?: V;
  state?: ComponentState;
  disabled?: boolean;
  clearable?: boolean;
  block?: boolean;
}

/**
 * 폼 필드 UI 컴포넌트 Props 기본 인터페이스
 */
export interface BaseFormFieldProps<V = ComponentVariant> extends BaseUIComponentProps<V> {
  id?: string;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
}

export interface NumberInputProps extends BaseFormFieldProps {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectProps extends BaseFormFieldProps {
  modelValue: unknown;
  options: SelectItem[];
  ariaLabel?: string;
}

export interface MultiSelectProps extends BaseFormFieldProps {
  modelValue: unknown[];
  options: SelectItem[];
  maxSelections?: number;
}

export interface InputProps extends BaseFormFieldProps {
  modelValue?: string | number;
  label?: string;
  hint?: string;
  type?: 'text' | 'search' | 'email' | 'tel' | 'url' | 'password' | 'number';
  error?: string;
  errorId?: string;
  trim?: boolean;
  valueType?: 'string' | 'number';
}

export interface ButtonProps extends BaseUIComponentProps {
  type?: 'button' | 'submit' | 'reset';
  shape?: 'rounded' | 'pill' | 'square';
  loading?: boolean;
  loadingLabel?: string;
}

export interface SegmentedOption {
  value: unknown;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type SegmentedItem = SegmentedOption | string | number;

export interface SegmentedControlProps extends BaseFormFieldProps {
  modelValue?: unknown;
  options: SegmentedItem[];
  compactCycle?: boolean;
}

export type BadgeVariant = ComponentVariant | 'ocean' | 'coral' | 'abyss' | 'info' | 'neutral';

export interface BadgeProps extends BaseUIComponentProps<BadgeVariant> {
  pill?: boolean;
  dot?: boolean;
  pulsing?: boolean;
  removable?: boolean;
}

export type AlertVariant =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ocean'
  | 'coral'
  | 'abyss'
  | 'neutral';

export interface AlertProps extends BaseUIComponentProps<AlertVariant> {
  title?: string;
  icon?: string;
  dismissible?: boolean;
  bordered?: boolean;
}


export interface TabItem {
  id: string | number;
  label: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

export type TabVariant = 'pill' | 'underline' | 'segment';

export interface TabsProps extends BaseUIComponentProps<TabVariant> {
  modelValue?: string | number;
  tabs: TabItem[];
}

export interface AccordionItem {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: string;
  disabled?: boolean;
}

export interface AccordionProps extends BaseUIComponentProps {
  modelValue?: unknown | unknown[];
  multiple?: boolean;
  items?: AccordionItem[];
}

export interface TooltipProps extends BaseUIComponentProps {
  content?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
}

export interface SliderProps extends BaseFormFieldProps {
  modelValue: number | [number, number];
  min?: number;
  max?: number;
  step?: number;
  showTicks?: boolean;
  showTooltip?: boolean;
}
