import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ToastItem {
  id: number;
  message: string;
  isError: boolean;
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([]);

  const removeToast = (id: number): void => {
    const index = items.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  };

  const triggerToast = (message: string, isError: boolean = false): void => {
    const id = Date.now() + Math.random();
    
    items.value.push({
      id,
      message,
      isError
    });

    // 2.5초 후 자동 삭제
    setTimeout(() => {
      removeToast(id);
    }, 2500);
  };

  return {
    items,
    removeToast,
    triggerToast
  };
});
