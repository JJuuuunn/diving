import { ref, computed, type Ref } from 'vue';
import type { SelectOption } from '@/types/inputs';

export function useSelect(
  modelValue: Ref<any>,
  options: Ref<any[] | SelectOption[]>,
  placeholder: string
) {
  const isOpen = ref(false);

  // 드롭다운 토글 및 닫기
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  const close = () => {
    isOpen.value = false;
  };

  const select = (value: any) => {
    modelValue.value = value;
    isOpen.value = false;
  };

  // 현재 선택된 값에 알맞은 표시 라벨 계산
  const displayLabel = computed(() => {
    const val = modelValue.value;
    if (val === undefined || val === null || val === '') {
      return '';
    }

    const opts = options.value;
    for (const opt of opts) {
      if (typeof opt === 'object' && opt !== null) {
        // { value, label } 형태 파싱
        if (opt.value === val) {
          return opt.label;
        }
      } else {
        // 단순 원시 타입 문자열/숫자 파싱
        if (opt === val) {
          return String(opt);
        }
      }
    }

    return String(val);
  });

  // 정규화된 옵션 객체 배열 가공 (템플릿 출력용)
  const normalizedOptions = computed<SelectOption[]>(() => {
    return options.value.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value,
          label: opt.label ?? String(opt.value)
        };
      }
      return {
        value: opt,
        label: String(opt)
      };
    });
  });

  return {
    isOpen,
    toggle,
    close,
    select,
    displayLabel,
    normalizedOptions
  };
}
