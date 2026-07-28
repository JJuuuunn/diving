const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const createUtcDate = (dateString: string): Date => {
  if (!DATE_PATTERN.test(dateString)) throw new Error('Invalid calendar date');
  return new Date(`${dateString}T00:00:00.000Z`);
};

export const toUtcDateString = (date: Date): string =>
  [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');

export const moveUtcMonth = (date: Date, amount: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));

export const buildUtcCalendarDates = (year: number, month: number): string[] => {
  const first = new Date(Date.UTC(year, month, 1));
  const start = new Date(Date.UTC(year, month, 1 - first.getUTCDay()));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return toUtcDateString(date);
  });
};
