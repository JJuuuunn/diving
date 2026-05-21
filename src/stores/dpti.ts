import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { DptiScores, DptiResultDefinition, DptiHistoryItem } from '@/types/dpti';

export const useDptiStore = defineStore('dpti', () => {
    // VueUse의 useStorage를 활용하여 로컬스토리지 상태 동기화를 선언적으로 자동화
    const resultsHistory = useStorage<DptiHistoryItem[]>('dpti-history', []);

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