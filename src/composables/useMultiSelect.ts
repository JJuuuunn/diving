import { computed, ref, type Ref } from 'vue';
import type { SelectItem, SelectOption } from '@/types/inputs';

export function useMultiSelect(
  modelValue: Ref<unknown[]>,
  options: Ref<SelectItem[]>,
  maxSelections: Ref<number>
) {
  const isOpen = ref(false);

  const normalizedOptions = computed<SelectOption[]>(() =>
    options.value.map((option) => {
      if (typeof option === 'object' && option !== null) {
        return {
          value: option.value,
          label: option.label ?? String(option.value)
        };
      }
      return { value: option, label: String(option) };
    })
  );

  const isSelected = (value: unknown): boolean => modelValue.value.includes(value);
  const isAtLimit = computed(() =>
    maxSelections.value > 0 && modelValue.value.length >= maxSelections.value
  );
  const selectedOptions = computed(() =>
    normalizedOptions.value.filter((option) => isSelected(option.value))
  );

  const toggle = (): void => {
    isOpen.value = !isOpen.value;
  };

  const close = (): void => {
    isOpen.value = false;
  };

  const toggleOption = (value: unknown): void => {
    if (isSelected(value)) {
      modelValue.value = modelValue.value.filter((selected) => selected !== value);
      return;
    }
    if (!isAtLimit.value) modelValue.value = [...modelValue.value, value];
  };

  const remove = (value: unknown): void => {
    modelValue.value = modelValue.value.filter((selected) => selected !== value);
  };

  const clear = (): void => {
    modelValue.value = [];
  };

  return {
    isOpen,
    normalizedOptions,
    selectedOptions,
    isAtLimit,
    isSelected,
    toggle,
    close,
    toggleOption,
    remove,
    clear
  };
}
