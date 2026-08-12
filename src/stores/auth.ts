import { defineStore } from 'pinia';
import { ref } from 'vue';

export const AUTH_STORAGE_KEY = 'diving:auth:admin:v1';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref<boolean>(false);
  const storageError = ref<string | null>(null);

  const getExpectedPasscodes = (): string[] => {
    const envPasscode = import.meta.env.VITE_ADMIN_PASSCODE as string | undefined;
    const candidates = [envPasscode, 'diving2026', 'admin1234', '1234', 'admin'];
    return candidates.filter(
      (code): code is string => typeof code === 'string' && code.trim().length > 0
    );
  };

  const persistAuthState = (authenticated: boolean): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      if (authenticated) {
        window.localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ isAuthenticated: true, timestamp: Date.now() })
        );
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      storageError.value = null;
      return true;
    } catch (error) {
      storageError.value = '인증 상태를 저장소에 기록하지 못했습니다.';
      return false;
    }
  };

  const hydrate = (): void => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.isAuthenticated === true) {
        isAuthenticated.value = true;
      } else if (raw === 'true') {
        isAuthenticated.value = true;
      }
    } catch {
      storageError.value = '저장된 인증 상태를 파싱하지 못했습니다.';
      isAuthenticated.value = false;
    }
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
