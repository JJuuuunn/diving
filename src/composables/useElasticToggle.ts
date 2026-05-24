import { type Ref } from 'vue';

export function useElasticToggle(modelValue: Ref<boolean>) {
  const toggle = () => {
    modelValue.value = !modelValue.value;
  };

  const setTrue = () => {
    modelValue.value = true;
  };

  const setFalse = () => {
    modelValue.value = false;
  };

  return {
    toggle,
    setTrue,
    setFalse
  };
}
