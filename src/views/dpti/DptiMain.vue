<template>
    <div class="dpti-container" role="region" aria-label="다이빙 성향 테스트">
        <main class="dpti-main-content">
    <h1 class="sr-only">다이빙 성향 테스트</h1>
            <transition name="slide-fade" mode="out-in">
                <DptiIntro
                    v-if="currentStep === 'intro'"
                    :history="resultsHistory"
                    @start="startTest"
                    @view-history="viewPastResult"
                />

                <DptiStep
                    v-else-if="currentStep === 'test'"
                    :question="currentQuestion"
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
import { useDpti } from '@/composables/useDpti';
// import { useHead } from '@vueuse/head';

import DptiIntro from '@/views/dpti/DptiIntro.vue';
import DptiStep from '@/views/dpti/DptiStep.vue';
import DptiLoading from '@/views/dpti/DptiLoading.vue';

// useHead({
//   title: '다이빙 성향 테스트 & 병원 정보',
//   meta:[
//     { name: 'description', content: '다이빙 성향 테스트를 통해 당신에게 어울리는 바다 생물을 찾아보고, 병원 정보를 손쉽게 확인하세요.' },
//     { name: 'keywords', content: '다이빙, 성향 테스트, 바다 생물, 스쿠버 다이빙, 의료 병원, 스쿠버 병원' }
//   ]
// });

const {
  currentStep,
  currentIndex,
  progressPercentage,
  currentQuestion,
  startTest,
  prevStep,
  handleAnswer,
  resultsHistory,
  viewPastResult
} = useDpti();
</script>

<style lang="scss">
@use '@/assets/scss/pages/_dpti.scss';
</style>
