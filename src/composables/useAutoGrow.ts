import { ref, computed, type Ref, nextTick } from 'vue';

export function useAutoGrow(
  modelValue: Ref<string>,
  maxLengthRef: Ref<number>
) {
  const textareaRef = ref<HTMLTextAreaElement | null>(null);

  // 현재 입력된 글자 수 계산
  const characterCount = computed(() => {
    return modelValue.value ? modelValue.value.length : 0;
  });

  // 글자 수 상한에 도달한 비율 계산 (0 ~ 100)
  const characterPercentage = computed(() => {
    const limit = maxLengthRef.value;
    if (limit <= 0) return 0;
    return Math.min(Math.round((characterCount.value / limit) * 100), 100);
  });

  // 텍스트 영역의 내용 높이에 맞춰 엘리먼트 세로 크기 자동 팽창 연산
  const adjustHeight = () => {
    nextTick(() => {
      const el = textareaRef.value;
      if (!el) return;

      // 일시적으로 리셋하여 정확한 scrollHeight 측정을 보장
      el.style.height = 'auto';
      
      // 내용 높이 반영
      el.style.height = `${el.scrollHeight}px`;
    });
  };

  return {
    textareaRef,
    characterCount,
    characterPercentage,
    adjustHeight
  };
}
