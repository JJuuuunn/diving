<template>
  <div class="not-found">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <RouterLink :to="{ name: RouterName.Home }">Go to Main Page</RouterLink>
  </div>
</template>

<script setup lang="ts"> // Changed to ts to allow RouterName import
import { RouterName } from '@/mappings/enum'; // Import RouterName
</script>

<style lang="scss">
@import '@/assets/scss/views/NotFound.scss';
</style>
