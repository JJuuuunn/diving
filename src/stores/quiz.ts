// src/stores/quiz.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { QuizHistory } from '@/types/quiz';

export const QUIZ_HISTORY_KEY = 'diving:quiz:history:v1';
export const LEGACY_QUIZ_HISTORY_KEY = 'diving_quiz_history';

export const useQuizStore = defineStore('quiz', () => {
  // 사용자의 역대 퀴즈 제출 이력 히스토리
  const histories = ref<QuizHistory[]>([]);

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const currentHistories = localStorage.getItem(QUIZ_HISTORY_KEY);
    const legacyHistories = localStorage.getItem(LEGACY_QUIZ_HISTORY_KEY);
    const savedHistories = currentHistories ?? legacyHistories;

    if (savedHistories) {
      try {
        histories.value = JSON.parse(savedHistories);
        if (!currentHistories && legacyHistories) {
          localStorage.setItem(QUIZ_HISTORY_KEY, legacyHistories);
        }
      } catch (e) {
        console.error('Failed to parse quiz history', e);
        histories.value = [];
      }
    }
    if (legacyHistories !== null) {
      localStorage.removeItem(LEGACY_QUIZ_HISTORY_KEY);
    }
  }

  // histories 변경 시 로컬스토리지에 자동 보존
  watch(
    histories,
    (newVal) => {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(newVal));
    },
    { deep: true }
  );

  // 새로운 풀이 이력 추가
  const addHistory = (history: QuizHistory) => {
    histories.value.unshift(history); // 가장 최근 기록이 앞으로 오도록 추가
  };

  // 특정 시험 세트의 최고 점수 획득
  const getHighScore = (setId: string) => {
    const setHistories = histories.value.filter((h) => h.setId === setId);
    if (setHistories.length === 0) return 0;
    return Math.max(...setHistories.map((h) => h.score));
  };

  // 특정 시험 세트의 풀이 횟수 획득
  const getTryCount = (setId: string) => {
    return histories.value.filter((h) => h.setId === setId).length;
  };

  // 모든 히스토리 초기화
  const clearHistories = () => {
    histories.value = [];
  };

  return {
    histories,
    addHistory,
    getHighScore,
    getTryCount,
    clearHistories,
  };
});
