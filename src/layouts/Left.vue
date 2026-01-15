<template>
  <aside id="left" :class="{ 'is-open': isOpen }">
    <nav v-if="isOpen" class="sidebar-nav">
      <p>Left Sidebar</p>
      <ul>
        <li><RouterLink :to="{ name: RouterName.Main }">Home</RouterLink></li>
        <li><RouterLink :to="{ name: RouterName.Settlement }">Settlement</RouterLink></li>
      </ul>

      <div class="sidebar-footer-actions">
        <div class="dark-mode-toggle">
          <label for="darkModeToggle">Dark Mode</label>
          <input type="checkbox" id="darkModeToggle" v-model="isDarkMode" />
        </div>
        <!-- Removed Copy URL button and feedback -->
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'; // Removed defineProps
import { RouterName } from '@/mappings/enum'; // Import RouterName

// Props
const props = defineProps<{
  isOpen: boolean;
}>();

// Dark Mode logic
const isDarkMode = ref(false);

watch(isDarkMode, (newValue) => {
  if (newValue) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  localStorage.setItem('darkMode', newValue.toString());
});

onMounted(() => {
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    isDarkMode.value = true;
  }
});

// Removed URL Copy logic
</script>

<style lang="scss">
@import '@/assets/scss/layouts/Left.scss';
</style>
