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

export interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export interface PlaygroundNavSection {
  id: string;
  icon: string;
  label: string;
}
