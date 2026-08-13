<template>
  <div v-if="hasFieldChrome" class="custom-ui-field" :class="fieldClasses">
    <label v-if="label" class="custom-ui-field__label" :for="resolvedId">
      {{ label }}
      <span v-if="required" class="custom-ui-field__required" aria-hidden="true">*</span>
    </label>

    <div class="custom-ui-field__control">
      <span v-if="$slots.prefix" class="custom-ui-field__affix custom-ui-field__affix--prefix">
        <slot name="prefix" />
      </span>
      <input
        :id="resolvedId"
        ref="inputRef"
        v-bind="$attrs"
        class="custom-ui-input"
        :class="inputClasses"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @input="handleInput"
        @change="emit('change', $event)"
        @blur="emit('blur', $event)"
      />
      <button
        v-if="showClearButton"
        type="button"
        class="custom-ui-input__clear-btn"
        aria-label="입력 내용 지우기"
        @click.prevent="handleClear"
      >
        ✕
      </button>
      <span v-if="$slots.suffix" class="custom-ui-field__affix custom-ui-field__affix--suffix">
        <slot name="suffix" />
      </span>
    </div>

    <p v-if="error" :id="resolvedErrorId" class="custom-ui-field__message custom-ui-field__message--error">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="custom-ui-field__message">{{ hint }}</p>
  </div>

  <input
    v-else
    :id="resolvedId"
    ref="inputRef"
    v-bind="$attrs"
    class="custom-ui-input"
    :class="inputClasses"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    @input="handleInput"
    @change="emit('change', $event)"
    @blur="emit('blur', $event)"
  />
</template>

<script setup lang="ts">
import { computed, ref, useId, useSlots } from 'vue';
import type { InputProps } from '@/types/inputs';
import { normalizeInputValue } from '@/utils/inputValue';
import { getSizeClass } from '@/utils/size';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<InputProps>(), {
  modelValue: '',
  id: '',
  label: '',
  hint: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  error: '',
  errorId: '',
  size: 'md',
  state: 'default',
  clearable: false,
  trim: false,
  valueType: 'string'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number): void;
  (event: 'input', value: string | number): void;
  (event: 'change' | 'blur', value: Event): void;
  (event: 'clear'): void;
}>();

const slots = useSlots();
const generatedId = useId();
const inputRef = ref<HTMLInputElement | null>(null);

const resolvedId = computed(() => props.id || `custom-input-${generatedId}`);
const resolvedErrorId = computed(() => props.errorId || `${resolvedId.value}-error`);
const hintId = computed(() => `${resolvedId.value}-hint`);
const describedBy = computed(() => {
  if (props.error) return resolvedErrorId.value;
  if (props.hint) return hintId.value;
  return undefined;
});

const showClearButton = computed(() => {
  if (!props.clearable || props.disabled || props.readonly) return false;
  return props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined;
});

const hasFieldChrome = computed(() =>
  Boolean(props.label || props.hint || props.error || props.state !== 'default' || props.clearable || slots.prefix || slots.suffix)
);

const inputClasses = computed(() => [
  getSizeClass('custom-ui-input', props.size),
  props.state && props.state !== 'default' ? `custom-ui-input--${props.state}` : '',
  {
    'custom-ui-input--with-prefix': Boolean(slots.prefix),
    'custom-ui-input--with-suffix': Boolean(slots.suffix),
    'custom-ui-input--with-clear': showClearButton.value
  }
]);

const fieldClasses = computed(() => {
  const effectiveState = props.error ? 'error' : props.state;
  return {
    'custom-ui-field--disabled': props.disabled,
    'custom-ui-field--error': effectiveState === 'error',
    'custom-ui-field--success': effectiveState === 'success',
    'custom-ui-field--warning': effectiveState === 'warning'
  };
});

const focus = (): void => inputRef.value?.focus();
const select = (): void => inputRef.value?.select();

defineExpose({ focus, select });

const handleInput = (event: Event): void => {
  const value = normalizeInputValue((event.target as HTMLInputElement).value, {
    trim: props.trim,
    valueType: props.valueType
  });
  emit('update:modelValue', value);
  emit('input', value);
};

const handleClear = (): void => {
  const emptyVal = props.valueType === 'number' ? 0 : '';
  emit('update:modelValue', emptyVal);
  emit('input', emptyVal);
  emit('clear');
  focus();
};
</script>
