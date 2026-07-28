<template>
  <div class="quiz-container" v-if="quizHelper.currentQuestion.value">
    <!-- 상단 진행 바 및 타이머 -->
    <div class="quiz-top-bar">
      <span>{{ quizHelper.activeSet.value?.title }}</span>
      <div
        v-if="quizHelper.timeRemaining.value !== null"
        class="timer-box"
        :class="{ warning: quizHelper.timeRemaining.value < 30 }"
      >
        ⏱️ {{ formattedTime }}
      </div>
    </div>

    <div class="quiz-progress-bar">
      <div class="progress-fill" :style="{ width: `${quizHelper.progressPercent.value}%` }"></div>
    </div>

    <!-- 문제 카드 -->
    <div class="quiz-card fade-in-up">
      <div class="question-header">
        <span class="category-chip">{{ quizHelper.currentQuestion.value.category }}</span>
        <span class="q-number">
          {{ quizHelper.currentQuestionIndex.value + 1 }} / {{ quizHelper.questions.value.length }}문제
        </span>
      </div>

      <div class="question-text">
        {{ quizHelper.currentQuestion.value.question }}
      </div>

      <!-- 문제 종류별 렌더링 분기 -->
      <!-- 1. OX 문제 -->
      <div v-if="quizHelper.currentQuestion.value.type === 'ox'" class="ox-container">
        <CustomButton
          class="ox-btn o-btn"
          :class="{ selected: currentAnswer === true }"
          @click="handleOXSelect(true)"
        >
          O
        </CustomButton>
        <CustomButton
          class="ox-btn x-btn"
          :class="{ selected: currentAnswer === false }"
          @click="handleOXSelect(false)"
        >
          X
        </CustomButton>
      </div>

      <!-- 2. 객관식 단일 선택 -->
      <div v-else-if="quizHelper.currentQuestion.value.type === 'single-choice'" class="options-list">
        <CustomButton
          v-for="(option, idx) in quizHelper.currentQuestion.value.options"
          :key="idx"
          class="option-item"
          :class="{ selected: currentAnswer === idx }"
          @click="handleSingleSelect(idx)"
        >
          {{ option }}
        </CustomButton>
      </div>

      <!-- 3. 객관식 복수 선택 -->
      <div v-else-if="quizHelper.currentQuestion.value.type === 'multi-choice'" class="options-list">
        <p class="quiz-answer-hint">
          ※ 정답을 모두 선택하세요. (중복 선택 가능)
        </p>
        <CustomButton
          v-for="(option, idx) in quizHelper.currentQuestion.value.options"
          :key="idx"
          class="option-item"
          :class="{ selected: selectedMultiAnswers.includes(idx) }"
          @click="handleMultiSelect(idx)"
        >
          <span class="quiz-answer-label">
            {{ selectedMultiAnswers.includes(idx) ? '☑' : '☐' }}
          </span>
          {{ option }}
        </CustomButton>
      </div>

      <!-- 4. 주관식 단답형 -->
      <div v-else-if="quizHelper.currentQuestion.value.type === 'short-answer'" class="short-answer-container">
        <CustomInput
          :model-value="String(currentAnswer || '')"
          @update:model-value="handleShortAnswerValue"
          placeholder="단답식 정답을 입력하세요 (띄어쓰기 생략 가능)"
          @keyup.enter="handleEnterKey"
        />
      </div>

      <!-- 하단 내비게이션 행 -->
      <div class="quiz-nav-row">
        <CustomButton
          class="prev-btn"
          :disabled="quizHelper.isFirstQuestion.value"
          @click="handlePrev"
        >
          이전 문제
        </CustomButton>

        <CustomButton
          v-if="!quizHelper.isLastQuestion.value"
          class="next-btn"
          @click="handleNext"
        >
          다음 문제
        </CustomButton>

        <CustomButton
          v-else
          class="submit-btn"
          @click="handleSubmit"
        >
          제출하기
        </CustomButton>
      </div>
    </div>

    <!-- 커스텀 Confirm 모달 -->
    <ConfirmModal
      :show="showConfirm"
      title="퀴즈 제출"
      message="모든 문제의 답을 제출하시겠습니까? 제출 후에는 답안을 수정할 수 없습니다."
      confirmText="제출하기"
      cancelText="더 풀어보기"
      @confirm="onConfirmSubmit"
      @cancel="onCancelSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import questionsData from '@/data/questions.json';
