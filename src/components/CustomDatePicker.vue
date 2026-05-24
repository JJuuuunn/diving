<template>
  <div ref="containerRef" class="custom-datepicker">
    <!-- 1. 트리거 입력 필드 버튼 -->
    <div 
      class="datepicker-trigger" 
      :class="{ 'is-active': isOpen }" 
      @click="toggleCalendar"
    >
      <div class="trigger-content">
        <i class="fa-solid fa-calendar-days"></i>
        <span v-if="formattedValue">{{ formattedValue }}</span>
        <span v-else class="placeholder">{{ placeholder }}</span>
      </div>
      <i 
        class="fa-solid fa-chevron-down trigger-arrow" 
        :class="{ 'is-open': isOpen }"
      ></i>
    </div>

    <!-- 2. 플로팅 달력 팝오버 -->
    <transition name="fade-slide">
      <div v-if="isOpen" class="datepicker-popover">
        <!-- 달력 헤더 -->
        <div class="datepicker-header">
          <span class="datepicker-title" @click="handleHeaderClick">
            {{ headerLabel }}
            <i class="fa-solid fa-caret-down"></i>
          </span>
          <div class="datepicker-nav">
            <button class="datepicker-nav-btn" @click="handlePrev">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button class="datepicker-nav-btn" @click="handleNext">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <!-- 보기 모드 A: 일별 달력 뷰 -->
        <div v-if="viewMode === 'days'">
          <!-- 요일 행 -->
          <div class="datepicker-weekdays">
            <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
          </div>
          <!-- 날짜 그리드 -->
          <div class="datepicker-days-grid">
            <div 
              v-for="day in daysGrid" 
              :key="day.dateString" 
              class="datepicker-day-cell"
              :class="{
                'is-current-month': day.isCurrentMonth,
                'is-today': day.isToday,
                'is-selected': day.isSelected
              }"
              @click="handleSelectDay(day.dateString)"
            >
              {{ day.dayNumber }}
              <span v-if="day.hasLog" class="datepicker-log-badge"></span>
            </div>
          </div>
        </div>

        <!-- 보기 모드 B: 월 선택 뷰 -->
        <div v-else-if="viewMode === 'months'" class="datepicker-months-grid">
          <div 
            v-for="month in monthsList" 
            :key="month" 
            class="month-item"
            :class="{ 'is-selected': isMonthSelected(month) }"
            @click="selectMonth(month)"
          >
            {{ month + 1 }}월
          </div>
        </div>

        <!-- 보기 모드 C: 연도 선택 뷰 -->
        <div v-else-if="viewMode === 'years'" class="datepicker-years-grid">
          <div 
            v-for="year in yearsGrid" 
            :key="year" 
            class="year-item"
            :class="{ 'is-selected': isYearSelected(year) }"
            @click="selectYear(year)"
          >
            {{ year }}년
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { onClickOutside } from '@vueuse/core';
import { useCalendar } from '@/composables/useCalendar';
import { useLogbookStore } from '@/stores/logbook';

// Day.js의 요일 표기용 한국어 설정
dayjs.locale('ko');

// Props 및 Emits 정의 (Strict TypeScript 선언 규정 준수)
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
  }>(),
  {
    placeholder: '다이빙 일자 선택'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

// 팝오버 상태
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

// 스토어에서 다이빙 기록 목록을 동적으로 추적하여 물방울 배지 표시용 날짜 리스트 가공
const logbookStore = useLogbookStore();
const logDates = computed(() => {
  return logbookStore.logs.map(log => log.date);
});

// v-model 양방향 바인딩 설정
const selectedDate = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val)
});

// 핵심 비즈니스 로직은 useCalendar 컴포저블로 완전히 분리 (SoC 준수)
const {
  currentYear,
  currentMonth,
  viewMode,
  yearsGrid,
  monthsList,
  headerLabel,
  daysGrid,
  handlePrev,
  handleNext,
  selectMonth,
  selectYear,
  handleHeaderClick,
  syncToDate
} = useCalendar(selectedDate, logDates);

// 요일 정적 정보
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

// 트리거 표시용 한글 포맷 날짜 계산
const formattedValue = computed(() => {
  if (!props.modelValue) return '';
  const d = dayjs(props.modelValue);
  return d.isValid() ? d.format('YYYY-MM-DD (ddd)') : '';
});

// 달력 열고 닫기 핸들러 (열릴 때 입력된 날짜로 초점 동기화)
const toggleCalendar = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    syncToDate(props.modelValue);
  }
};

// 특정 날짜 선택 시 이벤트 전송 및 팝오버 닫기
const handleSelectDay = (dateStr: string) => {
  emit('update:modelValue', dateStr);
  isOpen.value = false;
};

// 월/연도 뷰 모드에서 활성 선택값 하이라이트 여부 판정 보조 함수
const isMonthSelected = (month: number): boolean => {
  if (!props.modelValue) return false;
  const d = dayjs(props.modelValue);
  return d.year() === currentYear.value && d.month() === month;
};

const isYearSelected = (year: number): boolean => {
  if (!props.modelValue) return false;
  return dayjs(props.modelValue).year() === year;
};

// VueUse를 활용한 영역 외부 클릭 자동 닫기 기능 바인딩
onClickOutside(containerRef, () => {
  isOpen.value = false;
});
</script>
