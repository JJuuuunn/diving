export interface SelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

export type SelectItem = SelectOption | string | number;
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface NumberInputProps {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

export interface SelectProps {
  modelValue: unknown;
  options: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  modelValue: unknown[];
  options: SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  maxSelections?: number;
  size?: ComponentSize;
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
  trim?: boolean;
  valueType?: 'string' | 'number';
}

export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: ComponentSize;
  shape?: 'rounded' | 'pill' | 'square';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  block?: boolean;
}
