import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { getStoredItem, setStoredItem, migrateLegacyKey } from '@/utils/storage';

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

function parseThemeMode(parsed: unknown): ThemeMode | null {
  if (typeof parsed === 'string') {
    if (['light', 'dark', 'coral', 'abyss'].includes(parsed)) {
      return parsed as ThemeMode;
    }
    if (parsed === 'true') return 'light';
    if (parsed === 'false') return 'dark';
  }
  if (typeof parsed === 'boolean') {
    return parsed ? 'light' : 'dark';
  }
  return null;
}

function getInitialThemeMode(): ThemeMode {
  migrateLegacyKey('theme-mode', THEME_STORAGE_KEY);
  migrateLegacyKey('isDay', THEME_STORAGE_KEY);

  const mode = getStoredItem<ThemeMode>(THEME_STORAGE_KEY, 'light', parseThemeMode);
  setStoredItem(THEME_STORAGE_KEY, mode);
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
    setStoredItem(THEME_STORAGE_KEY, mode);
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
