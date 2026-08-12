<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div
        ref="modalCardRef"
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        tabindex="-1"
      >
        <div class="modal-header">
          <h3 id="confirm-modal-title">{{ title }}</h3>
        </div>
        <div class="modal-body">
          <p id="confirm-modal-description">{{ message }}</p>
        </div>
        <div class="modal-footer">
          <CustomButton
            ref="cancelBtnRef"
            variant="ghost"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </CustomButton>
          <CustomButton
            ref="confirmBtnRef"
            variant="primary"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </CustomButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, type ComponentPublicInstance } from 'vue';
import CustomButton from '@/components/CustomButton.vue';
import type { ConfirmModalProps } from '@/types/components';

const props = withDefaults(defineProps<ConfirmModalProps>(), {
  confirmText: '확인',
  cancelText: '취소'
});

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const modalCardRef = ref<HTMLElement | null>(null);
const confirmBtnRef = ref<ComponentPublicInstance | null>(null);

const focusModal = async () => {
  await nextTick();
  if (props.show) {
    if (confirmBtnRef.value?.$el && typeof confirmBtnRef.value.$el.focus === 'function') {
      confirmBtnRef.value.$el.focus();
    } else if (modalCardRef.value) {
      modalCardRef.value.focus();
    }
  }
};

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      focusModal();
    }
  },
  { immediate: true }
);

const handleKeyDown = (event: KeyboardEvent) => {
  if (props.show && (event.key === 'Escape' || event.key === 'Esc')) {
    emit('cancel');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
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
  outline: none;

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
