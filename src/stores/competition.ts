import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import type { Competition, CompetitionFeed } from '@/types/competition';
import rawFeed from '@/data/competition-feed.json';

const toKstDate = (value: unknown): string => {
  const text = String(value ?? '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.valueOf())) return text;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const LEGACY_IDS: Record<string, string> = {
  'aida-0304f493bed1a3c1': 'AIDA-5166',
  'aida-bb-cup-ep05-2026': 'AIDA-4888',
  'aida-cuvier-cup-2026': 'AIDA-4904',
  'aida-freedivingfriends-cup-20-2026': 'AIDA-4938',
  'aida-korea-national-2026': 'AIDA-4950',
  'aida-bb-cup-ep07-2026': 'AIDA-4890',
  'aida-bb-cup-ep08-2026': 'AIDA-4891',
  'aida-korea-cup-series-2026-01': 'AIDA-5055',
  'aida-ida-gimhae-2026-05': 'AIDA-5057',
  'aida-freedivingfriends-cup-23-2026': 'AIDA-5076',
  'aida-freedivingfriends-cup-24-2026': 'AIDA-5166'
};

export const useCompetitionStore = defineStore('competition', () => {
  const feed = ref(rawFeed as CompetitionFeed);
  const competitions = computed(() => feed.value.events);
  const bookmarkedIds = useStorage<string[]>('bookmarked-competitions-ids', []);
  const hasLoadedApi = ref(false);

  // One-time compatibility pass. Unknown legacy IDs are intentionally retained:
  // a future official event may provide a migration mapping.
  if (typeof window !== 'undefined' && !localStorage.getItem('competition-bookmarks-v4')) {
    bookmarkedIds.value = [...new Set(bookmarkedIds.value.map((id) => LEGACY_IDS[id] ?? id))];
    localStorage.setItem('competition-bookmarks-v4', 'done');
  }

  const toggleBookmark = (id: string): void => {
    bookmarkedIds.value = bookmarkedIds.value.includes(id)
      ? bookmarkedIds.value.filter((bookmarkedId) => bookmarkedId !== id)
      : [...bookmarkedIds.value, id];
  };

  const isBookmarked = (id: string): boolean => bookmarkedIds.value.includes(id);

  const loadLatestCompetitions = async (): Promise<void> => {
    if (hasLoadedApi.value) return;
    hasLoadedApi.value = true;
    const apiUrl = (
      import.meta.env.VITE_COMPETITION_GOOGLE_APPS_SCRIPT_API_URL as string | undefined
    )?.trim();
    if (!apiUrl) return;

    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', 'competitions');
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        redirect: 'follow'
      });
      if (!response.ok) return;
      const payload = await response.json() as {
        ok?: boolean;
        data?: unknown[];
        rows?: unknown[];
        meta?: { generatedAt?: string };
      };
      const rows = (payload.data ?? payload.rows) as Record<string, unknown>[] | undefined;
      if (payload.ok === false || !Array.isArray(rows)) return;

      const events = rows.flatMap((row): Competition[] => {
        const id = String(row.id ?? '');
        const sourceEventId = String(row.sourceEventId ?? '');
        const title = String(row.title ?? '');
        const startDate = toKstDate(row.startDate);
        const officialUrl = String(row.officialUrl ?? '');
        if (!/^AIDA-[A-Za-z0-9-]+$/.test(id) || id !== `AIDA-${sourceEventId}` || !title || !startDate || !officialUrl) {
          return [];
        }
        return [{
          id,
          sourceEventId,
          title,
          federation: 'AIDA',
          type: ['pool', 'depth', 'mixed'].includes(String(row.type))
            ? row.type as Competition['type']
            : 'unknown',
          startDate,
          ...(row.endDate ? { endDate: toKstDate(row.endDate) } : {}),
          ...(row.venue ? { venue: String(row.venue) } : {}),
          ...(row.city ? { city: String(row.city) } : {}),
          countryCode: 'KR',
          registrationStatus: ['open', 'closed'].includes(String(row.registrationStatus))
            ? row.registrationStatus as Competition['registrationStatus']
            : 'unknown',
          officialUrl,
          sourceUrl: String(row.sourceUrl || 'https://www.aidainternational.org/Events/'),
          verifiedAt: toKstDate(row.verifiedAt)
        }];
      });
      if (!events.length) return;

      const generatedAt = payload.meta?.generatedAt && !Number.isNaN(Date.parse(payload.meta.generatedAt))
        ? payload.meta.generatedAt
        : new Date().toISOString();
      feed.value = {
        ...feed.value,
        generatedAt,
        sources: feed.value.sources.map((source) =>
          source.federation === 'AIDA' ? { ...source, fetchedAt: generatedAt } : source
        ),
        events
      };
    } catch {
      // The committed, validated snapshot remains available as the offline fallback.
    }
  };

  return {
    feed,
    competitions,
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    loadLatestCompetitions
  };
});
