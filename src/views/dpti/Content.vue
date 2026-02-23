<template>
    <div class="dpti-container">
        <main class="dpti-main-content">
            <transition name="slide-fade" mode="out-in">
                <DptiIntro 
                    v-if="currentStep === 'intro'" 
                    :history="resultsHistory"
                    @start="startTest" 
                    @view-history="viewPastResult"
                />

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
import { useDptiStore } from '@/stores/dpti'; // Pinia 스토어 추가
import dptiData from '@/data/dpti.json';
import type { DptiQuestion, DptiAnswer, DptiHistoryItem } from '@/types/dpti';
import { RouterName } from '@/mappings/enum';

import DptiIntro from '@/views/dpti/DptiIntro.vue';
import DptiStep from '@/views/dpti/DptiStep.vue';
import DptiLoading from '@/views/dpti/DptiLoading.vue';

const router = useRouter();
const dptiStore = useDptiStore(); // 스토어 인스턴스

type TestStep = 'intro' | 'test' | 'loading';

const currentStep = ref<TestStep>('intro');
const currentIndex = ref<number>(0);
const answers = ref<DptiAnswer[]>([]);

// Pinia에서 히스토리 목록 가져오기 (최신순)
const resultsHistory = computed(() => dptiStore.resultsHistory);

const questions = dptiData.questions as DptiQuestion[];
const progressPercentage = computed<number>(() => (currentIndex.value / questions.length) * 100);

const startTest = (): void => {
    currentIndex.value = 0;
    answers.value = [];
    currentStep.value = 'test';
};

// 과거 기록 클릭 시 해당 결과 페이지로 이동하는 함수
const viewPastResult = (item: DptiHistoryItem) => {
    router.push({
        name: RouterName.DptiResult,
        params: { code: item.result.type_code },
        query: {
            f: String(item.scores.Focus),
            p: String(item.scores.Purpose),
            s: String(item.scores.Style),
            c: String(item.scores.Social),
            name: item.userName
        },
        // 히스토리에서 이동할 때는 fromTest 플래그를 false로 보내서 
        // 결과 페이지에서 이름 입력 모달이 다시 뜨지 않게 조절합니다.
        state: { fromTest: false } 
    });
};

const prevStep = (): void => {
    if (currentIndex.value > 0) {
        currentIndex.value--;
        answers.value.pop();
    } else {
        currentStep.value = 'intro';
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
            query: scores,
            state: { fromTest: true }
        });
    }, 2500);
};
</script>

<style lang="scss">
@import '@/assets/scss/pages/_dpti.scss';
</style>