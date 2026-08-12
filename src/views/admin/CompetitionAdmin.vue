<template>
  <div class="crawl-status-page">
    <Header title="AIDA 데이터 수집 현황" subtitle="관리자 운영 기록" />

    <!-- 미인증 상태: 패스코드 입력 폼 / 모달 카드 -->
    <div v-if="!authStore.isAuthenticated" class="auth-container">
      <div class="auth-card" role="dialog" aria-labelledby="admin-auth-title">
        <div class="auth-header">
          <h2 id="admin-auth-title">관리자 인증 필요</h2>
          <p>AIDA 데이터 수집 현황을 확인하려면 패스코드를 입력하세요.</p>
        </div>
        <form class="auth-form" @submit.prevent="handleVerifyPasscode">
          <CustomInput
            id="admin-passcode-input"
            v-model="passcodeInput"
            type="password"
            label="패스코드"
            placeholder="관리자 패스코드를 입력하세요"
            :error="passcodeError"
            required
          />
          <div class="auth-actions">
            <CustomButton
              type="button"
              variant="ghost"
              @click="goHome"
            >
              메인으로 이동
            </CustomButton>
            <CustomButton
              type="submit"
              variant="primary"
              :disabled="!passcodeInput.trim()"
            >
              인증하기
            </CustomButton>
          </div>
        </form>
      </div>
    </div>

    <!-- 인증 완료 상태: 수집 현황 대시보드 -->
    <main v-else class="status-content">
      <section class="status-heading">
        <div>
          <p class="eyebrow">SYSTEM OBSERVABILITY</p>
          <h1>대회 일정 수집 상태</h1>
          <p>이 화면에서는 자동 수집 결과만 확인할 수 있으며 데이터를 변경할 수 없습니다.</p>
        </div>
        <div class="status-heading-actions">
          <CustomButton
            type="button"
            variant="primary"
            :loading="isLoading"
            loading-label="확인 중…"
            @click="loadStatus"
          >
            기록 새로고침
          </CustomButton>
          <CustomButton
            type="button"
            variant="secondary"
            @click="handleLogout"
          >
            로그아웃
          </CustomButton>
        </div>
      </section>

      <div v-if="!apiConfigured" class="notice error" role="alert">
        대회 데이터 API가 설정되지 않았습니다.
      </div>
      <div v-else-if="errorMessage" class="notice error" role="alert">
        {{ errorMessage }}
      </div>

      <section v-if="state" class="metric-grid" aria-label="최근 수집 상태">
        <article class="primary-metric">
          <span>현재 상태</span>
          <strong :class="`status-${state.lastStatus}`">
            <i aria-hidden="true"></i>{{ statusLabel(state.lastStatus) }}
          </strong>
          <small>실행 ID {{ state.lastRunId || '기록 없음' }}</small>
        </article>
        <article>
          <span>마지막 성공</span>
          <strong>{{ formatDateTime(state.lastSucceededAt) }}</strong>
          <small>{{ relativeTime(state.lastSucceededAt) }}</small>
        </article>
        <article>
          <span>최근 수집 건수</span>
          <strong>{{ state.lastFetchedCount.toLocaleString() }}건</strong>
          <small>AIDA 국내 대회 기준</small>
        </article>
        <article>
          <span>연속 실패</span>
          <strong>{{ state.consecutiveFailures }}회</strong>
          <small>{{ state.lastFailedAt ? `최근 ${relativeTime(state.lastFailedAt)}` : '실패 기록 없음' }}</small>
        </article>
      </section>

      <section class="history-panel">
        <header>
          <div>
            <h2>최근 수집 이력</h2>
            <p>최대 50개의 실행 기록을 제공합니다.</p>
          </div>
          <div class="history-controls">
            <CustomSelect
              v-model="limit"
              :options="limitOptions"
              aria-label="조회 개수 선택"
              @update:model-value="loadStatus"
            />
            <span>{{ history.length }} records</span>
          </div>
        </header>

        <div v-if="isLoading && !history.length" class="empty-state">기록을 불러오고 있습니다.</div>
        <div v-else-if="!history.length" class="empty-state">아직 수집 기록이 없습니다.</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>실행 시각</th>
                <th>결과</th>
                <th>수집</th>
                <th>신규</th>
                <th>변경</th>
                <th>비활성</th>
                <th>소요 시간</th>
                <th>오류</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in history" :key="log.runId">
                <td>
                  <strong>{{ formatDateTime(log.startedAt) }}</strong>
                  <small>{{ triggerLabel(log.triggerType) }}</small>
                </td>
                <td><span class="result-chip" :class="log.status">{{ statusLabel(log.status) }}</span></td>
                <td>{{ log.fetchedCount }}</td>
                <td class="positive">+{{ log.insertedCount }}</td>
                <td>{{ log.updatedCount }}</td>
                <td>{{ log.deactivatedCount }}</td>
                <td>{{ formatDuration(log.durationMs) }}</td>
                <td><code v-if="log.errorCode">{{ log.errorCode }}</code><span v-else>—</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="privacy-note">
        보안을 위해 원본 응답, 내부 경로와 상세 오류 내용은 이 화면에 표시하지 않습니다.
      </p>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import CustomButton from '@/components/CustomButton.vue';
