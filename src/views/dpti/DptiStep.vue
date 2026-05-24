<template>
    <div class="step-card animate-fade-in">
        <div class="progress-container">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>

        <div class="step-header">
            <button 
                v-if="currentIndex > 0" 
                class="back-step-btn" 
                @click="$emit('prev')"
            >
                <i class="fas fa-chevron-left"></i> 이전 질문
            </button>
            <span class="category">{{ question.category }}</span>
        </div>

        <div class="question-header">
            <h2 class="question-text" aria-live="polite">{{ question.question }}</h2>
        </div>

        <div class="options-group">
            <button v-for="opt in question.options" :key="opt.value" class="option-btn" tabindex="0"
                @click="$emit('select', opt.value)">
                {{ opt.text }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { DptiQuestion } from '@/types/dpti';

defineProps<{
    question: DptiQuestion;
    progress: number;
    currentIndex: number; // 현재 인덱스를 받아와서 0일 때는 뒤로가기 숨김
}>();

defineEmits<{ 
    (e: 'select', value: string): void;
    (e: 'prev'): void; // 이전 단계 이벤트 추가
}>();
</script>