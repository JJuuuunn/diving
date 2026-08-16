// src/stores/quiz.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Question, QuizHistory, WrongNoteItem } from '@/types/quiz';
import { getStoredItem, setStoredItem, migrateLegacyKey } from '@/utils/storage';

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

  // 1. Quiz History 마이그레이션 및 초기화
  migrateLegacyKey(LEGACY_QUIZ_HISTORY_KEY, QUIZ_HISTORY_KEY);
  histories.value = getStoredItem<QuizHistory[]>(QUIZ_HISTORY_KEY, [], Array.isArray);

  // 2. Wrong Notes 마이그레이션 및 초기화
  migrateLegacyKey(LEGACY_QUIZ_WRONG_NOTES_KEY, QUIZ_WRONG_NOTES_KEY);
  wrongNotes.value = getStoredItem<WrongNoteItem[]>(QUIZ_WRONG_NOTES_KEY, [], Array.isArray);

  // 3. Bookmarked IDs 마이그레이션 및 초기화
  migrateLegacyKey(LEGACY_QUIZ_BOOKMARKS_KEY, QUIZ_BOOKMARKS_KEY);
  bookmarkedIds.value = getStoredItem<number[]>(QUIZ_BOOKMARKS_KEY, [], Array.isArray);

  // watch 자동 저장
  watch(
    histories,
    (newVal) => {
      setStoredItem(QUIZ_HISTORY_KEY, newVal);
    },
    { deep: true }
  );

  watch(
    wrongNotes,
    (newVal) => {
      setStoredItem(QUIZ_WRONG_NOTES_KEY, newVal);
    },
    { deep: true }
  );

  watch(
    bookmarkedIds,
    (newVal) => {
      setStoredItem(QUIZ_BOOKMARKS_KEY, newVal);
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
