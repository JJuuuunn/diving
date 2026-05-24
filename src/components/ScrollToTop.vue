<template>
  <transition name="pop-in">
    <div 
      v-if="isVisible" 
      class="scroll-to-top-gauge" 
      @click="scrollToTop"
      title="수면으로 상승하기 (맨 위로)"
    >
      <!-- 산소 탱크 압력계 게이지 테두리 (SVG 원형 프로그레스) -->
      <svg class="pressure-gauge-svg" viewBox="0 0 50 50">
        <!-- 배경 링 -->
        <circle 
          class="gauge-bg-track" 
          cx="25" 
          cy="25" 
          r="21" 
        />
        <!-- 전면 프로그레스 링 -->
        <circle 
          class="gauge-progress-fill" 
          cx="25" 
          cy="25" 
          r="21" 
          :style="gaugeCircleStyle"
        />
      </svg>

      <!-- 산소 탱크/바다 컨셉 내부 아이콘 -->
      <div class="gauge-inner-content">
        <i class="fa-solid fa-gauge-simple-high gauge-icon"></i>
        <span class="gauge-text">{{ scrollPercentage }}%</span>
      </div>

      <!-- 마우스 호버 시 올라오는 작은 공기 방울 파티클 모사 데코 -->
      <div class="bubbles-deco">
        <span class="bubble"></span>
        <span class="bubble"></span>
        <span class="bubble"></span>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useScrollProgress } from '@/composables/useScrollProgress';

// 스크롤 트래킹 및 제어 로직은 컴포저블로 완전히 분리 (SoC 준수)
const { scrollPercentage, isVisible, scrollToTop } = useScrollProgress(250);

// SVG 원의 둘레 계산 (반지름 r = 21)
// 둘레(Circumference) = 2 * Math.PI * r = 2 * 3.14159 * 21 ≈ 131.95
const strokeCircumference = 131.95;

// 게이지 원형 테두리 선 스타일 계산
const gaugeCircleStyle = computed(() => {
  const percentage = Math.min(Math.max(scrollPercentage.value, 0), 100);
  const offset = strokeCircumference - (percentage / 100) * strokeCircumference;
  
  return {
    strokeDasharray: `${strokeCircumference}`,
    strokeDashoffset: `${offset}`
  };
});
</script>
