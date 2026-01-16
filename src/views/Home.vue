<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="fade-in-up">
        <span class="chunk">Deep Code,</span>
        <span class="chunk">Deep Breath</span>
      </h1>
      <p class="fade-in-up delay">필요한 기능을 하나씩 직접 만드는 JJuuuunn의 작업실.</p>
    </header>

    <main class="dashboard-cards">
      <component
        :is="item.active ? 'RouterLink' : 'div'"
        v-for="(item, index) in menuItems"
        :key="index"
        :to="item.active ? { name: item.route } : undefined"
        class="dashboard-card"
        :class="{ disabled: !item.active }"
        :style="{ animationDelay: `${index * 0.1}s` }" 
      >
        <div class="card-icon">
          <span v-html="item.icon"></span>
        </div>
        <div class="card-info">
          <h2>{{ item.title }}</h2>
          <p>{{ item.desc }}</p>
        </div>
        <div v-if="item.active" class="card-go">→</div>
        <div v-else class="status-badge">Preparing</div>
      </component>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterName } from '@/mappings/enum';

// 아이콘을 Raw String으로 import (색상 변경을 위해 필수)
import calculatorIcon from '@/assets/icons/calculator.svg?raw';
import bookIcon from '@/assets/icons/book.svg?raw';
import divingMaskIcon from '@/assets/icons/diving-mask.svg?raw';

// 메뉴 데이터 관리
const menuItems = [
  {
    title: '정산 요정',
    desc: '풀장 입장료 & 투어비 정산하기',
    icon: calculatorIcon,
    route: RouterName.Settlement,
    active: true,
  },
  {
    title: '문제 은행',
    desc: '다이빙 이론 시험 대비 (오픈 예정)',
    icon: bookIcon,
    route: '',
    active: false,
  },
  {
    title: '아이디어 로그',
    desc: '새로운 기능 구상 중...',
    icon: divingMaskIcon,
    route: '',
    active: false,
  },
  {
    title: '추천해주세요!',
    desc: '필요한 기능이 있다면 알려주세요.',
    icon: divingMaskIcon,
    route: '',
    active: false,
  },
];
</script>

<style lang="scss">
@import '@/assets/scss/pages/_home.scss';
</style>