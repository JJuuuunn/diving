<template>
  <div v-if="hasError" class="custom-error-boundary" role="alert" aria-live="assertive">
    <slot name="fallback" :error="capturedError" :reset="resetError">
      <div class="custom-error-boundary__card">
        <div class="custom-error-boundary__icon" aria-hidden="true">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div class="custom-error-boundary__content">
          <h4 class="custom-error-boundary__title">{{ title || '컴포넌트를 불러오는 중 오류가 발생했습니다' }}</h4>
          <p class="custom-error-boundary__message">
            {{ message || '일시적인 렌더링 결함이 발생했습니다. 다시 시도하거나 페이지를 새로고침해주세요.' }}
          </p>
          <div v-if="showDetails && capturedError" class="custom-error-boundary__details">
            <code>{{ capturedError.message || String(capturedError) }}</code>
          </div>
        </div>
        <div class="custom-error-boundary__actions">
          <CustomButton size="sm" variant="outline" @click="resetError">
            <template #leading>
              <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            </template>
            다시 시도
          </CustomButton>
        </div>
      </div>
    </slot>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import CustomButton from '@/components/CustomButton.vue';

interface CustomErrorBoundaryProps {
  title?: string;
  message?: string;
  showDetails?: boolean;
  onCatch?: (error: unknown, info: string) => void;
}

const props = withDefaults(defineProps<CustomErrorBoundaryProps>(), {
  title: '',
  message: '',
  showDetails: false,
  onCatch: undefined
});

const emit = defineEmits<{
  (e: 'error', error: unknown, info: string): void;
  (e: 'reset'): void;
}>();

const hasError = ref(false);
const capturedError = ref<Error | null>(null);
const capturedInfo = ref<string>('');

onErrorCaptured((err: unknown, _instance, info: string) => {
  hasError.value = true;
  capturedError.value = err instanceof Error ? err : new Error(String(err));
  capturedInfo.value = info;

  emit('error', err, info);
  if (props.onCatch) {
    props.onCatch(err, info);
  }

  // 에러 전파를 중단하여 상위 컴포넌트 트리 크래시 방지
  return false;
});

const resetError = () => {
  hasError.value = false;
  capturedError.value = null;
  capturedInfo.value = '';
  emit('reset');
};

defineExpose({
  hasError,
  capturedError,
  resetError
});
</script>

<style scoped lang="scss">
.custom-error-boundary {
  width: 100%;
  padding: 1rem 0;

  &__card {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.25rem 1.5rem;
    border-radius: var(--radius-lg, 12px);
    background: var(--page-card-bg, rgba(15, 23, 42, 0.45));
    border: 1px solid var(--danger-border, rgba(239, 68, 68, 0.35));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    flex-wrap: wrap;

    body:not(.dark) & {
      background: var(--page-card-bg, #ffffff);
      border-color: rgba(239, 68, 68, 0.3);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }
  }

  &__icon {
    font-size: 1.75rem;
    color: var(--danger-text, #ef4444);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 240px;
  }

  &__title {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #f8fafc);

    body:not(.dark) & {
      color: var(--text-primary, #0f172a);
    }
  }

  &__message {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted, #94a3b8);
    line-height: 1.4;

    body:not(.dark) & {
      color: var(--text-muted, #64748b);
    }
  }

  &__details {
    margin-top: 0.5rem;
    padding: 0.35rem 0.65rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: var(--radius-sm, 4px);
    font-size: 0.75rem;
    color: #fca5a5;
    word-break: break-all;
  }

  &__actions {
    flex-shrink: 0;
  }
}
</style>
