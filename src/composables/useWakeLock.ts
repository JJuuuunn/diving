import { ref, onMounted, onUnmounted } from 'vue';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

export function useWakeLock() {
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const isLocked = ref(false);
  let sentinel: WakeLockSentinelLike | null = null;

  const requestLock = async () => {
    if (!isSupported) return;
    try {
      if (!sentinel) {
        sentinel = await (navigator as unknown as NavigatorWithWakeLock).wakeLock.request('screen');
        isLocked.value = true;
        sentinel.addEventListener('release', () => {
          isLocked.value = false;
          sentinel = null;
        });
      }
    } catch {
      isLocked.value = false;
      sentinel = null;
    }
  };

  const releaseLock = async () => {
    if (sentinel) {
      try {
        await sentinel.release();
      } catch {
        // Ignore release error
      }
      sentinel = null;
      isLocked.value = false;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isLocked.value) {
      requestLock();
    }
  };

  onMounted(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  onUnmounted(() => {
    releaseLock();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  return {
    isSupported,
    isLocked,
    requestLock,
    releaseLock
  };
}
