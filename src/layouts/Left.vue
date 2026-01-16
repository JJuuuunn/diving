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
          <li>
            <RouterLink :to="{ name: RouterName.Main }" custom v-slot="{ href, navigate, isExactActive }">
              <a :href="href" @click="navigate(); $emit('close')" :class="{ 'router-link-exact-active': isExactActive }">
                <span class="icon" v-html="homeIcon"></span>
                <span>Home</span>
              </a>
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: RouterName.Settlement }" custom v-slot="{ href, navigate, isActive }">
              <a :href="href" @click="navigate(); $emit('close')" :class="{ 'router-link-active': isActive }">
                <span class="icon" v-html="calculatorIcon"></span>
                <span>Settlement</span>
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
import { ref, watch } from 'vue';
import { RouterName } from '@/mappings/enum';
/* SVG를 raw string으로 가져옴 */
import divingMaskIcon from '@/assets/icons/diving-mask.svg?raw';
import homeIcon from '@/assets/icons/home.svg?raw';
import calculatorIcon from '@/assets/icons/calculator.svg?raw';
import DarkModeToggle from '@/views/components/DarkModeToggle.vue';

defineProps<{
  isOpen: boolean;
}>();

defineEmits(['close']);

const isDay = ref(localStorage.getItem('isDay') === 'true');

const applyTheme = (isDayMode: boolean) => {
  if (isDayMode) {
    document.body.classList.remove('dark');
  } else {
    document.body.classList.add('dark');
  }
};

watch(isDay, (newValue) => {
  localStorage.setItem('isDay', String(newValue));
  applyTheme(newValue);
}, { immediate: true });
</script>

<style lang="scss">
@import '@/assets/scss/layout/_sidebar.scss';
</style>