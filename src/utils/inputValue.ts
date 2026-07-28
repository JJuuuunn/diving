export interface InputValueOptions {
  trim?: boolean;
  valueType?: 'string' | 'number';
}

export const normalizeInputValue = (
  value: string,
  options: InputValueOptions = {}
): string | number => {
  const normalized = options.trim ? value.trim() : value;
  if (options.valueType !== 'number') return normalized;
  if (normalized === '') return '';
  const number = Number(normalized);
  return Number.isFinite(number) ? number : normalized;
};
