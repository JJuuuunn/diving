import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeSheetPayload,
  syncCompetitionFeed,
  validateFeed
} from '../scripts/sync-competitions.mjs';

const publishedRow = {
  id: 'AIDA-77',
  sourceEventId: '77',
  title: 'AIDA Seoul Pool Championship',
  federation: 'AIDA',
  type: 'pool',
  startDate: '2026-08-10',
  endDate: '2026-08-11',
  venue: 'Olympic Pool',
  city: 'Seoul',
  countryCode: 'KR',
  registrationStatus: 'open',
  officialUrl: 'https://www.aidainternational.org/Events/77',
  status: 'published',
  verifiedAt: '2026-07-26'
};

test('normalizes published rows and excludes draft/cancelled rows', () => {
  const feed = normalizeSheetPayload({
    rows: [
      publishedRow,
      { id: 'AIDA-78', sourceEventId: '78', status: 'draft' },
      { id: 'AIDA-79', sourceEventId: '79', status: 'cancelled' }
    ]
  }, new Date('2026-07-26T00:00:00.000Z'));

  assert.equal(feed.schemaVersion, 2);
  assert.equal(feed.managementMode, 'google-sheets');
  assert.equal(feed.events.length, 1);
  assert.equal(feed.events[0].countryCode, 'KR');
  assert.equal(feed.events[0].verifiedAt, '2026-07-26');
  assert.equal(feed.events[0].sourceUrl, 'https://www.aidainternational.org/Events/');
});

test('rejects duplicate ids, malformed dates, non-Korean rows and unofficial URLs', () => {
  assert.throws(
    () => normalizeSheetPayload({ rows: [publishedRow, publishedRow] }),
    /duplicate id/
  );
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ ...publishedRow, startDate: 'soon' }] }),
    /invalid startDate/
  );
  assert.throws(
    () => normalizeSheetPayload({
      rows: [{ ...publishedRow, startDate: '2026-08-12', endDate: '2026-08-11' }]
    }),
    /endDate precedes/
  );
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ ...publishedRow, countryCode: 'JP' }] }),
    /only KR/
  );
  assert.throws(
    () => normalizeSheetPayload({
      rows: [{ ...publishedRow, officialUrl: 'https://example.com/event' }]
    }),
    /aidainternational\.org/
  );
});

test('accepts source-prefixed ids and requires the suffix to match sourceEventId', () => {
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ ...publishedRow, id: 'aida-seoul-2026' }] }),
    /invalid id/
  );
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ ...publishedRow, id: 'AIDA-99' }] }),
    /must match/
  );
  const cmas = normalizeSheetPayload({
    rows: [{
      ...publishedRow,
      id: 'CMAS-2026-77',
      sourceEventId: '2026-77',
      federation: 'CMAS',
      officialUrl: 'https://www.cmas.org/freediving/calendar.html'
    }]
  });
  assert.equal(cmas.events[0].id, 'CMAS-2026-77');

  const custom = normalizeSheetPayload({
    rows: [{ ...publishedRow, id: 'CUSTOM-korea-77', sourceEventId: 'korea-77' }]
  });
  assert.equal(custom.events[0].id, 'CUSTOM-korea-77');
});

test('normalizes Google Sheets date cells returned as ISO timestamps to KST dates', () => {
  const feed = normalizeSheetPayload({
    rows: [{
      ...publishedRow,
      startDate: '2026-08-09T15:00:00.000Z',
      endDate: '2026-08-10T15:00:00.000Z',
      verifiedAt: '2026-07-25T15:00:00.000Z'
    }]
  });
  assert.equal(feed.events[0].startDate, '2026-08-10');
  assert.equal(feed.events[0].endDate, '2026-08-11');
  assert.equal(feed.events[0].verifiedAt, '2026-07-26');
});

test('rejects empty and incomplete published feeds', () => {
  assert.throws(() => normalizeSheetPayload({ rows: [] }), /no competition rows/);
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ id: 'AIDA-88', sourceEventId: '88', status: 'draft' }] }),
    /no published competitions/
  );
  assert.throws(
    () => normalizeSheetPayload({ rows: [{ ...publishedRow, title: '' }] }),
    /title is required/
  );
});

test('validates a normalized committed feed', () => {
  const feed = normalizeSheetPayload(
    { rows: [publishedRow] },
    new Date('2026-07-26T00:00:00.000Z')
  );
  assert.equal(validateFeed(feed), feed);
});

test('does not rewrite the snapshot when event content is unchanged', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'competition-sync-'));
  const outputPath = join(directory, 'feed.json');
  const initial = normalizeSheetPayload(
    { rows: [publishedRow] },
    new Date('2026-07-25T00:00:00.000Z')
  );
  await writeFile(outputPath, `${JSON.stringify(initial, null, 2)}\n`);

  const result = await syncCompetitionFeed({
    apiUrl: 'https://example.test/api',
    outputPath,
    now: new Date('2026-07-26T00:00:00.000Z'),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ rows: [publishedRow] })
    })
  });

  assert.equal(result.status, 'unchanged');
  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), initial);
});

test('writes a validated snapshot atomically when published content changes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'competition-sync-'));
  const outputPath = join(directory, 'feed.json');
  const initial = normalizeSheetPayload(
    { rows: [publishedRow] },
    new Date('2026-07-25T00:00:00.000Z')
  );
  await writeFile(outputPath, `${JSON.stringify(initial, null, 2)}\n`);

  const result = await syncCompetitionFeed({
    apiUrl: 'https://example.test/api',
    outputPath,
    now: new Date('2026-07-26T00:00:00.000Z'),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        rows: [{ ...publishedRow, registrationStatus: 'closed' }]
      })
    })
  });

  assert.equal(result.status, 'updated');
  const stored = validateFeed(JSON.parse(await readFile(outputPath, 'utf8')));
  assert.equal(stored.events[0].registrationStatus, 'closed');
  assert.equal(stored.generatedAt, '2026-07-26T00:00:00.000Z');
});

test('leaves the last valid snapshot untouched when the API fails', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'competition-sync-'));
  const outputPath = join(directory, 'feed.json');
  const initial = normalizeSheetPayload(
    { rows: [publishedRow] },
    new Date('2026-07-25T00:00:00.000Z')
  );
  const serialized = `${JSON.stringify(initial, null, 2)}\n`;
  await writeFile(outputPath, serialized);

  await assert.rejects(
    syncCompetitionFeed({
      apiUrl: 'https://example.test/api',
      outputPath,
      fetchImpl: async () => ({ ok: false, status: 503 })
    }),
    /HTTP 503/
  );
  assert.equal(await readFile(outputPath, 'utf8'), serialized);
});
