/**
 * WAI-ARIA Keyboard Navigation Composable & Utilities
 * Provides roving focus and list arrow navigation helpers.
 */

export interface RovingFocusOptions {
  /**
   * Whether navigation loops circularly across start and end boundaries.
   * @default true
   */
  loop?: boolean;
  /**
   * Directional orientation of arrow key navigation.
   * @default 'both'
   */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /**
   * Whether to call event.preventDefault() when a navigation key is handled.
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Whether Home and End keys move to the first and last element.
   * @default true
   */
  homeEnd?: boolean;
}

export interface ListArrowNavOptions {
  /**
   * Whether navigation loops circularly across start and end boundaries.
   * @default true
   */
  loop?: boolean;
  /**
   * Directional orientation of arrow key navigation.
   * @default 'both'
   */
  orientation?: 'horizontal' | 'vertical' | 'both';
  /**
   * Whether to call event.preventDefault() when a navigation key is handled.
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Whether Home and End keys select the first and last item.
   * @default true
   */
  homeEnd?: boolean;
}

/**
 * Calculates the next index based on keyboard event key, current position, total count, and options.
 * Returns -1 if the key is not a navigation key.
 */
function getNextIndex(
  key: string,
  currentIndex: number,
  length: number,
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    homeEnd?: boolean;
  }
): number {
  if (length <= 0) return -1;

  const loop = options.loop ?? true;
  const orientation = options.orientation ?? 'both';
  const homeEnd = options.homeEnd ?? true;

  const isHorizontal = orientation === 'horizontal' || orientation === 'both';
  const isVertical = orientation === 'vertical' || orientation === 'both';

  const isNext = (isHorizontal && key === 'ArrowRight') || (isVertical && key === 'ArrowDown');
  const isPrev = (isHorizontal && key === 'ArrowLeft') || (isVertical && key === 'ArrowUp');
  const isHome = homeEnd && key === 'Home';
  const isEnd = homeEnd && key === 'End';

  if (!isNext && !isPrev && !isHome && !isEnd) {
    return -1;
  }

  const safeIndex = currentIndex < 0 || currentIndex >= length ? 0 : currentIndex;

  if (isHome) {
    return 0;
  }
  if (isEnd) {
    return length - 1;
  }
  if (isNext) {
    if (currentIndex < 0) return 0;
    return loop ? (safeIndex + 1) % length : Math.min(safeIndex + 1, length - 1);
  }
  if (isPrev) {
    if (currentIndex < 0) return length - 1;
    return loop ? (safeIndex - 1 + length) % length : Math.max(safeIndex - 1, 0);
  }

  return -1;
}

/**
 * Handles WAI-ARIA roving focus navigation across an array of focusable HTML elements.
 * Automatically focuses the next element and prevents default event behavior when navigation keys are pressed.
 *
 * @returns The new focused index, or -1 if no navigation took place.
 */
export function handleRovingFocus(
  event: KeyboardEvent,
  elements: (HTMLElement | null | undefined)[] | ArrayLike<HTMLElement> | null | undefined,
  currentIndex: number,
  options: RovingFocusOptions = {}
): number {
  if (!elements) return -1;

  const elementArray: HTMLElement[] = Array.from(elements).filter(
    (el): el is HTMLElement => el !== null && el !== undefined && typeof el.focus === 'function'
  );

  if (elementArray.length === 0) return -1;

  const nextIndex = getNextIndex(event.key, currentIndex, elementArray.length, options);

  if (nextIndex !== -1) {
    if (options.preventDefault ?? true) {
      event.preventDefault();
    }
    elementArray[nextIndex]?.focus();
    return nextIndex;
  }

  return -1;
}

/**
 * Handles arrow key navigation across an ordered item list, calling `onSelect` with the newly selected index.
 *
 * @returns The newly selected index, or -1 if no navigation took place.
 */
export function handleListArrowNav(
  event: KeyboardEvent,
  activeIndex: number,
  itemCount: number,
  onSelect: (index: number) => void,
  options: ListArrowNavOptions = {}
): number {
  if (itemCount <= 0) return -1;

  const nextIndex = getNextIndex(event.key, activeIndex, itemCount, options);

  if (nextIndex !== -1) {
    if (options.preventDefault ?? true) {
      event.preventDefault();
    }
    onSelect(nextIndex);
    return nextIndex;
  }

  return -1;
}

/**
 * Vue 3 Composable wrapper for WAI-ARIA keyboard navigation utilities.
 */
export function useKeyboardNav() {
  return {
    handleRovingFocus,
    handleListArrowNav
  };
}
