import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import type { CompetitionFeed } from '@/types/competition';
import rawFeed from '@/data/competition-feed.json';

const LEGACY_IDS: Record<string, string> = {};

export const useCompetitionStore = defineStore('competition', () => {
  const feed = rawFeed as CompetitionFeed;
  const competitions = feed.events;
  const bookmarkedIds = useStorage<string[]>('bookmarked-competitions-ids', []);

  // One-time compatibility pass. Unknown legacy IDs are intentionally retained:
  // a future official event may provide a migration mapping.
  if (typeof window !== 'undefined' && !localStorage.getItem('competition-bookmarks-v2')) {
    bookmarkedIds.value = [...new Set(bookmarkedIds.value.map((id) => LEGACY_IDS[id] ?? id))];
    localStorage.setItem('competition-bookmarks-v2', 'done');
  }

  const toggleBookmark = (id: string): void => {
    bookmarkedIds.value = bookmarkedIds.value.includes(id)
      ? bookmarkedIds.value.filter((bookmarkedId) => bookmarkedId !== id)
      : [...bookmarkedIds.value, id];
  };

  const isBookmarked = (id: string): boolean => bookmarkedIds.value.includes(id);

  return { feed, competitions, bookmarkedIds, toggleBookmark, isBookmarked };
});
