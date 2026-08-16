import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getStoredItem, setStoredItem, removeStoredItem } from '../utils/storage.ts';

export const AUTH_STORAGE_KEY = 'diving:auth:admin:v1';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref<boolean>(false);
  const storageError = ref<string | null>(null);

  const getExpectedPasscodes = (): string[] => {
    const envPasscode = import.meta.env.VITE_ADMIN_PASSCODE as string | undefined;
    const passcode = envPasscode && envPasscode.trim().length > 0 ? envPasscode.trim() : 'diving2026';
    return [passcode];
  };

  const persistAuthState = (authenticated: boolean): boolean => {
    try {
      if (authenticated) {
        setStoredItem(AUTH_STORAGE_KEY, { isAuthenticated: true, timestamp: Date.now() });
      } else {
        removeStoredItem(AUTH_STORAGE_KEY);
      }
      storageError.value = null;
      return true;
    } catch {
      storageError.value = '인증 상태를 저장소에 기록하지 못했습니다.';
      return false;
    }
  };

  const hydrate = (): void => {
    const isAuthValid = (parsed: unknown): boolean => {
      if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).isAuthenticated === true) {
        return true;
      }
      if (parsed === 'true' || parsed === true) {
        return true;
      }
      return false;
    };
    isAuthenticated.value = getStoredItem<boolean>(AUTH_STORAGE_KEY, false, isAuthValid);
  };

  const verifyPasscode = (passcode: string): boolean => {
    const trimmed = passcode.trim();
    if (!trimmed) {
      return false;
    }

    const expectedCodes = getExpectedPasscodes();
    const isValid = expectedCodes.includes(trimmed);

    if (isValid) {
      isAuthenticated.value = true;
      persistAuthState(true);
      return true;
    } else {
      return false;
    }
  };

  const logout = (): void => {
    isAuthenticated.value = false;
    persistAuthState(false);
  };

  hydrate();

  return {
    isAuthenticated,
    storageError,
    verifyPasscode,
    logout
  };
});
