import { useToastStore, type ToastItem } from '@/stores/toast';

export type { ToastItem };

export function useToast() {
    const toastStore = useToastStore();

    return {
        // 기존 toastState.items 참조 인터페이스와의 100% 하위 호환성 유지
        toastState: {
            get items() {
                return toastStore.items;
            }
        },
        triggerToast: toastStore.triggerToast,
        removeToast: toastStore.removeToast
    };
}