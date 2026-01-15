<template>
  <Transition name="toast">
    <div v-if="visible" class="toast">
      <div :class="['toast-icon', isError ? 'error' : 'success']">
        <i :class="['fa-solid', isError ? 'fa-exclamation' : 'fa-check']"></i>
      </div>
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
  message: String,
  isError: Boolean
});
</script>
