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

export interface NumberInputProps {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  size?: ComponentSize;
  state?: ComponentState;
  clearable?: boolean;
}

export interface SelectProps {
  modelValue: unknown;
  options: SelectItem[];
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: ComponentSize;
  state?: ComponentState;
  clearable?: boolean;
}

export interface MultiSelectProps {
  modelValue: unknown[];
  options: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  maxSelections?: number;
  size?: ComponentSize;
  state?: ComponentState;
}

export interface InputProps {
  modelValue?: string | number;
  id?: string;
  label?: string;
  hint?: string;
  type?: 'text' | 'search' | 'email' | 'tel' | 'url' | 'password' | 'number';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  errorId?: string;
  size?: ComponentSize;
  state?: ComponentState;
  clearable?: boolean;
  trim?: boolean;
  valueType?: 'string' | 'number';
}

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: ComponentVariant;
  size?: ComponentSize;
  shape?: 'rounded' | 'pill' | 'square';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  block?: boolean;
  state?: ComponentState;
  clearable?: boolean;
}
