import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DiveLog, DiveLogDraft, LogbookParseResult } from '@/types/logbook';
import {
  createLogId,
  LEGACY_LOGBOOK_STORAGE_KEY,
  LOGBOOK_STORAGE_KEY,
  parseLogbookPayload,
  serializeLogbook,
  validateDiveLogDraft
} from '@/utils/logbook';

export const useLogbookStore = defineStore('logbook', () => {
  const logs = ref<DiveLog[]>([]);
  const storageError = ref<string | null>(null);
  const discardedLogCount = ref(0);

  const persistLogs = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(LOGBOOK_STORAGE_KEY, serializeLogbook(logs.value));
      storageError.value = null;
      return true;
    } catch (error) {
      storageError.value = error instanceof DOMException && error.name === 'QuotaExceededError'
        ? '브라우저 저장 공간이 부족합니다. 로그북을 백업한 뒤 서명이나 기록을 정리해주세요.'
        : '로그북을 브라우저에 저장하지 못했습니다. 저장소 권한을 확인해주세요.';
      return false;
    }
  };

  const hydrate = (): void => {
    if (typeof window === 'undefined') return;
    try {
      const current = window.localStorage.getItem(LOGBOOK_STORAGE_KEY);
      const legacy = window.localStorage.getItem(LEGACY_LOGBOOK_STORAGE_KEY);
      if (!current && !legacy) return;

      let result: LogbookParseResult;
      try {
        result = parseLogbookPayload(current ?? legacy as string);
      } catch (error) {
        if (!legacy || current === null) throw error;
        result = parseLogbookPayload(legacy);
        storageError.value = '현재 저장본이 손상되어 이전 로그북 데이터로 복구했습니다.';
      }
      logs.value = result.logs;
      discardedLogCount.value = result.discarded;
      if (result.migrated) persistLogs();
      if (result.discarded > 0) {
        storageError.value = `형식이 손상된 로그 ${result.discarded}개를 불러오지 않았습니다.`;
      }
    } catch {
      storageError.value = '저장된 로그북을 읽지 못했습니다. 기존 데이터는 덮어쓰지 않았습니다.';
    }
  };

  const addLog = (draft: DiveLogDraft): DiveLog => {
    const validationError = validateDiveLogDraft(draft);
    if (validationError) throw new Error(validationError);
    const timestamp = new Date().toISOString();
    const log = { ...draft, id: createLogId(), createdAt: timestamp, updatedAt: timestamp } as DiveLog;
    logs.value.unshift(log);
    if (!persistLogs()) {
      logs.value.shift();
      throw new Error(storageError.value ?? '로그를 저장하지 못했습니다.');
    }
    return log;
  };

  const deleteLog = (id: string): void => {
    const previous = logs.value;
    logs.value = logs.value.filter((log) => log.id !== id);
    if (!persistLogs()) {
      logs.value = previous;
      throw new Error(storageError.value ?? '로그를 삭제하지 못했습니다.');
    }
  };

  const updateLog = (id: string, draft: DiveLogDraft): boolean => {
    const validationError = validateDiveLogDraft(draft);
    if (validationError) throw new Error(validationError);
    const index = logs.value.findIndex((log) => log.id === id);
    if (index === -1) return false;
    const existing = logs.value[index];
    logs.value[index] = {
      ...draft,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    } as DiveLog;
    if (!persistLogs()) {
      logs.value[index] = existing;
      throw new Error(storageError.value ?? '로그를 수정하지 못했습니다.');
    }
    return true;
  };

  const importBackup = (payload: string): LogbookParseResult => {
    const result = parseLogbookPayload(payload);
    if (result.logs.length === 0 && result.discarded > 0) {
      throw new Error('가져올 수 있는 유효한 로그가 없습니다.');
    }
    const previous = logs.value;
    logs.value = result.logs;
    discardedLogCount.value = result.discarded;
    if (!persistLogs()) {
      logs.value = previous;
      throw new Error(storageError.value ?? '로그북을 복원하지 못했습니다.');
    }
    return result;
  };

  const exportBackup = (): string => serializeLogbook(logs.value);

  hydrate();

  return {
    logs,
    storageError,
    discardedLogCount,
    addLog,
    deleteLog,
    updateLog,
    importBackup,
    exportBackup,
    persistLogs
  };
});
