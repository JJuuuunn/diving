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

import DptiIntro from '@/views/dpti/DptiIntro.vue';
import DptiStep from '@/views/dpti/DptiStep.vue';
import DptiLoading from '@/views/dpti/DptiLoading.vue';

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
@import '@/assets/scss/pages/_dpti.scss';
</style>
