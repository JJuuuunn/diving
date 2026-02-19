<template>
    <div class="step-card animate-fade-in">
        <div class="progress-container">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>

        <div class="question-header">
            <span class="category">{{ question.category }}</span>
            <h2 class="question-text">{{ question.question }}</h2>
        </div>

        <div class="options-group">
            <button v-for="opt in question.options" :key="opt.value" class="option-btn"
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
}>();

defineEmits<{ (e: 'select', value: string): void }>();
</script>