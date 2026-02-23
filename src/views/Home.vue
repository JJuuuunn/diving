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
        v-for="(item, index) in dashboardItems"
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
import { computed } from 'vue';
import { RouterName } from '@/mappings/enum';
import { MENU_ITEMS } from '@/mappings/menu';

// 계산된 속성을 사용하여 Home 항목을 필터링
const dashboardItems = computed(() => 
  MENU_ITEMS.filter(item => item.route !== RouterName.Main)
);
</script>

<style lang="scss" scoped>
@import '@/assets/scss/pages/_home.scss';
</style>