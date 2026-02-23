<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <transition name="slide-fade" mode="out-in">
                <DptiIntro v-if="currentStep === 'intro'" @start="startTest" />

                <DptiStep
                    v-else-if="currentStep === 'test'"
                    :question="questions[currentIndex]"
                    :progress="progressPercentage"
                    :currentIndex="currentIndex"
                    @select="handleAnswer"
                    @prev="prevStep"
                />

                <DptiLoading v-else-if="currentStep === 'loading'" />
            </transition>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import dptiData from '@/data/dpti.json';
import type { DptiQuestion, DptiAnswer } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

import DptiIntro from '@/views/dpti/DptiIntro.vue';
import DptiStep from '@/views/dpti/DptiStep.vue';
import DptiLoading from '@/views/dpti/DptiLoading.vue';

type TestStep = 'intro' | 'test' | 'loading';

const router = useRouter();
const currentStep = ref<TestStep>('intro');
const currentIndex = ref<number>(0);
const answers = ref<DptiAnswer[]>([]);

const questions = dptiData.questions as DptiQuestion[];
const progressPercentage = computed<number>(() => (currentIndex.value / questions.length) * 100);

const startTest = (): void => {
    currentStep.value = 'test';
};

const prevStep = (): void => {
    if (currentIndex.value > 0) {
        currentIndex.value--; // 인덱스 감소
        answers.value.pop();  // 가장 최근에 저장된 답변 제거
    } else {
        currentStep.value = 'intro'; // 첫 질문에서 뒤로가면 인트로로
    }
};

const handleAnswer = (val: string): void => {
    answers.value.push({
        category: questions[currentIndex.value].category,
        value: val
    });

    if (currentIndex.value < questions.length - 1) {
        currentIndex.value++;
    } else {
        calculateAndRedirect();
    }
};

const calculateAndRedirect = (): void => {
    currentStep.value = 'loading';

    const counts: Record<string, Record<string, number>> = { Focus: {}, Purpose: {}, Style: {}, Social: {} };
    const totals: Record<string, number> = { Focus: 0, Purpose: 0, Style: 0, Social: 0 };

    answers.value.forEach((ans: DptiAnswer) => {
        counts[ans.category][ans.value] = (counts[ans.category][ans.value] || 0) + 1;
        totals[ans.category]++;
    });

    const getDominant = (cat: string, optA: string, optB: string): string =>
        (counts[cat][optA] || 0) >= (counts[cat][optB] || 0) ? optA : optB;

    const typeCode: string = [
        getDominant('Focus', 'E', 'I'),
        getDominant('Purpose', 'C', 'H'),
        getDominant('Style', 'T', 'F'),
        getDominant('Social', 'G', 'P')
    ].join('');

    // 숫자를 강제로 문자열(String)로 변환해 라우터 타입 에러 방지
    const scores = {
        f: String(Math.round(((counts['Focus']['E'] || 0) / (totals.Focus || 1)) * 100)),
        p: String(Math.round(((counts['Purpose']['C'] || 0) / (totals.Purpose || 1)) * 100)),
        s: String(Math.round(((counts['Style']['T'] || 0) / (totals.Style || 1)) * 100)),
        c: String(Math.round(((counts['Social']['G'] || 0) / (totals.Social || 1)) * 100))
    };

    setTimeout(() => {
        router.push({
            name: RouterName.DptiResult,
            params: { code: typeCode },
            query: scores
        });
    }, 2500);
};
</script>

<style lang="scss">
@import '@/assets/scss/pages/_dpti.scss';
</style>