import CustomInput from '@/components/CustomInput.vue';
import CustomSelect from '@/components/CustomSelect.vue';
import { RouterName } from '@/mappings/enum';
import { useAuthStore } from '@/stores/auth';
import {
  fetchCrawlHistory,
  fetchCrawlState,
  hasCompetitionStatusApi,
  type CrawlLog,
  type CrawlState,
  type CrawlStatus
} from '@/api/competitionAdminApi';

const router = useRouter();
const authStore = useAuthStore();

const passcodeInput = ref('');
const passcodeError = ref('');

const apiConfigured = hasCompetitionStatusApi();
const state = ref<CrawlState | null>(null);
const history = ref<CrawlLog[]>([]);
const limit = ref<number>(30);
const limitOptions = [
  { value: 10, label: '10개씩' },
  { value: 20, label: '20개씩' },
  { value: 30, label: '30개씩' },
  { value: 50, label: '50개씩' }
];
const isLoading = ref(false);
const errorMessage = ref('');
let robotsMeta: HTMLMetaElement | null = null;

const handleVerifyPasscode = () => {
  passcodeError.value = '';
  const success = authStore.verifyPasscode(passcodeInput.value);
  if (success) {
    passcodeInput.value = '';
    loadStatus();
  } else {
    passcodeError.value = '패스코드가 올바르지 않습니다. 다시 확인해주세요.';
  }
};

const handleLogout = () => {
  authStore.logout();
  passcodeInput.value = '';
  passcodeError.value = '';
};

const goHome = () => {
  router.push({ name: RouterName.Main });
};

const statusLabel = (status: CrawlStatus | CrawlLog['status']) => ({
  success: '정상',
  failed: '실패',
  running: '수집 중',
  never: '기록 없음'
}[status]);

const formatDateTime = (value: string) => {
  if (!value) return '기록 없음';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '기록 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const relativeTime = (value: string) => {
  if (!value) return '';
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60]
  ];
  const formatter = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });
  for (const [unit, size] of ranges) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return '방금 전';
};

const formatDuration = (durationMs: number) =>
  durationMs >= 1000 ? `${(durationMs / 1000).toFixed(1)}초` : `${durationMs}ms`;

const triggerLabel = (trigger: CrawlLog['triggerType']) => ({
  local: '로컬 수동 수집',
  scheduled: 'Apps Script 자동 실행',
  manual: '수동 실행'
}[trigger]);

const loadStatus = async () => {
  if (!apiConfigured) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [nextState, nextHistory] = await Promise.all([
      fetchCrawlState(),
      fetchCrawlHistory(limit.value)
    ]);
    state.value = nextState;
    history.value = nextHistory;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '수집 이력을 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  robotsMeta = document.createElement('meta');
  robotsMeta.name = 'robots';
  robotsMeta.content = 'noindex,nofollow,noarchive';
  document.head.appendChild(robotsMeta);
  if (authStore.isAuthenticated) {
    loadStatus();
  }
});

onBeforeUnmount(() => robotsMeta?.remove());
</script>

<style scoped lang="scss">
.crawl-status-page {
  min-height: 100vh;
  color: var(--page-text-primary);
  background:
    radial-gradient(circle at 82% 0, rgba(14, 165, 233, .13), transparent 34rem),
    linear-gradient(145deg, #f7fbfd, #edf6f9);

  body.dark & {
    background:
      radial-gradient(circle at 82% 0, rgba(14, 165, 233, .14), transparent 34rem),
      linear-gradient(145deg, #06111b, #0a202e);
  }
}

.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 220px);
  padding: 40px 16px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(14, 116, 144, 0.14);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 48px rgba(15, 58, 78, 0.08);
  backdrop-filter: blur(12px);

  body.dark & {
    border-color: rgba(125, 211, 252, 0.14);
    background: rgba(12, 32, 46, 0.92);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.35);
  }
}

