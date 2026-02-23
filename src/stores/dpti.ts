import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { DptiScores, DptiResultDefinition } from '@/types/dpti';

export interface DptiHistoryItem {
    id: number;
    userName: string;
    result: DptiResultDefinition;
    scores: DptiScores;
    date: string;
}

export const useDptiStore = defineStore('dpti', () => {
    const resultsHistory = ref<DptiHistoryItem[]>([]);

    const saveToHistory = (userName: string, result: DptiResultDefinition, scores: DptiScores) => {
        const newRecord: DptiHistoryItem = {
            id: Date.now(),
            userName: userName || '익명의 다이버',
            result: JSON.parse(JSON.stringify(result)),
            scores: JSON.parse(JSON.stringify(scores)),
            date: new Date().toLocaleString()
        };
        resultsHistory.value.push(newRecord);
        
        localStorage.setItem('dpti-history', JSON.stringify(resultsHistory.value));
    };

    const loadHistory = () => {
        const saved = localStorage.getItem('dpti-history');
        if (saved) resultsHistory.value = JSON.parse(saved);
    };

    return { resultsHistory, saveToHistory, loadHistory };
});