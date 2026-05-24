import { ref, computed, type Ref } from 'vue';
import dayjs from 'dayjs';
import type { CalendarDay, CalendarViewMode } from '@/types/calendar';

export function useCalendar(
  selectedDate: Ref<string>,
  logDates: Ref<string[]>
) {
  // 현재 달력 뷰에서 보여주는 연도와 월 (월은 0부터 11까지)
  const currentYear = ref(dayjs(selectedDate.value || undefined).year());
  const currentMonth = ref(dayjs(selectedDate.value || undefined).month());

  // 달력의 보기 모드 ('days' | 'months' | 'years')
  const viewMode = ref<CalendarViewMode>('days');

  // 연도 선택 격자의 시작 연도
  const yearGridStart = ref(Math.floor(currentYear.value / 12) * 12);

  // 연도 및 월 라벨 표시용 계산된 변수
  const headerLabel = computed(() => {
    if (viewMode.value === 'days') {
      return `${currentYear.value}년 ${currentMonth.value + 1}월`;
    } else if (viewMode.value === 'months') {
      return `${currentYear.value}년`;
    } else {
      return `${yearGridStart.value}년 - ${yearGridStart.value + 11}년`;
    }
  });

  // 42개의 날짜 격자(6주) 생성 계산
  const daysGrid = computed<CalendarDay[]>(() => {
    const firstDayOfMonth = dayjs()
      .year(currentYear.value)
      .month(currentMonth.value)
      .date(1);

    // 첫날의 요일 (0: 일요일, 1: 월요일, ... 6: 토요일)
    const startDayOfWeek = firstDayOfMonth.day();

    // 일요일 시작 기준 격자 시작점 설정
    const gridStart = firstDayOfMonth.subtract(startDayOfWeek, 'day');

    const days: CalendarDay[] = [];
    const todayStr = dayjs().format('YYYY-MM-DD');
    const selectedStr = selectedDate.value;

    for (let i = 0; i < 42; i++) {
      const date = gridStart.add(i, 'day');
      const dateString = date.format('YYYY-MM-DD');

      days.push({
        date,
        dateString,
        dayNumber: date.date(),
        isCurrentMonth: date.month() === currentMonth.value,
        isToday: dateString === todayStr,
        isSelected: dateString === selectedStr,
        hasLog: logDates.value.includes(dateString)
      });
    }

    return days;
  });

  // 12개 연도 리스트 생성
  const yearsGrid = computed<number[]>(() => {
    const years: number[] = [];
    for (let i = 0; i < 12; i++) {
      years.push(yearGridStart.value + i);
    }
    return years;
  });

  // 월 리스트 (0 ~ 11)
  const monthsList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // 이전/다음 달, 연도, 연도 범위 이동
  const handlePrev = () => {
    if (viewMode.value === 'days') {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else {
        currentMonth.value--;
      }
    } else if (viewMode.value === 'months') {
      currentYear.value--;
    } else {
      yearGridStart.value -= 12;
    }
  };

  const handleNext = () => {
    if (viewMode.value === 'days') {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else {
        currentMonth.value++;
      }
    } else if (viewMode.value === 'months') {
      currentYear.value++;
    } else {
      yearGridStart.value += 12;
    }
  };

  // 월 선택 처리
  const selectMonth = (month: number) => {
    currentMonth.value = month;
    viewMode.value = 'days';
  };

  // 연도 선택 처리
  const selectYear = (year: number) => {
    currentYear.value = year;
    yearGridStart.value = Math.floor(year / 12) * 12;
    viewMode.value = 'months';
  };

  // 헤더 클릭 시 모드 변경 순환
  const handleHeaderClick = () => {
    if (viewMode.value === 'days') {
      viewMode.value = 'months';
    } else if (viewMode.value === 'months') {
      viewMode.value = 'years';
    } else {
      viewMode.value = 'days';
    }
  };

  // 특정 날짜가 입력되었을 때 달력 초점을 해당 날짜로 동기화
  const syncToDate = (dateStr: string) => {
    if (!dateStr) return;
    const d = dayjs(dateStr);
    if (d.isValid()) {
      currentYear.value = d.year();
      currentMonth.value = d.month();
      yearGridStart.value = Math.floor(d.year() / 12) * 12;
    }
  };

  return {
    currentYear,
    currentMonth,
    viewMode,
    yearGridStart,
    headerLabel,
    daysGrid,
    yearsGrid,
    monthsList,
    handlePrev,
    handleNext,
    selectMonth,
    selectYear,
    handleHeaderClick,
    syncToDate
  };
}
