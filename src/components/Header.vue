<script setup lang="ts">
interface Props {
  title?: string;
  subtitle?: string;
}

withDefaults(defineProps<Props>(), {
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