.auth-header {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--page-text-primary);
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--page-text-secondary);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;

  :deep(.custom-ui-button) {
    min-width: 100px;
  }
}

.status-content {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 34px 0 64px;
}

.status-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;

  .eyebrow { margin: 0 0 8px; color: #0284c7; font: 800 .7rem/1 monospace; letter-spacing: .13em; }
  h1 { margin: 0; font-size: clamp(1.55rem, 4vw, 2.35rem); letter-spacing: -.04em; }
  p:not(.eyebrow) { margin: 10px 0 0; color: var(--page-text-secondary); }
}

.status-heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  :deep(.custom-ui-button) {
    min-width: 110px;
  }
}

.notice, .history-panel, .metric-grid article {
  border: 1px solid rgba(14, 116, 144, .14);
  background: rgba(255,255,255,.82);
  box-shadow: 0 16px 44px rgba(15, 58, 78, .05);
  body.dark & { border-color: rgba(125,211,252,.14); background: rgba(12,32,46,.9); }
}
.notice { margin-bottom: 18px; padding: 16px 18px; border-radius: 14px; }
.notice.error { color: #b91c1c; border-color: rgba(239,68,68,.28); }

.metric-grid {
  display: grid;
  grid-template-columns: 1.15fr repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 22px;

  article { min-height: 126px; padding: 20px; border-radius: 17px; display: flex; flex-direction: column; gap: 11px; }
  span, small { color: var(--page-text-secondary); }
  span { font-size: .75rem; font-weight: 800; }
  strong { font-size: 1.1rem; line-height: 1.35; }
  small { margin-top: auto; font-size: .7rem; }
  .primary-metric strong { display: flex; align-items: center; gap: 9px; font-size: 1.45rem; }
  .primary-metric i { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 0 5px rgba(148,163,184,.14); }
  .status-success { color: #047857; }
  .status-success i { background: #10b981; box-shadow: 0 0 0 5px rgba(16,185,129,.14); }
  .status-failed { color: #b91c1c; }
  .status-failed i { background: #ef4444; box-shadow: 0 0 0 5px rgba(239,68,68,.14); }
  .status-running { color: #0369a1; }
  .status-running i { background: #0ea5e9; box-shadow: 0 0 0 5px rgba(14,165,233,.14); }
}

.history-panel {
  overflow: hidden;
  border-radius: 18px;
  > header {
    padding: 20px 22px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    border-bottom: 1px solid rgba(148,163,184,.16);
    h2 { margin: 0; font-size: 1rem; }
    p { margin: 5px 0 0; color: var(--page-text-secondary); font-size: .75rem; }
  }
}
.history-controls {
  display: flex;
  align-items: center;
  gap: 12px;

  :deep(.custom-select) {
    min-width: 100px;
  }
  > span { color: var(--page-text-secondary); font: .7rem monospace; }
}
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 820px; }
th, td { padding: 14px 16px; border-bottom: 1px solid rgba(148,163,184,.13); text-align: left; font-size: .78rem; }
th { color: var(--page-text-secondary); font-size: .68rem; letter-spacing: .03em; }
td strong, td small { display: block; }
td small { margin-top: 4px; color: var(--page-text-secondary); font-size: .66rem; }
td.positive { color: #047857; font-weight: 800; }
td code { color: #b91c1c; font-size: .68rem; }
.result-chip { display: inline-block; padding: 5px 9px; border-radius: 999px; font-size: .68rem; font-weight: 800; }
.result-chip.success { color: #047857; background: #d1fae5; }
.result-chip.failed { color: #b91c1c; background: #fee2e2; }
.empty-state { padding: 56px 20px; color: var(--page-text-secondary); text-align: center; }
.privacy-note { margin: 16px 4px 0; color: var(--page-text-secondary); font-size: .7rem; }

@media (max-width: 820px) {
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .status-content { width: min(100% - 20px, 1120px); padding-top: 22px; }
  .status-heading { align-items: stretch; flex-direction: column; }
  .status-heading-actions { flex-direction: column; width: 100%; }
  .status-heading-actions :deep(.custom-ui-button) { width: 100%; }
  .metric-grid { grid-template-columns: 1fr; }
  .metric-grid article { min-height: 105px; }
}
</style>
