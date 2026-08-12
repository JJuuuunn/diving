<template>
  <div class="quiz-container" v-if="history">
    <div class="quiz-card result-summary fade-in-up">
      <div class="score-circle">
        <span class="score-num">{{ history.score }}</span>
        <span class="score-label">SCORE</span>
      </div>

      <h2>{{ history.title }} 완료!</h2>
      <p class="feedback-msg">{{ getFeedbackMessage(history.score) }}</p>

      <div class="stat-row">
        <div class="stat-item">
          총 문항
          <span>{{ history.totalQuestions }}문제</span>
        </div>
        <div class="stat-item">
          맞춘 문제
          <span class="quiz-result-correct">{{ history.correctCount }}문제</span>
        </div>
        <div class="stat-item">
          정답률
          <span class="quiz-result-rate">{{ Math.round((history.correctCount / history.totalQuestions) * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 오답 노트 및 해설 복습 -->
    <div class="quiz-card fade-in-up delay">
      <h3 class="review-header">📝 오답 노트 & 상세 해설</h3>
      <p class="quiz-result-summary">
        ※ 각 문항을 클릭하면 상세한 해설과 내가 입력한 답안을 다시 볼 수 있습니다.
      </p>

      <div class="review-list">
        <div
          v-for="(ans, idx) in history.answers"
          :key="ans.questionId"
          class="review-item"
        >
          <div class="review-title-row" @click="toggleReview(idx)">
            <h4>Q{{ idx + 1 }}. {{ getQuestion(ans.questionId)?.question }}</h4>
            <span class="result-badge" :class="ans.isCorrect ? 'correct' : 'incorrect'">
              {{ ans.isCorrect ? '정답' : '오답' }}
            </span>
          </div>

          <!-- 아코디언 콘텐츠 -->
          <div v-if="openReviews[idx]" class="review-content">
            <div class="ans-match">
              <span>
                제출한 답안:
                <strong :class="ans.isCorrect ? 'correct-val' : 'user-val'">
                  {{ getAnswerText(getQuestion(ans.questionId)!, ans.answer) }}
                </strong>
              </span>
              <span>
                실제 정답:
                <strong class="correct-val">
                  {{ getCorrectAnswerText(getQuestion(ans.questionId)!) }}
                </strong>
              </span>
            </div>

            <div class="explanation-box">
              <strong>💡 해설:</strong><br />
              {{ getQuestion(ans.questionId)?.explanation }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 액션 버튼 -->
    <div class="action-row fade-in-up">
      <CustomButton class="action-btn secondary" @click="handleGoDashboard">문제 은행 홈</CustomButton>
      <CustomButton class="action-btn primary" @click="handleRetry">다시 풀기</CustomButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { QuizHistory, Question } from '@/types/quiz';
import { RouterName } from '@/mappings/enum';

const LAST_RESULT_KEY = 'diving:quiz:last_result:v1';
const LEGACY_LAST_RESULT_KEY = 'diving_last_quiz_result';

const router = useRouter();
const resultData = ref<{ historyRecord: QuizHistory; questions: Question[] } | null>(null);

// 열려 있는 아코디언 인덱스 관리 상태
const openReviews = ref<Record<number, boolean>>({});

onMounted(() => {
  const currentRaw = sessionStorage.getItem(LAST_RESULT_KEY);
  const legacyRaw = sessionStorage.getItem(LEGACY_LAST_RESULT_KEY);
  const raw = currentRaw || legacyRaw;

  if (!raw) {
    router.push({ name: RouterName.QuizDashboard });
    return;
  }
  try {
    resultData.value = JSON.parse(raw);
    if (!currentRaw && legacyRaw) {
      sessionStorage.setItem(LAST_RESULT_KEY, legacyRaw);
    }
    if (legacyRaw !== null) {
      sessionStorage.removeItem(LEGACY_LAST_RESULT_KEY);
    }

    // 틀린 문제는 기본적으로 상세 해설을 열어둠 (배려 깊은 피드백 제공)
    if (resultData.value) {
      resultData.value.historyRecord.answers.forEach((ans, index) => {
        if (!ans.isCorrect) {
          openReviews.value[index] = true;
        }
      });
    }
  } catch (e) {
    router.push({ name: RouterName.QuizDashboard });
  }
});

const history = computed(() => resultData.value?.historyRecord || null);
const questions = computed(() => resultData.value?.questions || []);

const toggleReview = (index: number) => {
  openReviews.value[index] = !openReviews.value[index];
};

const handleRetry = () => {
  if (history.value) {
    router.push({ name: RouterName.QuizPlay, params: { setId: history.value.setId } });
  }
};

const handleGoDashboard = () => {
  router.push({ name: RouterName.QuizDashboard });
};

const getQuestion = (qId: number): Question | undefined => {
  return questions.value.find(q => q.id === qId);
};

// 스코어별 피드백 메시지 생성 헬퍼
const getFeedbackMessage = (score: number): string => {
  if (score === 100) return '🎉 완벽합니다! 다이빙 마스터 수준의 지식을 갖추셨군요!';
  if (score >= 80) return '👍 아주 훌륭합니다. 안전하게 바다를 즐길 자격이 충분합니다!';
  if (score >= 60) return '😊 합격점입니다. 헷갈린 오답 노트를 복습해 안전 다이빙을 준비하세요!';
  return '⚠️ 아쉽습니다. 다이빙은 생명과 직결되므로 오답 해설을 꼼꼼히 공부해주세요.';
};

// 사용자가 적은 답 텍스트 포맷터
const getAnswerText = (question: Question, answerVal: any): string => {
  if (answerVal === null || answerVal === undefined) return '답을 선택하지 않음';

  if (question.type === 'ox') {
    return answerVal ? 'O' : 'X';
  } else if (question.type === 'single-choice') {
    return question.options[answerVal] || '';
  } else if (question.type === 'multi-choice') {
    const list = answerVal as number[];
    return list.map(idx => question.options[idx]).join(', ') || '답을 선택하지 않음';
  } else if (question.type === 'short-answer') {
    return String(answerVal);
  }
  return '';
};

// 실제 정답 텍스트 포맷터
const getCorrectAnswerText = (question: Question): string => {
  if (question.type === 'ox') {
    return question.answer ? 'O' : 'X';
  } else if (question.type === 'single-choice') {
    return question.options[question.answer] || '';
  } else if (question.type === 'multi-choice') {
    return question.answer.map(idx => question.options[idx]).join(', ');
  } else if (question.type === 'short-answer') {
    return question.answer.join(' 또는 ');
  }
  return '';
};
</script>

<style lang="scss" scoped>
@use '@/assets/scss/pages/_quiz.scss';
</style>
