<template>
  <div id="app-container">
    <button class="menu-toggle-floating" @click="toggleSidebar">
      <span v-html="menuIcon"></span>
    </button>
    
    <Left :isOpen="isSidebarOpen" @close="closeSidebar" />

    <main id="main-content">
      <RouterView />
    </main>

    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Left from '@/layouts/Left.vue';
import menuIcon from '@/assets/icons/menu.svg?raw';

// [추가] AppToast 컴포넌트 가져오기
// (경로가 components 폴더 아래라고 가정했습니다. 실제 경로에 맞춰주세요)
import AppToast from '@/components/Toast.vue'; 

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