<template>
  <div id="wrap">
    <div class="toggle-button" @click="toggleSidebar">
      <span>&#x2261;</span> <!-- Hamburger icon -->
    </div>
    <Left :isOpen="sidebarOpen" />
    <div id="container">
      <div class="container"> <!-- Removed conditional class binding -->
        <RouterView #="{ Component }">
          <template v-if="Component">
            <Suspense>
              <component :is="Component" />
            </Suspense>
          </template>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
// Removed RouterName import as it's no longer used in this component
import Left from '@/layouts/Left.vue';

// router
const route = useRoute();

const sidebarOpen = ref(false); // Default to closed

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
</script>

<style lang="scss">
@import '@/assets/scss/App.scss';
</style>