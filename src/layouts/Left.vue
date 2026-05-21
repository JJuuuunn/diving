<template>
  <div id="sidebar-overlay" :class="{ 'is-open': isOpen }" @click.self="$emit('close')">
    <aside id="left-sidebar">
      <header class="sidebar-header">
        <RouterLink :to="{ name: RouterName.Main }" class="brand-logo" @click="$emit('close')">
          <span class="logo-icon" v-html="divingMaskIcon"></span>
          <span class="logo-text">JJuuuunn Diving</span>
        </RouterLink>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </header>

      <nav class="sidebar-nav">
        <ul>
          <li v-for="item in activeMenuItems" :key="item.label">
            <RouterLink :to="{ name: item.route }" custom v-slot="{ href, navigate, isActive, isExactActive }">
              <a 
                :href="href" 
                @click="navigate(); $emit('close')" 
                :class="{ 'router-link-active': item.route === RouterName.Main ? isExactActive : isActive }"
              >
                <span class="icon" v-html="item.icon"></span>
                <span>{{ item.label }}</span>
              </a>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <footer class="sidebar-footer">
        <DarkModeToggle v-model="isDay" />
        <p>Designed for Divers 🤿</p>
        <div class="links">
          <a href="https://github.com/JJuuuunn" target="_blank" rel="noopener noreferrer">GitHub</a> | 
          <a href="https://www.instagram.com/jjuuuunn.hob" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterName } from '@/mappings/enum';
import { MENU_ITEMS } from '@/mappings/menu'; // 중앙 관리 데이터
import divingMaskIcon from '@/assets/icons/diving-mask.svg?raw';
import DarkModeToggle from '@/components/DarkModeToggle.vue';
import { useThemeStore } from '@/stores/theme';

defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);

// 활성화된 메뉴만 필터링
const activeMenuItems = computed(() => MENU_ITEMS.filter(item => item.active));

// 테마 관리 로직 (Pinia 및 VueUse 기반 선언적 상태 관리로 전환)
const themeStore = useThemeStore();
const isDay = computed({
  get: () => !themeStore.isDark,
  set: (val) => {
    themeStore.isDark = !val;
  }
});
</script>

<style lang="scss" scoped>
@import '@/assets/scss/layout/_sidebar.scss';
</style>