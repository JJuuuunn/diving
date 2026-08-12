import { defineStore } from 'pinia';
import { useDark, useToggle } from '@vueuse/core';

export const THEME_STORAGE_KEY = 'diving:theme:mode:v1';

export const useThemeStore = defineStore('theme', () => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const current = localStorage.getItem(THEME_STORAGE_KEY);
    const legacyTheme = localStorage.getItem('theme-mode');
    const legacyIsDay = localStorage.getItem('isDay');

    if (!current) {
      if (legacyTheme !== null) {
        localStorage.setItem(THEME_STORAGE_KEY, legacyTheme);
      } else if (legacyIsDay !== null) {
        localStorage.setItem(THEME_STORAGE_KEY, legacyIsDay === 'true' ? 'light' : 'dark');
      }
    }
    if (legacyTheme !== null) localStorage.removeItem('theme-mode');
    if (legacyIsDay !== null) localStorage.removeItem('isDay');
  }

  // useDark는 로컬 스토리지('diving:theme:mode:v1' 키) 동기화와 body 태그의 '.dark' 클래스 토글링을 선언적으로 완전 자동 처리합니다.
  const isDark = useDark({
    selector: 'body',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: THEME_STORAGE_KEY,
  });

  const toggleTheme = useToggle(isDark);

  return {
    isDark,
    toggleTheme
  };
});
