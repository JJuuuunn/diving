import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { DiveLog } from '@/types/logbook';

export const useLogbookStore = defineStore('logbook', () => {
  // VueUse useStorage를 사용해 다이빙 로그 배열을 로컬스토리지에 완벽히 자동 저장
  const logs = useStorage<DiveLog[]>('diving-logs', []);

  const addLog = (logData: Omit<DiveLog, 'id'>): void => {
    const newLog: DiveLog = {
      id: Date.now().toString(),
      ...logData
    };
    // 새로운 로그를 맨 앞에 추가하여 최신 글이 먼저 노출되도록 구성
    logs.value.unshift(newLog);
  };

  const deleteLog = (id: string): void => {
    logs.value = logs.value.filter((log) => log.id !== id);
  };

  const updateLog = (updatedLog: DiveLog): void => {
    const index = logs.value.findIndex((log) => log.id === updatedLog.id);
    if (index !== -1) {
      logs.value[index] = updatedLog;
    }
  };

  return {
    logs,
    addLog,
    deleteLog,
    updateLog
  };
});
