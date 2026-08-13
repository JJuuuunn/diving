// src/stores/quiz.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Question, QuizHistory, WrongNoteItem } from '@/types/quiz';

export const QUIZ_HISTORY_KEY = 'diving:quiz:history:v1';
export const LEGACY_QUIZ_HISTORY_KEY = 'diving_quiz_history';

export const QUIZ_WRONG_NOTES_KEY = 'diving:quiz:wrong_notes:v1';
export const LEGACY_QUIZ_WRONG_NOTES_KEY = 'diving_quiz_wrong_notes';

export const QUIZ_BOOKMARKS_KEY = 'diving:quiz:bookmarks:v1';
export const LEGACY_QUIZ_BOOKMARKS_KEY = 'diving_quiz_bookmarks';

export const useQuizStore = defineStore('quiz', () => {
  // 사용자의 역대 퀴즈 제출 이력 히스토리
  const histories = ref<QuizHistory[]>([]);
  // 오답 노트 목록
  const wrongNotes = ref<WrongNoteItem[]>([]);
  // 즐겨찾기/북마크된 문제 ID 목록
  const bookmarkedIds = ref<number[]>([]);

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    // 1. Quiz History 마이그레이션 및 초기화
    const currentHistories = localStorage.getItem(QUIZ_HISTORY_KEY);
    const legacyHistories = localStorage.getItem(LEGACY_QUIZ_HISTORY_KEY);
    const savedHistories = currentHistories ?? legacyHistories;

    if (savedHistories) {
      try {
        const parsed = JSON.parse(savedHistories);
        histories.value = Array.isArray(parsed) ? parsed : [];
        if (!currentHistories && legacyHistories) {
          localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(histories.value));
        }
      } catch (e) {
        console.error('Failed to parse quiz history', e);
        histories.value = [];
      }
    }
    if (legacyHistories !== null) {
      localStorage.removeItem(LEGACY_QUIZ_HISTORY_KEY);
    }

    // 2. Wrong Notes 마이그레이션 및 초기화
    const currentWrongNotes = localStorage.getItem(QUIZ_WRONG_NOTES_KEY);
    const legacyWrongNotes = localStorage.getItem(LEGACY_QUIZ_WRONG_NOTES_KEY);
    const savedWrongNotes = currentWrongNotes ?? legacyWrongNotes;

    if (savedWrongNotes) {
      try {
        const parsed = JSON.parse(savedWrongNotes);
        wrongNotes.value = Array.isArray(parsed) ? parsed : [];
        if (!currentWrongNotes && legacyWrongNotes) {
          localStorage.setItem(QUIZ_WRONG_NOTES_KEY, JSON.stringify(wrongNotes.value));
        }
      } catch (e) {
        console.error('Failed to parse quiz wrong notes', e);
        wrongNotes.value = [];
      }
    }
    if (legacyWrongNotes !== null) {
      localStorage.removeItem(LEGACY_QUIZ_WRONG_NOTES_KEY);
    }

    // 3. Bookmarked IDs 마이그레이션 및 초기화
    const currentBookmarks = localStorage.getItem(QUIZ_BOOKMARKS_KEY);
    const legacyBookmarks = localStorage.getItem(LEGACY_QUIZ_BOOKMARKS_KEY);
    const savedBookmarks = currentBookmarks ?? legacyBookmarks;

    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks);
        bookmarkedIds.value = Array.isArray(parsed) ? parsed : [];
        if (!currentBookmarks && legacyBookmarks) {
          localStorage.setItem(QUIZ_BOOKMARKS_KEY, JSON.stringify(bookmarkedIds.value));
        }
      } catch (e) {
        console.error('Failed to parse quiz bookmarks', e);
        bookmarkedIds.value = [];
      }
    }
    if (legacyBookmarks !== null) {
      localStorage.removeItem(LEGACY_QUIZ_BOOKMARKS_KEY);
    }
  }

  // watch 자동 저장
  watch(
    histories,
    (newVal) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(newVal));
      }
    },
    { deep: true }
  );

  watch(
    wrongNotes,
    (newVal) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUIZ_WRONG_NOTES_KEY, JSON.stringify(newVal));
      }
    },
    { deep: true }
  );

  watch(
    bookmarkedIds,
    (newVal) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUIZ_BOOKMARKS_KEY, JSON.stringify(newVal));
      }
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

  // 오답 노트 추가
  const addWrongNote = (question: Question, userAnswer: any) => {
    const existingIndex = wrongNotes.value.findIndex(
      (item) => item.questionId === question.id
    );
    const newItem: WrongNoteItem = {
      questionId: question.id,
      question,
      userAnswer,
      addedAt: new Date().toISOString(),
    };
    if (existingIndex !== -1) {
      wrongNotes.value.splice(existingIndex, 1);
    }
    wrongNotes.value.unshift(newItem);
  };

  // 오답 노트 삭제
  const removeWrongNote = (questionId: number) => {
    wrongNotes.value = wrongNotes.value.filter(
      (item) => item.questionId !== questionId
    );
  };

  // 오답 노트 여부 확인
  const isWrongNote = (questionId: number): boolean => {
    return wrongNotes.value.some((item) => item.questionId === questionId);
  };

  // 오답 노트 전체 초기화
  const clearWrongNotes = () => {
    wrongNotes.value = [];
  };

  // 즐겨찾기/북마크 토글
  const toggleBookmark = (questionId: number) => {
    if (bookmarkedIds.value.includes(questionId)) {
      bookmarkedIds.value = bookmarkedIds.value.filter((id) => id !== questionId);
    } else {
      bookmarkedIds.value.push(questionId);
    }
  };

  // 즐겨찾기/북마크 여부 확인
  const isBookmarked = (questionId: number): boolean => {
    return bookmarkedIds.value.includes(questionId);
  };

  // 즐겨찾기/북마크 전체 초기화
  const clearBookmarks = () => {
    bookmarkedIds.value = [];
  };

  return {
    histories,
    addHistory,
    getHighScore,
    getTryCount,
    clearHistories,
    wrongNotes,
    addWrongNote,
    removeWrongNote,
    isWrongNote,
    clearWrongNotes,
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    clearBookmarks,
  };
});
