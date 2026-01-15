<template>
  <div class="home-page">
    <h1>Welcome to Diving App!</h1>
    <p>This is the main page of your application.</p>
    <nav>
      <RouterLink :to="{ name: RouterName.Settlement }">Go to Settlement Page</RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts"> // Changed to ts to allow RouterName import
import { RouterName } from '@/mappings/enum'; // Import RouterName
</script>

<style lang="scss">
@import '@/assets/scss/views/Home.scss';
</style>