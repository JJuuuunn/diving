import { computed, type Ref } from 'vue';

export function useNumberInput(
  modelValue: Ref<number>,
  props: {
    min?: number;
    max?: number;
    step?: number;
  }
) {
  const minVal = computed(() => props.min ?? -Infinity);
  const maxVal = computed(() => props.max ?? Infinity);
  const stepVal = computed(() => props.step ?? 1);

  // [-] 버튼 비활성화 상태 계산
  const isDecrementDisabled = computed(() => {
    return modelValue.value <= minVal.value;
  });

  // [+] 버튼 비활성화 상태 계산
  const isIncrementDisabled = computed(() => {
    return modelValue.value >= maxVal.value;
  });

  // 안전하게 값 증가시키기
  const stepUp = () => {
    const nextValue = Number((modelValue.value + stepVal.value).toFixed(2));
    if (nextValue <= maxVal.value) {
      modelValue.value = nextValue;
    } else {
      modelValue.value = maxVal.value;
    }
  };

  // 안전하게 값 감소시키기
  const stepDown = () => {
    const nextValue = Number((modelValue.value - stepVal.value).toFixed(2));
    if (nextValue >= minVal.value) {
      modelValue.value = nextValue;
    } else {
      modelValue.value = minVal.value;
    }
  };

  // 수동 입력 값 검증 및 정규화
  const handleBlurValidation = (rawVal: string | number) => {
    let numeric = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;

    if (isNaN(numeric)) {
      numeric = minVal.value !== -Infinity ? minVal.value : 0;
    }

    // 범위 제한 (Clamp)
    const clamped = Math.min(Math.max(numeric, minVal.value), maxVal.value);
    
    // 소수점 2자리 반올림 (정밀도 보정)
    modelValue.value = Number(clamped.toFixed(2));
  };

  return {
    isDecrementDisabled,
    isIncrementDisabled,
    stepUp,
    stepDown,
    handleBlurValidation
  };
}
