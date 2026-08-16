import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { DptiScores, DptiResultDefinition, DptiHistoryItem } from '@/types/dpti';
import { migrateLegacyKey } from '@/utils/storage';

export const DPTI_STORAGE_KEY = 'diving:dpti:history:v1';
export const LEGACY_DPTI_STORAGE_KEY = 'dpti-history';

export const useDptiStore = defineStore('dpti', () => {
    // 기존 키 읽기 호환: 신규 키 데이터가 없고 기존 키 데이터가 존재하는 경우 마이그레이션
    migrateLegacyKey(LEGACY_DPTI_STORAGE_KEY, DPTI_STORAGE_KEY);

    // VueUse의 useStorage를 활용하여 로컬스토리지 상태 동기화를 선언적으로 자동화
    const resultsHistory = useStorage<DptiHistoryItem[]>(DPTI_STORAGE_KEY, []);

    const saveToHistory = (userName: string, result: DptiResultDefinition, scores: DptiScores) => {
        const newRecord: DptiHistoryItem = {
            id: Date.now(),
            userName: userName || '익명의 다이버',
            result: structuredClone(result),
            scores: structuredClone(scores),
            date: new Date().toLocaleString()
        };
        resultsHistory.value.push(newRecord);
    };

    return { resultsHistory, saveToHistory };
});