import type { Dayjs } from 'dayjs';

export interface CalendarDay {
  date: Dayjs;
  dateString: string; // YYYY-MM-DD format
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasLog: boolean;
}

export type CalendarViewMode = 'days' | 'months' | 'years';
