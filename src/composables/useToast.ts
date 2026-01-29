import { reactive } from 'vue';

// 토스트 아이템의 타입 정의
export interface ToastItem {
    id: number;
    message: string;
    isError: boolean;
}

// 상태의 타입 정의
interface ToastState {
    items: ToastItem[];
}

// 전역 상태 (싱글톤)
const toastState = reactive<ToastState>({
    items: []
});

export function useToast() {
    // 토스트 삭제
    const removeToast = (id: number): void => {
        const index = toastState.items.findIndex((item) => item.id === id);
        if (index !== -1) {
            toastState.items.splice(index, 1);
        }
    };

    // 토스트 추가 (기본값 false 지정)
    const triggerToast = (message: string, isError: boolean = false): void => {
        const id = Date.now() + Math.random();

        const newToast: ToastItem = {
            id,
            message,
            isError
        };

        toastState.items.push(newToast);

        // 2.5초 후 자동 삭제
        setTimeout(() => {
            removeToast(id);
        }, 2500);
    };

    return {
        toastState,
        triggerToast,
        removeToast
    };
}