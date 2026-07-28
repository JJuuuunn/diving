import type CustomButton from '@/components/CustomButton.vue';
import type CustomInput from '@/components/CustomInput.vue';

declare module 'vue' {
  export interface GlobalComponents {
    CustomButton: typeof CustomButton;
    CustomInput: typeof CustomInput;
  }
}

export {};
