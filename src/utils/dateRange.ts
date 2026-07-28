import type { DateRange } from '../types/calendar.ts';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/;

export const isDateInRange = (date: string, range: DateRange): boolean =>
  Boolean(range.start && range.end && date > range.start && date < range.end);

export const selectRangeDate = (range: DateRange, date: string): DateRange => {
  if (!DATE_PATTERN.test(date)) return range;
  if (!range.start || range.end) return { start: date, end: '' };
  if (date < range.start) return { start: date, end: range.start };
  return { start: range.start, end: date };
};

export const selectRangeMonth = (range: DateRange, month: string): DateRange => {
  if (!MONTH_PATTERN.test(month)) return range;
  if (!range.start || range.end) return { start: month, end: '' };
  if (month < range.start) return { start: month, end: range.start };
  return { start: range.start, end: month };
};
