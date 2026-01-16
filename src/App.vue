<template>
  <div id="app-container">
    <button class="menu-toggle-floating" @click="toggleSidebar">
      <span v-html="menuIcon"></span>
    </button>
    
    <Left :isOpen="isSidebarOpen" @close="closeSidebar" />

    <main id="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Left from '@/layouts/Left.vue';
import menuIcon from '@/assets/icons/menu.svg?raw';

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<style lang="scss">
@import '@/assets/scss/main.scss';
</style>