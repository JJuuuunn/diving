<template>
  <div class="not-found-container">
    <div 
      v-for="n in 30" 
      :key="n" 
      class="bubble" 
      :style="getBubbleStyle()"
    ></div>

    <div class="content-box">
      <h1 class="error-code">404m</h1>
      <h2 class="error-message">앗! 너무 깊이 들어오셨어요.</h2>
      
      <p class="description">
        여기는 빛도 닿지 않는 <strong>수심 404미터</strong>입니다.<br>
        찾으시는 페이지는 조류에 떠내려갔거나 존재하지 않습니다.<br>
        공기가 부족해지기 전에 안전하게 상승하세요!
      </p>

      <RouterLink :to="{ name: RouterName.Main }" class="ascend-btn">
        <img src="@/assets/icons/diving-mask.svg" alt="Diving Mask" class="btn-icon" />
        수면으로 상승하기 (메인)
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterName } from '@/mappings/enum';

// 버블 스타일 랜덤 생성 함수
const getBubbleStyle = () => {
  const size = Math.random() * 60 + 10;   // 크기: 10px ~ 70px
  const duration = Math.random() * 10 + 5; // 속도: 5초 ~ 15초
  const delay = Math.random() * 5;        // 딜레이: 0초 ~ 5초
  const left = Math.random() * 100;       // 위치: 0% ~ 100%

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    opacity: Math.random() * 0.4 + 0.1    // 투명도 랜덤
  };
};
</script>

<style lang="scss">
@import '@/assets/scss/pages/_not-found.scss';
</style>