import { useQuiz } from '@/composables/useQuiz';
import type { Question } from '@/types/quiz';
import ConfirmModal from '@/components/ConfirmModal.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';

const route = useRoute();
const router = useRouter();
const quizHelper = useQuiz();

const setId = computed(() => String(route.params.setId));

// 제출 확인용 자체 모달 노출 상태
const showConfirm = ref(false);

// 복수 선택 답안 저장 임시 리스트
const selectedMultiAnswers = ref<number[]>([]);

// 문제 변경에 맞춰 복수선택 버퍼 동기화
const syncMultiAnswer = () => {
  const q = quizHelper.currentQuestion.value;
  if (q && q.type === 'multi-choice') {
    selectedMultiAnswers.value = quizHelper.userAnswers.value[q.id] || [];
  } else {
    selectedMultiAnswers.value = [];
  }
};

onMounted(() => {
  const setInfo = questionsData.quizSets.find(s => s.id === setId.value);
  if (!setInfo) {
    router.push({ name: '다이빙 문제 은행' });
    return;
  }
  quizHelper.startQuiz(setInfo as any, questionsData.questions as Question[]);
  syncMultiAnswer();
});

// 질문 인덱스가 동적으로 바뀔 때마다 버퍼도 실시간 강제 싱크
watch(() => quizHelper.currentQuestionIndex.value, () => {
  syncMultiAnswer();
});

const currentAnswer = computed(() => {
  const q = quizHelper.currentQuestion.value;
  if (!q) return null;
  return quizHelper.userAnswers.value[q.id];
});

const handlePrev = () => {
  quizHelper.prevQuestion();
};

const handleNext = () => {
  quizHelper.nextQuestion();
};

const handleOXSelect = (val: boolean) => {
  const q = quizHelper.currentQuestion.value;
  if (q) {
    quizHelper.saveAnswer(q.id, val);
    // OX 선택 시 편의를 위해 0.3초 후 다음 문제로 자동 전진
    setTimeout(() => {
      if (!quizHelper.isLastQuestion.value) {
        quizHelper.nextQuestion();
      }
    }, 250);
  }
};

const handleSingleSelect = (index: number) => {
  const q = quizHelper.currentQuestion.value;
  if (q) {
    quizHelper.saveAnswer(q.id, index);
    // 객관식 선택 시 0.3초 후 다음 문제로 자동 전진
    setTimeout(() => {
      if (!quizHelper.isLastQuestion.value) {
        quizHelper.nextQuestion();
      }
    }, 250);
  }
};

const handleMultiSelect = (index: number) => {
  const q = quizHelper.currentQuestion.value;
  if (!q) return;

  const current = [...selectedMultiAnswers.value];
  const foundIndex = current.indexOf(index);
  if (foundIndex > -1) {
    current.splice(foundIndex, 1);
  } else {
    current.push(index);
  }
  selectedMultiAnswers.value = current;
  quizHelper.saveAnswer(q.id, current);
};

const handleShortAnswerValue = (value: string | number) => {
  const q = quizHelper.currentQuestion.value;
  if (q) {
    quizHelper.saveAnswer(q.id, String(value));
  }
};

const handleEnterKey = () => {
  if (!quizHelper.isLastQuestion.value) {
    quizHelper.nextQuestion();
  }
};

const handleSubmit = () => {
  showConfirm.value = true;
};

const onConfirmSubmit = () => {
  showConfirm.value = false;
  quizHelper.submitQuiz();
};

const onCancelSubmit = () => {
  showConfirm.value = false;
};

const formattedTime = computed(() => {
  const totalSec = quizHelper.timeRemaining.value;
  if (totalSec === null) return '';
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});
</script>

<style lang="scss" scoped>
@use '@/assets/scss/pages/_quiz.scss';
</style>
