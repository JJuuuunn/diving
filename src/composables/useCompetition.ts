import { computed, ref } from 'vue';
import type {
  Competition,
  CompetitionFilters,
  EventStatus
} from '@/types/competition';
import { useCompetitionStore } from '@/stores/competition';

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

export const getKstDateString = (now = new Date()): string =>
  new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);

export const getCompetitionStatus = (
  competition: Pick<Competition, 'startDate' | 'endDate'>,
  today = getKstDateString()
): EventStatus => {
  const endDate = competition.endDate ?? competition.startDate;
  if (today < competition.startDate) return 'upcoming';
  if (today <= endDate) return 'ongoing';
  return 'ended';
};

export const sortCompetitions = (events: Competition[], today = getKstDateString()): Competition[] =>
  [...events].sort((a, b) => {
    const aEnded = getCompetitionStatus(a, today) === 'ended';
    const bEnded = getCompetitionStatus(b, today) === 'ended';
    if (aEnded !== bEnded) return aEnded ? 1 : -1;
    return aEnded
      ? (b.endDate ?? b.startDate).localeCompare(a.endDate ?? a.startDate)
      : a.startDate.localeCompare(b.startDate);
  });

export function useCompetition() {
  const store = useCompetitionStore();
  const filters = ref<CompetitionFilters>({
    searchQuery: '',
    federation: 'all',
    type: 'all',
    status: 'all',
    bookmarkedOnly: false
  });

  const resetFilters = () => {
    filters.value = {
      searchQuery: '',
      federation: 'all',
      type: 'all',
      status: 'all',
      bookmarkedOnly: false
    };
  };

  const filteredCompetitions = computed(() => {
    const query = filters.value.searchQuery.trim().toLocaleLowerCase('ko');
    const matches = store.competitions.filter((competition) => {
      const haystack = [
        competition.title,
        competition.venue,
        competition.city
      ].filter(Boolean).join(' ').toLocaleLowerCase('ko');
      return (!query || haystack.includes(query))
        && (filters.value.federation === 'all' || competition.federation === filters.value.federation)
        && (filters.value.type === 'all' || competition.type === filters.value.type)
        && (filters.value.status === 'all' || getCompetitionStatus(competition) === filters.value.status)
        && (!filters.value.bookmarkedOnly || store.isBookmarked(competition.id));
    });
    return sortCompetitions(matches);
  });

  const bookmarkedCompetitions = computed(() =>
    sortCompetitions(store.competitions.filter((competition) => store.isBookmarked(competition.id)))
  );
  const upcomingCompetitions = computed(() =>
    sortCompetitions(store.competitions.filter((competition) =>
      getCompetitionStatus(competition) !== 'ended'
    ))
  );

  return {
    feed: store.feed,
    filters,
    resetFilters,
    filteredCompetitions,
    bookmarkedCompetitions,
    upcomingCompetitions,
    getCompetitionStatus,
    toggleBookmark: store.toggleBookmark,
    isBookmarked: store.isBookmarked,
    isLoadingApi: computed(() => store.isLoadingApi),
    loadLatestCompetitions: store.loadLatestCompetitions
  };
}
