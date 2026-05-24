export interface SwitchProps {
  modelValue: boolean;
  activeText: string;
  inactiveText: string;
  activeIcon?: string;
  inactiveIcon?: string;
  disabled?: boolean;
}

export interface TextareaProps {
  modelValue: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  rows?: number;
}

export interface SkeletonProps {
  type?: 'card' | 'list' | 'text';
}

export interface SidebarProps {
  isOpen: boolean;
}

export interface DarkModeToggleProps {
  modelValue: boolean;
}

