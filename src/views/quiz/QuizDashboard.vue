<template>
  <div class="quiz-container">
    <header class="quiz-header">
      <h1 class="fade-in-up">다이빙 문제 은행</h1>
      <p class="fade-in-up delay">자신의 다이빙 물리, 생리학 지식 및 특수 기체 다이빙 이론을 시험해보세요.</p>
    </header>

    <!-- 탭 선택바 -->
    <nav class="quiz-tabs-bar fade-in-up" role="tablist" aria-label="퀴즈 메뉴 탭">
      <CustomButton
        class="quiz-tab-btn"
        :class="{ active: activeTab === 'sets' }"
        role="tab"
        :aria-selected="activeTab === 'sets'"
        @click="activeTab = 'sets'"
      >
        📚 시험지 세트
      </CustomButton>

      <CustomButton
        class="quiz-tab-btn"
        :class="{ active: activeTab === 'wrong-notes' }"
        role="tab"
        :aria-selected="activeTab === 'wrong-notes'"
        @click="activeTab = 'wrong-notes'"
      >
        📝 오답 노트 <span class="tab-badge">{{ quizStore.wrongNotes.length }}</span>
      </CustomButton>

      <CustomButton
        class="quiz-tab-btn"
        :class="{ active: activeTab === 'bookmarks' }"
        role="tab"
        :aria-selected="activeTab === 'bookmarks'"
        @click="activeTab = 'bookmarks'"
      >
        ⭐ 즐겨찾기 <span class="tab-badge">{{ quizStore.bookmarkedIds.length }}</span>
      </CustomButton>
    </nav>

    <!-- 1. 시험지 세트 탭 -->
    <main v-if="activeTab === 'sets'" class="quiz-sets-grid">
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

    <!-- 2. 오답 노트 탭 -->
    <section v-else-if="activeTab === 'wrong-notes'" class="tab-content-section">
      <div v-if="quizStore.wrongNotes.length > 0" class="tab-action-bar fade-in-up">
        <div class="action-info">
          <h3>저장된 오답 {{ quizStore.wrongNotes.length }}문제</h3>
          <p>이전에 틀렸던 문제를 복습하여 실수를 방지하세요.</p>
        </div>
        <CustomButton class="tab-start-btn wrong-btn" @click="startWrongNotesQuiz">
          📝 오답 복습 모드 시작
        </CustomButton>
      </div>

      <div v-if="quizStore.wrongNotes.length === 0" class="quiz-card empty-card fade-in-up">
        <div class="empty-icon">📝</div>
        <h3>저장된 오답 노트가 없습니다</h3>
        <p>퀴즈를 풀면서 틀린 문제가 있으면 이곳에 자동으로 모아집니다.</p>
      </div>

      <div v-else class="dashboard-question-list">
        <div
          v-for="item in wrongNotesList"
          :key="item.questionId"
          class="quiz-card note-card fade-in-up"
        >
          <div class="note-card-header">
            <div class="header-left">
              <span class="category-chip">{{ item.question.category }}</span>
              <span class="wrong-badge">오답 저장됨</span>
            </div>
            <CustomButton
              class="delete-note-btn"
              aria-label="오답 노트에서 삭제"
              @click="removeWrongNote(item.questionId)"
            >
              ✕ 삭제
            </CustomButton>
          </div>

          <div class="question-text">
            {{ item.question.question }}
          </div>

          <div class="explanation-box">
            <strong>💡 해설:</strong><br />
            {{ item.question.explanation }}
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 즐겨찾기 탭 -->
    <section v-else-if="activeTab === 'bookmarks'" class="tab-content-section">
      <div v-if="bookmarkedQuestions.length > 0" class="tab-action-bar fade-in-up">
        <div class="action-info">
          <h3>북마크 문제 {{ bookmarkedQuestions.length }}개</h3>
          <p>즐겨찾기해 둔 문제들을 집중해서 풀어보세요.</p>
        </div>
        <CustomButton class="tab-start-btn bookmark-btn-start" @click="startBookmarksQuiz">
          ⭐ 즐겨찾기 모아 풀기
        </CustomButton>
      </div>

      <div v-if="bookmarkedQuestions.length === 0" class="quiz-card empty-card fade-in-up">
        <div class="empty-icon">⭐</div>
        <h3>북마크한 문제가 없습니다</h3>
        <p>퀴즈 풀기 화면 우측 상단의 별(⭐) 버튼을 눌러 중요한 문제를 저장해 보세요.</p>
      </div>

      <div v-else class="dashboard-question-list">
        <div
          v-for="q in bookmarkedQuestions"
          :key="q.id"
          class="quiz-card bookmark-card fade-in-up"
        >
          <div class="bookmark-card-header">
            <div class="header-left">
              <span class="category-chip">{{ q.category }}</span>
            </div>
            <CustomButton
              class="star-toggle-btn active"
              :aria-label="quizStore.isBookmarked(q.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'"
              @click="quizStore.toggleBookmark(q.id)"
            >
              ⭐
            </CustomButton>
          </div>

          <div class="question-text">
            {{ q.question }}
          </div>

          <div class="explanation-box">
            <strong>💡 해설:</strong><br />
            {{ q.explanation }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import questionsData from '@/data/questions.json';
import { useQuizStore } from '@/stores/quiz';
import type { Question } from '@/types/quiz';
import CustomButton from '@/components/CustomButton.vue';
import { RouterName } from '@/mappings/enum';

const router = useRouter();
const quizStore = useQuizStore();

const activeTab = ref<'sets' | 'wrong-notes' | 'bookmarks'>('sets');

const quizSets = computed(() => questionsData.quizSets);
const allQuestions = questionsData.questions as Question[];

const wrongNotesList = computed(() => {
  return quizStore.wrongNotes.map((note) => {
    const fullQ = allQuestions.find((q) => q.id === note.questionId) || note.question;
    return {
      ...note,
      question: fullQ
    };
  });
});

const bookmarkedQuestions = computed(() => {
  const ids = new Set(quizStore.bookmarkedIds);
  return allQuestions.filter((q) => ids.has(q.id));
});

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
};

const selectSet = (setId: string) => {
  router.push({ name: RouterName.QuizPlay, params: { setId } });
};

const startWrongNotesQuiz = () => {
  router.push({ name: RouterName.QuizPlay, params: { setId: 'wrong-notes' } });
};

const startBookmarksQuiz = () => {
  router.push({ name: RouterName.QuizPlay, params: { setId: 'bookmarks' } });
};

const removeWrongNote = (questionId: number) => {
  quizStore.removeWrongNote(questionId);
};
</script>

<style lang="scss" scoped>
@use '@/assets/scss/pages/_quiz.scss';
</style>
