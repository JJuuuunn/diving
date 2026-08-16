import type { Dayjs } from 'dayjs';
import type { BaseFormFieldProps } from '@/types/inputs';

export interface CalendarDay {
  date: Dayjs;
  dateString: string; // YYYY-MM-DD format
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasLog: boolean;
}

export interface CalendarPanelCell {
  key: string;
  date: string;
  day: number;
  isCurrentMonth: boolean;
  eventCount?: number;
}

export type CalendarViewMode = 'days' | 'months' | 'years';
export type DatePickerMode = 'date' | 'month';

export interface DatePickerProps extends BaseFormFieldProps {
  modelValue: string;
  mode?: DatePickerMode;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangePickerProps extends BaseFormFieldProps {
  modelValue: DateRange;
  mode?: DatePickerMode;
}
