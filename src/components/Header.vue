<script setup lang="ts">
import type { HeaderProps } from '@/types/components';

withDefaults(defineProps<HeaderProps>(), {
  title: '다이빙 정산요정',
  subtitle: 'Diving Pool Cost Calculation 🧜‍♂️',
});
</script>

<template>
  <header class="header">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </header>
</template>
