<template>
  <div class="crawl-status-page">
    <Header title="AIDA 데이터 수집 현황" subtitle="읽기 전용 운영 기록" />

    <main class="status-content">
      <section class="status-heading">
        <div>
          <p class="eyebrow">SYSTEM OBSERVABILITY</p>
          <h1>대회 일정 수집 상태</h1>
          <p>이 화면에서는 자동 수집 결과만 확인할 수 있으며 데이터를 변경할 수 없습니다.</p>
        </div>
        <CustomButton type="button" :disabled="isLoading" @click="loadStatus">
          {{ isLoading ? '확인 중…' : '기록 새로고침' }}
        </CustomButton>
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
          <span>{{ history.length }} records</span>
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
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import {
  fetchCrawlHistory,
  fetchCrawlState,
  hasCompetitionStatusApi,
  type CrawlLog,
  type CrawlState,
  type CrawlStatus
} from '@/api/competitionAdminApi';

const apiConfigured = hasCompetitionStatusApi();
const state = ref<CrawlState | null>(null);
const history = ref<CrawlLog[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
let robotsMeta: HTMLMetaElement | null = null;

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
      fetchCrawlHistory(30)
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
  loadStatus();
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
  button {
    min-width: 122px; min-height: 44px; padding: 0 16px; border: 1px solid rgba(2, 132, 199, .3);
    border-radius: 11px; color: #0369a1; background: rgba(255,255,255,.72); cursor: pointer; font-weight: 800;
  }
  button:disabled { opacity: .55; cursor: wait; }
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
    > span { color: var(--page-text-secondary); font: .7rem monospace; }
  }
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
  .status-heading button { width: 100%; }
  .metric-grid { grid-template-columns: 1fr; }
  .metric-grid article { min-height: 105px; }
}
</style>
