export interface SelectOption {
  value: any;
  label: string;
}

export interface NumberInputProps {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}
