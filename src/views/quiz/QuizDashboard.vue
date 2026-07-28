<template>
  <div class="quiz-container">
    <header class="quiz-header">
      <h1 class="fade-in-up">다이빙 문제 은행</h1>
      <p class="fade-in-up delay">자신의 다이빙 물리, 생리학 지식 및 특수 기체 다이빙 이론을 시험해보세요.</p>
    </header>

    <main class="quiz-sets-grid">
      <div
        v-for="set in quizSets"
        :key="set.id"
        class="quiz-card set-card fade-in-up"
        @click="selectSet(set.id)"
      >
        <div>
          <h2>{{ set.title }}</h2>
          <p>{{ set.description }}</p>
        </div>

        <div>
          <div class="set-info-row">
            <span class="badge">문항수: {{ set.totalQuestions }}문제</span>
            <span v-if="set.timeLimit" class="badge">시간: {{ formatTime(set.timeLimit) }}</span>
            <span v-if="quizStore.getTryCount(set.id) > 0" class="badge">
              최고 점수: {{ quizStore.getHighScore(set.id) }}점
            </span>
          </div>
          <CustomButton class="start-btn">도전하기</CustomButton>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import questionsData from '@/data/questions.json';
import { useQuizStore } from '@/stores/quiz';

const router = useRouter();
const quizStore = useQuizStore();

const quizSets = computed(() => questionsData.quizSets);

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
};

const selectSet = (setId: string) => {
  router.push({ name: '퀴즈 풀기', params: { setId } });
};
</script>

<style lang="scss" scoped>
@use '@/assets/scss/pages/_quiz.scss';
</style>
