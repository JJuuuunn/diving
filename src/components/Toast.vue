<template>
  <div class="toast-container">
    <TransitionGroup name="toast-list">
      <div 
        v-for="item in toastState.items" 
        :key="item.id" 
        class="toast"
        @click="removeToast(item.id)"
      >
        <div :class="['toast-icon', item.isError ? 'error' : 'success']">
          <i :class="['fa-solid', item.isError ? 'fa-exclamation' : 'fa-check']"></i>
        </div>
        <span class="toast-message">{{ item.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

// 타입스크립트가 자동으로 useToast의 반환 타입을 추론합니다.
const { toastState, removeToast } = useToast();
</script>

<style lang="scss">
@import '@/assets/scss/components/_toast.scss';
</style>
