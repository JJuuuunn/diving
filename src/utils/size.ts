import type { ComponentSize } from '@/types/inputs';

/**
 * ComponentSize (1~10 숫자, '1'~'10' 문자열, 'xs'|'sm'|'md'|'lg'|'xl')를
 * 1부터 10 사이의 정수 규격 레벨로 정규화합니다.
 *
 * 매핑 규칙:
 * - 'xs' -> 3
 * - 'sm' -> 4
 * - 'md' -> 6 (기본값)
 * - 'lg' -> 8
 * - 'xl' -> 10
 * - 숫자 / 숫자로 이루어진 문자열: 1~10 범위로 클램핑된 정수
 * - 비어있거나 유효하지 않은 값: 6
 */
export function normalizeComponentSize(size?: ComponentSize): number {
  if (size === undefined || size === null) {
    return 6;
  }

  if (typeof size === 'number') {
    if (isNaN(size)) return 6;
    return Math.min(10, Math.max(1, Math.round(size)));
  }

  if (typeof size === 'string') {
    switch (size) {
      case 'xs':
        return 3;
      case 'sm':
        return 4;
      case 'md':
        return 6;
      case 'lg':
        return 8;
      case 'xl':
        return 10;
      default: {
        const parsed = parseInt(size, 10);
        if (!isNaN(parsed)) {
          return Math.min(10, Math.max(1, parsed));
        }
        return 6;
      }
    }
  }

  return 6;
}

/**
 * 주어진 클래스 프리픽스(예: 'custom-ui-button')와 컴포넌트 사이즈를 기반으로
 * BEM 형태의 사이즈 클래스명(예: 'custom-ui-button--size-6')을 반환하는 헬퍼 함수입니다.
 */
export function getSizeClass(prefix: string, size?: ComponentSize): string {
  const normalizedSize = normalizeComponentSize(size);
  return `${prefix}--size-${normalizedSize}`;
}
