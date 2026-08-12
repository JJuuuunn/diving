import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import type { Competition, CompetitionFeed } from '@/types/competition';
import rawFeed from '@/data/competition-feed.json';
import { fetchCompetitionFeed, hasCompetitionApi } from '@/api/competitionApi';

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
const FEDERATION_SOURCE_URLS: Record<Competition['federation'], string> = {
  AIDA: 'https://www.aidainternational.org/Events/',
  CMAS: 'https://www.cmas.org/freediving/calendar.html'
};
const COMPETITION_ID_PATTERN = /^[A-Z][A-Z0-9]*-[A-Za-z0-9][A-Za-z0-9-]*$/;

export const COMPETITION_BOOKMARKS_STORAGE_KEY = 'diving:competition:bookmarks:v1';
export const LEGACY_BOOKMARKS_STORAGE_KEY = 'bookmarked-competitions-ids';
export const LEGACY_BOOKMARKS_V4_FLAG_KEY = 'competition-bookmarks-v4';

export const useCompetitionStore = defineStore('competition', () => {
  const feed = ref(rawFeed as CompetitionFeed);
  const competitions = computed(() => feed.value.events);

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const current = localStorage.getItem(COMPETITION_BOOKMARKS_STORAGE_KEY);
    const legacyBookmarks = localStorage.getItem(LEGACY_BOOKMARKS_STORAGE_KEY);
    const legacyV4Flag = localStorage.getItem(LEGACY_BOOKMARKS_V4_FLAG_KEY);

    if (!current && legacyBookmarks !== null) {
      try {
        const parsed = JSON.parse(legacyBookmarks);
        if (Array.isArray(parsed)) {
          const needsV4Mapping = !legacyV4Flag;
          const mapped = needsV4Mapping
            ? [...new Set(parsed.map((id: string) => LEGACY_IDS[id] ?? id))]
            : parsed;
          localStorage.setItem(COMPETITION_BOOKMARKS_STORAGE_KEY, JSON.stringify(mapped));
        }
      } catch {
        // Safe handle malformed legacy data
      }
    }

    if (legacyBookmarks !== null) localStorage.removeItem(LEGACY_BOOKMARKS_STORAGE_KEY);
    if (legacyV4Flag !== null) localStorage.removeItem(LEGACY_BOOKMARKS_V4_FLAG_KEY);
  }

  const bookmarkedIds = useStorage<string[]>(COMPETITION_BOOKMARKS_STORAGE_KEY, []);
  const hasLoadedApi = ref(false);
  const isRequestingApi = ref(false);
  const isLoadingApi = ref(hasCompetitionApi());

  const toggleBookmark = (id: string): void => {
    bookmarkedIds.value = bookmarkedIds.value.includes(id)
      ? bookmarkedIds.value.filter((bookmarkedId) => bookmarkedId !== id)
      : [...bookmarkedIds.value, id];
  };

  const isBookmarked = (id: string): boolean => bookmarkedIds.value.includes(id);

  const loadLatestCompetitions = async (): Promise<void> => {
    if (hasLoadedApi.value || isRequestingApi.value) return;
    if (!hasCompetitionApi()) {
      isLoadingApi.value = false;
      return;
    }

    isRequestingApi.value = true;
    isLoadingApi.value = true;
    try {
      const payload = await fetchCompetitionFeed();
      const rows = (payload.data ?? payload.rows) as Record<string, unknown>[] | undefined;
      if (payload.ok === false || !Array.isArray(rows)) return;

      const events = rows.flatMap((row): Competition[] => {
        const id = String(row.id ?? '');
        const sourceEventId = String(row.sourceEventId ?? '');
        const title = String(row.title ?? '');
        const federation = String(row.federation ?? '').toUpperCase();
        const startDate = toKstDate(row.startDate);
        const officialUrl = String(row.officialUrl ?? '');
        if (
          !COMPETITION_ID_PATTERN.test(id)
          || id.slice(id.indexOf('-') + 1) !== sourceEventId
          || !['AIDA', 'CMAS'].includes(federation)
          || !title
          || !startDate
          || !officialUrl
        ) {
          return [];
        }
        return [{
          id,
          sourceEventId,
          title,
          federation: federation as Competition['federation'],
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
          sourceUrl: String(
            row.sourceUrl || FEDERATION_SOURCE_URLS[federation as Competition['federation']]
          ),
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
      hasLoadedApi.value = true;
    } catch {
      // The committed, validated snapshot remains available as the offline fallback.
    } finally {
      isRequestingApi.value = false;
      isLoadingApi.value = false;
    }
  };

  return {
    feed,
    competitions,
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    isLoadingApi,
    loadLatestCompetitions
  };
});
