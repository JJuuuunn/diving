import type {
  CompetitionApiPayload,
  CrawlHistoryItem,
  CrawlLog,
  CrawlStateResponse,
  CrawlStatus
} from '@/types/competition';

const VALID_CRAWL_STATUSES: CrawlStatus[] = ['success', 'failed', 'running', 'never'];
const VALID_LOG_STATUSES = ['success', 'failed'] as const;
const VALID_TRIGGER_TYPES = ['local', 'scheduled', 'manual'] as const;

export const parseCompetitionFeed = (value: unknown): CompetitionApiPayload => {
  if (!value || typeof value !== 'object') {
    throw new Error('대회 API 응답 형식이 올바르지 않습니다.');
  }

  const obj = value as Record<string, unknown>;

  if (obj.ok !== undefined && typeof obj.ok !== 'boolean') {
    throw new Error('대회 API 응답의 ok 필드가 올바르지 않습니다.');
  }

  if (obj.data !== undefined && !Array.isArray(obj.data)) {
    throw new Error('대회 API 응답의 data 필드가 올바르지 않습니다.');
  }

  if (obj.rows !== undefined && !Array.isArray(obj.rows)) {
    throw new Error('대회 API 응답의 rows 필드가 올바르지 않습니다.');
  }

  let meta: CompetitionApiPayload['meta'] = undefined;
  if (obj.meta !== undefined) {
    if (!obj.meta || typeof obj.meta !== 'object') {
      throw new Error('대회 API 응답의 meta 필드가 올바르지 않습니다.');
    }
    const metaObj = obj.meta as Record<string, unknown>;
    if (metaObj.generatedAt !== undefined && typeof metaObj.generatedAt !== 'string') {
      throw new Error('대회 API 응답의 meta.generatedAt 필드가 올바르지 않습니다.');
    }
    meta = {
      ...(typeof metaObj.generatedAt === 'string' ? { generatedAt: metaObj.generatedAt } : {})
    };
  }

  const result: CompetitionApiPayload = {};
  if (typeof obj.ok === 'boolean') result.ok = obj.ok;
  if (Array.isArray(obj.data)) result.data = obj.data;
  if (Array.isArray(obj.rows)) result.rows = obj.rows;
  if (meta) result.meta = meta;

  return result;
};

export const parseCrawlState = (value: unknown): CrawlStateResponse => {
  if (!value || typeof value !== 'object') {
    throw new Error('수집 상태 응답 형식이 올바르지 않습니다.');
  }

  const obj = value as Record<string, unknown>;

  if (obj.ok === false) {
    const errorObj = typeof obj.error === 'object' && obj.error ? (obj.error as Record<string, unknown>) : null;
    const msg = typeof errorObj?.message === 'string' ? errorObj.message : '수집 상태를 불러오지 못했습니다.';
    throw new Error(msg);
  }

  const target = obj.ok === true ? obj.data : value;

  if (!target || typeof target !== 'object') {
    throw new Error('수집 상태 데이터 형식이 올바르지 않습니다.');
  }

  const stateObj = target as Record<string, unknown>;

  const lastStatusStr = String(stateObj.lastStatus ?? '').trim();
  if (!VALID_CRAWL_STATUSES.includes(lastStatusStr as CrawlStatus)) {
    throw new Error('수집 상태의 lastStatus 값이 올바르지 않습니다.');
  }

  const lastFetchedCount = Number(stateObj.lastFetchedCount);
  const consecutiveFailures = Number(stateObj.consecutiveFailures);

  if (!Number.isFinite(lastFetchedCount) || !Number.isFinite(consecutiveFailures)) {
    throw new Error('수집 상태의 숫자 필드 값이 올바르지 않습니다.');
  }

  return {
    lastStartedAt: String(stateObj.lastStartedAt ?? ''),
    lastSucceededAt: String(stateObj.lastSucceededAt ?? ''),
    lastFailedAt: String(stateObj.lastFailedAt ?? ''),
    lastStatus: lastStatusStr as CrawlStatus,
    lastRunId: String(stateObj.lastRunId ?? ''),
    lastFetchedCount,
    consecutiveFailures
  };
};

const parseCrawlHistoryItem = (value: unknown): CrawlHistoryItem | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;

  const runId = String(row.runId ?? '').trim();
  const statusStr = String(row.status ?? '').trim();
  const triggerTypeStr = String(row.triggerType ?? '').trim();

  if (
    !runId ||
    !VALID_LOG_STATUSES.includes(statusStr as (typeof VALID_LOG_STATUSES)[number]) ||
    !VALID_TRIGGER_TYPES.includes(triggerTypeStr as (typeof VALID_TRIGGER_TYPES)[number])
  ) {
    return null;
  }

  const fetchedCount = Number(row.fetchedCount);
  const insertedCount = Number(row.insertedCount);
  const updatedCount = Number(row.updatedCount);
  const unchangedCount = Number(row.unchangedCount);
  const deactivatedCount = Number(row.deactivatedCount);
  const errorCount = Number(row.errorCount);
  const durationMs = Number(row.durationMs);

  if (
    !Number.isFinite(fetchedCount) ||
    !Number.isFinite(insertedCount) ||
    !Number.isFinite(updatedCount) ||
    !Number.isFinite(unchangedCount) ||
    !Number.isFinite(deactivatedCount) ||
    !Number.isFinite(errorCount) ||
    !Number.isFinite(durationMs)
  ) {
    return null;
  }

  return {
    runId,
    startedAt: String(row.startedAt ?? '').trim(),
    finishedAt: String(row.finishedAt ?? '').trim(),
    status: statusStr as CrawlLog['status'],
    triggerType: triggerTypeStr as CrawlLog['triggerType'],
    fetchedCount,
    insertedCount,
    updatedCount,
    unchangedCount,
    deactivatedCount,
    errorCount,
    errorCode: String(row.errorCode ?? '').trim(),
    durationMs
  };
};

export const parseCrawlHistory = (value: unknown): CrawlHistoryItem[] => {
  if (!value || typeof value !== 'object') {
    throw new Error('수집 이력 응답 형식이 올바르지 않습니다.');
  }

  if (!Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.ok === false) {
      const errorObj = typeof obj.error === 'object' && obj.error ? (obj.error as Record<string, unknown>) : null;
      const msg = typeof errorObj?.message === 'string' ? errorObj.message : '수집 이력을 불러오지 못했습니다.';
      throw new Error(msg);
    }
    if (obj.ok === true) {
      if (!Array.isArray(obj.data)) {
        throw new Error('수집 이력 응답의 data 필드가 올바르지 않습니다.');
      }
      const history = obj.data
        .map(parseCrawlHistoryItem)
        .filter((item): item is CrawlHistoryItem => item !== null);
      if (obj.data.length > 0 && history.length === 0) {
        throw new Error('수집 이력 응답에 유효한 데이터가 없습니다.');
      }
      return history;
    }
    throw new Error('수집 이력 응답 형식이 올바르지 않습니다.');
  }

  const history = value
    .map(parseCrawlHistoryItem)
    .filter((item): item is CrawlHistoryItem => item !== null);
  if (value.length > 0 && history.length === 0) {
    throw new Error('수집 이력 응답에 유효한 데이터가 없습니다.');
  }
  return history;
};
