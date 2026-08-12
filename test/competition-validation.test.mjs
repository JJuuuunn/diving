import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseCompetitionFeed,
  parseCrawlState,
  parseCrawlHistory
} from '../src/utils/competitionValidation.ts';

test('parseCompetitionFeed parses valid feed payloads', () => {
  const valid = { ok: true, data: [{ id: 'AIDA-1' }], meta: { generatedAt: '2026-08-11T00:00:00Z' } };
  const parsed = parseCompetitionFeed(valid);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data?.length, 1);
  assert.equal(parsed.meta?.generatedAt, '2026-08-11T00:00:00Z');
});

test('parseCompetitionFeed rejects malformed payloads', () => {
  assert.throws(() => parseCompetitionFeed(null), /올바르지 않습니다/);
  assert.throws(() => parseCompetitionFeed({ ok: 'not-a-boolean' }), /ok 필드/);
  assert.throws(() => parseCompetitionFeed({ data: 'not-an-array' }), /data 필드/);
  assert.throws(() => parseCompetitionFeed({ rows: {} }), /rows 필드/);
  assert.throws(() => parseCompetitionFeed({ meta: 'invalid' }), /meta 필드/);
});

test('parseCrawlState parses valid crawl status payload envelope and direct state object', () => {
  const envelope = {
    ok: true,
    data: {
      lastStartedAt: '2026-08-11T00:00:00Z',
      lastSucceededAt: '2026-08-11T00:05:00Z',
      lastFailedAt: '',
      lastStatus: 'success',
      lastRunId: 'run-1',
      lastFetchedCount: 12,
      consecutiveFailures: 0
    }
  };
  const parsedFromEnvelope = parseCrawlState(envelope);
  assert.equal(parsedFromEnvelope.lastRunId, 'run-1');
  assert.equal(parsedFromEnvelope.lastStatus, 'success');
  assert.equal(parsedFromEnvelope.lastFetchedCount, 12);

  const direct = {
    lastStartedAt: '2026-08-11T00:00:00Z',
    lastSucceededAt: '2026-08-11T00:05:00Z',
    lastFailedAt: '',
    lastStatus: 'failed',
    lastRunId: 'run-2',
    lastFetchedCount: 0,
    consecutiveFailures: 1
  };
  const parsedDirect = parseCrawlState(direct);
  assert.equal(parsedDirect.lastRunId, 'run-2');
  assert.equal(parsedDirect.lastStatus, 'failed');
});

test('parseCrawlState handles API error response and malformed data', () => {
  assert.throws(
    () => parseCrawlState({ ok: false, error: { message: '수집 오류 발생' } }),
    /수집 오류 발생/
  );
  assert.throws(
    () => parseCrawlState({ lastStatus: 'unknown-status', lastFetchedCount: 0, consecutiveFailures: 0 }),
    /lastStatus/
  );
  assert.throws(
    () => parseCrawlState({ lastStatus: 'success', lastFetchedCount: 'nan', consecutiveFailures: 0 }),
    /숫자 필드/
  );
});

test('parseCrawlHistory parses valid history payload envelope and array', () => {
  const validItem = {
    runId: 'run-100',
    startedAt: '2026-08-11T00:00:00Z',
    finishedAt: '2026-08-11T00:01:00Z',
    status: 'success',
    triggerType: 'scheduled',
    fetchedCount: 10,
    insertedCount: 1,
    updatedCount: 2,
    unchangedCount: 7,
    deactivatedCount: 0,
    errorCount: 0,
    errorCode: '',
    durationMs: 60000
  };

  const envelope = { ok: true, data: [validItem] };
  const history = parseCrawlHistory(envelope);
  assert.equal(history.length, 1);
  assert.equal(history[0].runId, 'run-100');

  const historyArr = parseCrawlHistory([validItem]);
  assert.equal(historyArr.length, 1);
  assert.equal(historyArr[0].status, 'success');
});

test('parseCrawlHistory throws on API error envelope or invalid history', () => {
  assert.throws(
    () => parseCrawlHistory({ ok: false, error: { message: '이력 조회 실패' } }),
    /이력 조회 실패/
  );
  assert.throws(
    () => parseCrawlHistory([{ runId: 'r1', status: 'invalid-status' }]),
    /유효한 데이터가 없습니다/
  );
});
