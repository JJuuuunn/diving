import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { Competition } from '@/types/competition';
import rawCompetitions from '@/data/competitions.json';

export const useCompetitionStore = defineStore('competition', () => {
  const competitions = rawCompetitions as Competition[];
  
  // VueUse useStorage를 이용해 관심 등록된 대회 ID 리스트를 로컬스토리지에 완벽 동기화
  const bookmarkedIds = useStorage<string[]>('bookmarked-competitions-ids', []);

  const toggleBookmark = (id: string): void => {
    if (bookmarkedIds.value.includes(id)) {
      bookmarkedIds.value = bookmarkedIds.value.filter((bId) => bId !== id);
    } else {
      bookmarkedIds.value.push(id);
    }
  };

  const isBookmarked = (id: string): boolean => {
    return bookmarkedIds.value.includes(id);
  };

  return {
    competitions,
    bookmarkedIds,
    toggleBookmark,
    isBookmarked
  };
});
