<template>
  <div
    class="custom-skeleton"
    :class="['type-' + type, getSizeClass('custom-skeleton', size)]"
  >
    <!-- 카드 타입 스켈레톤 디자인 -->
    <div v-if="type === 'card'" class="skeleton-card-layout">
      <div class="skeleton-shimmer-bar header-bar"></div>
      <div class="skeleton-card-body">
        <div class="skeleton-shimmer-bar detail-bar short"></div>
        <div class="skeleton-shimmer-bar detail-bar medium"></div>
        <div class="skeleton-shimmer-bar detail-bar long"></div>
      </div>
      <div class="skeleton-card-footer">
        <div class="skeleton-shimmer-bar tip-bar"></div>
      </div>
    </div>

    <!-- 리스트 타입 스켈레톤 디자인 -->
    <div v-else-if="type === 'list'" class="skeleton-list-layout">
      <div class="skeleton-shimmer-bar list-item-avatar"></div>
      <div class="skeleton-list-body">
        <div class="skeleton-shimmer-bar detail-bar medium"></div>
        <div class="skeleton-shimmer-bar detail-bar short"></div>
      </div>
    </div>

    <!-- 텍스트 단일 라인 스켈레톤 디자인 -->
    <div v-else class="skeleton-shimmer-bar text-bar"></div>
  </div>
</template>

<script setup lang="ts">
import type { SkeletonProps } from '@/types/components';
import { getSizeClass } from '@/utils/size';

withDefaults(defineProps<SkeletonProps>(), {
  type: 'card',
  size: 'md'
});
</script>
