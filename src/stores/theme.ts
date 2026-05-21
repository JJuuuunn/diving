import { defineStore } from 'pinia';
import { useDark, useToggle } from '@vueuse/core';

export const useThemeStore = defineStore('theme', () => {
  // useDark는 로컬 스토리지('theme-mode' 키) 동기화와 body 태그의 '.dark' 클래스 토글링을 선언적으로 완전 자동 처리합니다.
  const isDark = useDark({
    selector: 'body',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
    storageKey: 'theme-mode',
  });

  const toggleTheme = useToggle(isDark);

  // 기존 'isDay' 키로 관리되던 하위 호환성 및 테마 설정 유실 방지를 위한 자동 마이그레이션 실행
  const oldIsDay = localStorage.getItem('isDay');
  if (oldIsDay !== null) {
    isDark.value = oldIsDay !== 'true';
    localStorage.removeItem('isDay');
  }

  return {
    isDark,
    toggleTheme
  };
});
