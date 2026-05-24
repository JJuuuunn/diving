import { ref, computed, onUnmounted } from 'vue';
import dayjs from 'dayjs';
import type { Competition, CompetitionFilters, CompetitionCountdown } from '@/types/competition';
import { useCompetitionStore } from '@/stores/competition';

export function useCompetition() {
  const compStore = useCompetitionStore();

  // 기본 검색 필터 상태 정의
  const filters = ref<CompetitionFilters>({
    searchQuery: '',
    federation: 'all',
    type: 'all',
    locationType: 'all',
    status: 'all'
  });

  // 오늘 날짜 문자열 구하기 (YYYY-MM-DD)
  const todayStr = computed((): string => dayjs().format('YYYY-MM-DD'));

  // 개별 대회의 접수 및 진행 상태 산출 핵심 비즈니스 로직
  const getCompetitionStatus = (comp: Competition): 'registering' | 'upcoming' | 'ongoing' | 'closed' => {
    const today = dayjs();
    const regStart = dayjs(comp.regStartDate);
    const regEnd = dayjs(comp.regEndDate);
    const compStart = dayjs(comp.startDate);
    const compEnd = dayjs(comp.endDate);

    // 1. 현재 대회가 개최 진행 중인지 판별
    if (today.isAfter(compStart.subtract(1, 'day')) && today.isBefore(compEnd.add(1, 'day'))) {
      return 'ongoing';
    }

    // 2. 현재 접수 기간 중인지 판별
    if (today.isAfter(regStart.subtract(1, 'day')) && today.isBefore(regEnd.add(1, 'day'))) {
      return 'registering';
    }

    // 3. 접수 시작 전인 예정 상태인지 판별
    if (today.isBefore(regStart)) {
      return 'upcoming';
    }

    // 4. 그 외에는 마감 상태로 처리
    return 'closed';
  };

  // 특정 목표 날짜까지의 D-Day 계산 유틸리티
  const getDDay = (targetDateStr: string): string => {
    const today = dayjs().startOf('day');
    const target = dayjs(targetDateStr).startOf('day');
    const diff = target.diff(today, 'day');

    if (diff === 0) return 'D-Day';
    return diff > 0 ? `D-${diff}` : `마감`;
  };

  // 필터 및 검색 조건이 반영된 가공된 대회 리스트 산출
  const filteredCompetitions = computed((): Competition[] => {
    return compStore.competitions.filter((comp) => {
      // 1. 키워드 검색 (대회명, 개최 장소)
      const matchesSearch =
        comp.title.toLowerCase().includes(filters.value.searchQuery.toLowerCase()) ||
        comp.location.toLowerCase().includes(filters.value.searchQuery.toLowerCase());

      // 2. 주관 협회 필터
      const matchesFed =
        filters.value.federation === 'all' || comp.federation === filters.value.federation;

      // 3. 실내 풀장 / 실외 수심 필터
      const matchesType =
        filters.value.type === 'all' || comp.type === filters.value.type;

      // 4. 국내외 개최지 필터
      const matchesLoc =
        filters.value.locationType === 'all' || comp.locationType === filters.value.locationType;

      // 5. 대회 접수/진행 상태 필터
      const matchesStatus =
        filters.value.status === 'all' || getCompetitionStatus(comp) === filters.value.status;

      return matchesSearch && matchesFed && matchesType && matchesLoc && matchesStatus;
    });
  });

  // 1. 접수 마감 임박: 접수 중/접수 예정 대회 중 regEndDate가 가장 가까운 대회 선출
  const nearestRegCompetition = computed((): Competition | null => {
    const today = dayjs();
    const targetComps = compStore.competitions.filter((comp) => {
      const status = getCompetitionStatus(comp);
      return (status === 'registering' || status === 'upcoming') &&
        dayjs(comp.regEndDate).isAfter(today);
    });

    if (targetComps.length === 0) return null;

    // 접수 마감일이 가장 가까운 순으로 정렬
    return [...targetComps].sort((a, b) => dayjs(a.regEndDate).diff(dayjs(b.regEndDate)))[0];
  });

  // 2. 대회 개막 임박: 아직 시작되지 않은 대회 중 startDate가 가장 가까운 대회 선출
  const nearestCompCompetition = computed((): Competition | null => {
    const today = dayjs();
    const targetComps = compStore.competitions.filter((comp) => {
      return dayjs(comp.startDate).isAfter(today);
    });

    if (targetComps.length === 0) return null;

    // 대회 시작일이 가장 가까운 순으로 정렬
    return [...targetComps].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)))[0];
  });

  // 접수 마감 카운트다운 반응형 데이터
  const regCountdown = ref<CompetitionCountdown>({
    title: '',
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: true
  });

  // 대회 개막 카운트다운 반응형 데이터
  const compCountdown = ref<CompetitionCountdown>({
    title: '',
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: true
  });

  let countdownIntervalId: number | null = null;

  // 밀리초를 days/hours/minutes/seconds 객체로 분해하는 순수 유틸리티
  const msToCountdown = (diffMs: number): Pick<CompetitionCountdown, 'days' | 'hours' | 'minutes' | 'seconds'> => {
    const totalSeconds = Math.floor(diffMs / 1000);
    return {
      days: Math.floor(totalSeconds / (3600 * 24)),
      hours: Math.floor((totalSeconds % (3600 * 24)) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  };

  // 실시간으로 두 카운트다운을 독립적으로 업데이트하는 액션
  const startCountdown = (): void => {
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    const update = () => {
      const now = dayjs();

      // --- 접수 마감 타이머 계산 ---
      const regComp = nearestRegCompetition.value;
      if (!regComp) {
        regCountdown.value.isOver = true;
      } else {
        const diffMs = dayjs(regComp.regEndDate).endOf('day').diff(now);
        if (diffMs <= 0) {
          regCountdown.value = { title: regComp.title, days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
        } else {
          regCountdown.value = { title: regComp.title, ...msToCountdown(diffMs), isOver: false };
        }
      }

      // --- 대회 개막 타이머 계산 ---
      const compComp = nearestCompCompetition.value;
      if (!compComp) {
        compCountdown.value.isOver = true;
      } else {
        const diffMs = dayjs(compComp.startDate).startOf('day').diff(now);
        if (diffMs <= 0) {
          compCountdown.value = { title: compComp.title, days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
        } else {
          compCountdown.value = { title: compComp.title, ...msToCountdown(diffMs), isOver: false };
        }
      }
    };

    update();
    countdownIntervalId = window.setInterval(update, 1000);
  };

  onUnmounted(() => {
    if (countdownIntervalId) clearInterval(countdownIntervalId);
  });

  // 관심 등록된 대회만 선별
  const bookmarkedCompetitions = computed((): Competition[] => {
    return compStore.competitions.filter((comp) => compStore.isBookmarked(comp.id));
  });

  return {
    filters,
    todayStr,
    getCompetitionStatus,
    getDDay,
    filteredCompetitions,
    nearestRegCompetition,
    nearestCompCompetition,
    regCountdown,
    compCountdown,
    startCountdown,
    bookmarkedCompetitions,
    toggleBookmark: compStore.toggleBookmark,
    isBookmarked: compStore.isBookmarked
  };
}
