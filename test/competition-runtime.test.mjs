import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchCompetitionFeed } from '../src/api/competitionApi.ts';
import {
  buildUtcCalendarDates,
  createUtcDate,
  moveUtcMonth,
  toUtcDateString
} from '../src/utils/competitionCalendar.ts';
import { readFile } from 'node:fs/promises';

test('competition API aborts a request that exceeds its timeout', async () => {
  await assert.rejects(
    fetchCompetitionFeed({
      apiUrl: 'https://example.test/competitions',
      timeoutMs: 5,
      fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      })
    }),
    /5ms를 초과/
  );
});

test('competition API uses a 15-second default timeout', async () => {
  const source = await readFile(
    new URL('../src/api/competitionApi.ts', import.meta.url),
    'utf8'
  );
  assert.match(source, /DEFAULT_TIMEOUT_MS = 15000/);
});

test('competition API returns a response completed before the timeout', async () => {
  const payload = await fetchCompetitionFeed({
    apiUrl: 'https://example.test/competitions',
    timeoutMs: 50,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ ok: true, data: [] })
    })
  });
  assert.deepEqual(payload, { ok: true, data: [] });
});

test('calendar month arithmetic stays on UTC boundaries', () => {
  const december = createUtcDate('2026-12-31');
  assert.equal(toUtcDateString(moveUtcMonth(december, 1)), '2027-01-01');
  assert.equal(toUtcDateString(moveUtcMonth(december, -12)), '2025-12-01');
});

test('calendar creates a stable 6-week UTC grid across month boundaries', () => {
  const dates = buildUtcCalendarDates(2026, 7);
  assert.equal(dates.length, 42);
  assert.equal(dates[0], '2026-07-26');
  assert.equal(dates.at(-1), '2026-09-05');
});
