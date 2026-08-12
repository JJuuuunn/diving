import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

export type ThemeMode = 'light' | 'dark' | 'coral' | 'abyss';

export const THEME_STORAGE_KEY = 'diving:theme:mode:v1';

export function applyThemeToBody(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const bodyList = document.body.classList;
  bodyList.remove('dark', 'theme-coral', 'theme-abyss');
  if (mode === 'dark') {
    bodyList.add('dark');
  } else if (mode === 'coral') {
    bodyList.add('theme-coral');
  } else if (mode === 'abyss') {
    bodyList.add('dark', 'theme-abyss');
  }
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'light';
  }

  const current = localStorage.getItem(THEME_STORAGE_KEY);
  const legacyTheme = localStorage.getItem('theme-mode');
  const legacyIsDay = localStorage.getItem('isDay');

  let mode: ThemeMode = 'light';

  if (current && ['light', 'dark', 'coral', 'abyss'].includes(current)) {
    mode = current as ThemeMode;
  } else if (legacyTheme) {
    if (['light', 'dark', 'coral', 'abyss'].includes(legacyTheme)) {
      mode = legacyTheme as ThemeMode;
    } else if (legacyTheme === 'true' || legacyTheme === 'false') {
      mode = legacyTheme === 'true' ? 'light' : 'dark';
    }
  } else if (legacyIsDay !== null) {
    mode = legacyIsDay === 'true' ? 'light' : 'dark';
  }

  if (legacyTheme !== null) localStorage.removeItem('theme-mode');
  if (legacyIsDay !== null) localStorage.removeItem('isDay');

  localStorage.setItem(THEME_STORAGE_KEY, mode);
  return mode;
}

export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>(getInitialThemeMode());

  const isDark = computed({
    get: () => themeMode.value === 'dark' || themeMode.value === 'abyss',
    set: (val: boolean) => {
      setThemeMode(val ? 'dark' : 'light');
    }
  });

  const setThemeMode = (mode: ThemeMode): void => {
    themeMode.value = mode;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
    applyThemeToBody(mode);
  };

  const toggleTheme = (mode?: ThemeMode | boolean): void => {
    if (typeof mode === 'string' && ['light', 'dark', 'coral', 'abyss'].includes(mode)) {
      setThemeMode(mode as ThemeMode);
      return;
    }
    if (typeof mode === 'boolean') {
      setThemeMode(mode ? 'dark' : 'light');
      return;
    }
    const modes: ThemeMode[] = ['light', 'dark', 'coral', 'abyss'];
    const currentIndex = modes.indexOf(themeMode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // Ensure body class is applied immediately on store instantiation
  applyThemeToBody(themeMode.value);

  watch(themeMode, (newMode) => {
    applyThemeToBody(newMode);
  });

  return {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme
  };
});
