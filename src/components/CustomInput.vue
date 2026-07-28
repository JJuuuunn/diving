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
  trim: false,
  valueType: 'string'
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number): void;
  (event: 'input', value: string | number): void;
  (event: 'change' | 'blur', value: Event): void;
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
const hasFieldChrome = computed(() =>
  Boolean(props.label || props.hint || props.error || slots.prefix || slots.suffix)
);
const inputClasses = computed(() => [
  `custom-ui-input--${props.size}`,
  {
    'custom-ui-input--with-prefix': Boolean(slots.prefix),
    'custom-ui-input--with-suffix': Boolean(slots.suffix)
  }
]);
const fieldClasses = computed(() => ({
  'custom-ui-field--disabled': props.disabled,
  'custom-ui-field--error': Boolean(props.error)
}));

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
</script>
