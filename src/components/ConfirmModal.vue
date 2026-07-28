<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" @click="emit('cancel')">
            {{ cancelText }}
          </button>
          <button class="modal-btn confirm-btn" @click="emit('confirm')">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { ConfirmModalProps } from '@/types/components';

withDefaults(defineProps<ConfirmModalProps>(), {
  confirmText: '확인',
  cancelText: '취소'
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4); // 다크 백드롭
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal-card {
  width: 90%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transform: scale(1);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  body.dark & {
    background: rgba(30, 41, 59, 0.85);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
}

.modal-header {
  h3 {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    body.dark & {
      background: linear-gradient(135deg, #38bdf8, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

.modal-body {
  p {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--page-text-primary);
    margin: 0;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.modal-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: transparent;
  border-color: rgba(0, 0, 0, 0.15);
  color: var(--page-text-primary);

  body.dark & {
    border-color: rgba(255, 255, 255, 0.15);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    body.dark & { background: rgba(255, 255, 255, 0.05); }
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);

  &:hover {
    opacity: 0.95;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  }
}

// 트랜지션 효과
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;

  .modal-card {
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-card {
    transform: scale(0.92);
  }
}
</style>
