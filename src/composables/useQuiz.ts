// src/composables/useQuiz.ts
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Question, QuizSet, UserAnswer, QuizHistory } from '@/types/quiz';
import { useQuizStore } from '@/stores/quiz';
import { RouterName } from '@/mappings/enum';

// 전역 싱글톤 상태 대신 각각의 퀴즈 세션 독립 구동을 지원하도록 구성
export function useQuiz() {
  const router = useRouter();
  const quizStore = useQuizStore();

  const activeSet = ref<QuizSet | null>(null);
  const questions = ref<Question[]>([]);
  const currentQuestionIndex = ref(0);
  const userAnswers = ref<Record<number, any>>({});
  const isFinished = ref(false);

  // 타이머 상태
  const timeRemaining = ref<number | null>(null);
  let timerId: ReturnType<typeof setInterval> | null = null;

  // 계산된 속성들
  const currentQuestion = computed<Question | null>(() => {
    if (questions.value.length === 0) return null;
    return questions.value[currentQuestionIndex.value];
  });

  const progressPercent = computed(() => {
    if (questions.value.length === 0) return 0;
    return Math.round(((currentQuestionIndex.value) / questions.value.length) * 100);
  });

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === questions.value.length - 1;
  });

  const isFirstQuestion = computed(() => {
    return currentQuestionIndex.value === 0;
  });

  // 타이머 제어
  const startTimer = (limitSeconds: number) => {
    stopTimer();
    timeRemaining.value = limitSeconds;
    timerId = setInterval(() => {
      if (timeRemaining.value !== null) {
        if (timeRemaining.value > 0) {
          timeRemaining.value--;
        } else {
          // 제한시간 만료 시 강제 제출
          stopTimer();
          submitQuiz();
        }
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  // 퀴즈 시작 (문제 셔플링 포함)
  const startQuiz = (setInfo: QuizSet, allQuestionsList: Question[]) => {
    activeSet.value = setInfo;
    isFinished.value = false;
    currentQuestionIndex.value = 0;
    userAnswers.value = {};
    
    // 해당 시험 세트의 문제들만 필터링
    const setQuestions = allQuestionsList.filter((q) => q.setId === setInfo.id);
    
    // 문제 셔플 로직 (피셔-예이츠 셔플로 완벽한 랜덤 보장)
    const shuffled = [...setQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 설정된 문항 수만큼 슬라이싱
    questions.value = shuffled.slice(0, setInfo.totalQuestions);

    // 타이머 셋업
    if (setInfo.timeLimit) {
      startTimer(setInfo.timeLimit);
    } else {
      timeRemaining.value = null;
    }
  };

  // 답변 기록
  const saveAnswer = (questionId: number, answerValue: any) => {
    userAnswers.value[questionId] = answerValue;
  };

  // 문제 이동
  const nextQuestion = () => {
    if (!isLastQuestion.value) {
      currentQuestionIndex.value++;
    }
  };

  const prevQuestion = () => {
    if (!isFirstQuestion.value) {
      currentQuestionIndex.value--;
    }
  };

  // 주관식 단답형 정답 판정 순수 헬퍼 함수
  const verifyShortAnswer = (userAns: string, correctKeywords: string[]): boolean => {
    const cleanUser = userAns.replace(/\s+/g, '').toLowerCase();
    return correctKeywords.some((keyword) => {
      const cleanKeyword = keyword.replace(/\s+/g, '').toLowerCase();
      return cleanUser === cleanKeyword;
    });
  };

  // 객관식 다중 선택 정답 판정 헬퍼 함수
  const verifyMultiChoice = (userAns: number[], correctAns: number[]): boolean => {
    if (userAns.length !== correctAns.length) return false;
    const sortedUser = [...userAns].sort();
    const sortedCorrect = [...correctAns].sort();
    return sortedUser.every((val, index) => val === sortedCorrect[index]);
  };

  // 오답 문제만 모아서 퀴즈 세션 생성
  const startWrongNotesQuiz = (questionsList: Question[]) => {
    const wrongMap = new Map(quizStore.wrongNotes.map((n) => [n.questionId, n.question]));
    const wrongIds = new Set(quizStore.wrongNotes.map((n) => n.questionId));

    let targetQuestions = questionsList.filter((q) => wrongIds.has(q.id));
    if (targetQuestions.length === 0 && wrongMap.size > 0) {
      targetQuestions = Array.from(wrongMap.values());
    }

    const setInfo: QuizSet = {
      id: 'wrong-notes',
      title: '📝 오답 복습 모드',
      description: '저장된 오답 문제들을 복습합니다.',
      totalQuestions: targetQuestions.length
    };

    activeSet.value = setInfo;
    isFinished.value = false;
    currentQuestionIndex.value = 0;
    userAnswers.value = {};
    timeRemaining.value = null;

    const shuffled = [...targetQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    questions.value = shuffled;
  };

  // 즐겨찾기(북마크) 문제만 모아서 퀴즈 세션 생성
  const startBookmarksQuiz = (questionsList: Question[]) => {
    const bookmarkedSet = new Set(quizStore.bookmarkedIds);
    const targetQuestions = questionsList.filter((q) => bookmarkedSet.has(q.id));

    const setInfo: QuizSet = {
      id: 'bookmarks',
      title: '⭐ 즐겨찾기 모아 풀기',
      description: '북마크한 문제들을 모아서 풀이합니다.',
      totalQuestions: targetQuestions.length
    };

    activeSet.value = setInfo;
    isFinished.value = false;
    currentQuestionIndex.value = 0;
    userAnswers.value = {};
    timeRemaining.value = null;

    const shuffled = [...targetQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    questions.value = shuffled;
  };

  // 최종 채점 및 제출
  const submitQuiz = () => {
    if (isFinished.value || !activeSet.value) return;
    
    stopTimer();
    isFinished.value = true;

    const scoredAnswers: UserAnswer[] = questions.value.map((q) => {
      const userAns = userAnswers.value[q.id];
      let isCorrect = false;

      if (userAns !== undefined && userAns !== null) {
        if (q.type === 'ox') {
          isCorrect = userAns === q.answer;
        } else if (q.type === 'single-choice') {
          isCorrect = userAns === q.answer;
        } else if (q.type === 'multi-choice') {
          isCorrect = verifyMultiChoice(userAns as number[], q.answer);
        } else if (q.type === 'short-answer') {
          isCorrect = verifyShortAnswer(String(userAns), q.answer);
        }
      }

      // 틀린 문제는 오답 노트 자동 저장, 맞춘 문제는 오답 노트에서 해제
      if (isCorrect) {
        quizStore.removeWrongNote(q.id);
      } else {
        quizStore.addWrongNote(q, userAns);
      }

      return {
        questionId: q.id,
        answer: userAns ?? null,
        isCorrect
      };
    });

    const correctCount = scoredAnswers.filter((a) => a.isCorrect).length;
    // 100점 만점 기준 점수 환산
    const score = Math.round((correctCount / questions.value.length) * 100);

    const historyRecord: QuizHistory = {
      id: Math.random().toString(36).substring(2, 11),
      setId: activeSet.value.id,
      title: activeSet.value.title,
      score,
      totalQuestions: questions.value.length,
      correctCount,
      solvedAt: new Date().toISOString(),
      answers: scoredAnswers
    };

    // Pinia 스토어에 기록 적재
    quizStore.addHistory(historyRecord);

    // 결과 뷰로 이동할 수 있도록 세션 스토리지 연동
    sessionStorage.setItem('diving:quiz:last_result:v1', JSON.stringify({
      historyRecord,
      questions: questions.value
    }));

    router.push({ name: RouterName.QuizResult });
  };

  onUnmounted(() => {
    stopTimer();
  });

  return {
    activeSet,
    questions,
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    timeRemaining,
    isFinished,
    progressPercent,
    isFirstQuestion,
    isLastQuestion,
    startQuiz,
    startWrongNotesQuiz,
    startBookmarksQuiz,
    saveAnswer,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    stopTimer
  };
}
