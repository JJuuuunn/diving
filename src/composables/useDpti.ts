import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDptiStore } from '@/stores/dpti';
import { RouterName } from '@/mappings/enum';
import type { DptiQuestion, DptiAnswer, DptiHistoryItem } from '@/types/dpti';
import dptiData from '@/data/dpti.json';

const questions = dptiData.questions as DptiQuestion[];

export function useDpti() {
  const router = useRouter();
  const dptiStore = useDptiStore();

  const currentStep = ref<'intro' | 'test' | 'loading'>('intro');
  const currentIndex = ref<number>(0);
  const answers = ref<DptiAnswer[]>([]);

  const progressPercentage = computed<number>(() => (currentIndex.value / questions.length) * 100);
  const currentQuestion = computed<DptiQuestion>(() => questions[currentIndex.value]);

  const startTest = (): void => {
    currentIndex.value = 0;
    answers.value = [];
    currentStep.value = 'test';
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
      state: { fromTest: false }
    });
  };

  return {
    currentStep,
    currentIndex,
    progressPercentage,
    currentQuestion,
    questions,
    answers,
    startTest,
    prevStep,
    handleAnswer,
    resultsHistory: computed(() => dptiStore.resultsHistory),
    viewPastResult
  };
}
