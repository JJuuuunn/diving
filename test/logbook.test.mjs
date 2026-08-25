import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatApneaTime,
  isValidLogbookDate,
  parseApneaTime,
  parseLogbookPayload,
  serializeLogbook,
  validateDiveLogDraft
} from '../src/utils/logbook.ts';

const scubaDraft = {
  type: 'scuba',
  date: '2026-08-06',
  location: '제주 문섬',
  maxDepth: 24.5,
  temp: 22,
  buddyName: '버디',
  buddySignature: '',
  notes: '시야 좋음',
  durationMinutes: 48,
  entryPressureBar: 200,
  exitPressureBar: 60
};

test('validates calendar dates and apnea time boundaries', () => {
  assert.equal(isValidLogbookDate('2024-02-29'), true);
  assert.equal(isValidLogbookDate('2025-02-29'), false);
  assert.equal(parseApneaTime('01:45'), 105);
  assert.equal(parseApneaTime('01:99'), null);
  assert.equal(parseApneaTime('00:00'), null);
  assert.equal(formatApneaTime(105), '01:45');
});

test('validates type-specific logbook drafts', () => {
  assert.equal(validateDiveLogDraft(scubaDraft), null);
  assert.match(validateDiveLogDraft({ ...scubaDraft, exitPressureBar: 220 }), /입수 압력/);

  const freedivingDraft = {
    ...scubaDraft,
    type: 'freediving',
    diveCount: 8,
    apneaSeconds: 105,
    discipline: 'CWT',
    weightKg: 2,
    equalizingMethod: 'Frenzel'
  };
  delete freedivingDraft.durationMinutes;
  delete freedivingDraft.entryPressureBar;
  delete freedivingDraft.exitPressureBar;
  assert.equal(validateDiveLogDraft(freedivingDraft), null);

  const aidaDisciplines = ['CWT', 'CWTB', 'CNF', 'FIM', 'STA', 'DYN', 'DYNB', 'DNF'];
  for (const d of aidaDisciplines) {
    assert.equal(validateDiveLogDraft({ ...freedivingDraft, discipline: d }), null);
  }
  assert.match(validateDiveLogDraft({ ...freedivingDraft, discipline: 'INVALID' }), /종목/);
  assert.match(validateDiveLogDraft({ ...freedivingDraft, apneaSeconds: 0 }), /무호흡/);
});

test('migrates legacy logs, trims locations and replaces duplicate ids', () => {
  const legacy = [
    { ...scubaDraft, id: 'same', diveTime: 48, entryPsi: 200, exitPsi: 60 },
    { ...scubaDraft, id: 'same', diveTime: 52, entryPsi: 210, exitPsi: 50, location: '  강릉  ' }
  ].map(({ durationMinutes, entryPressureBar, exitPressureBar, ...log }) => log);
  let id = 0;
  const result = parseLogbookPayload(legacy, () => `new-${++id}`, '2026-08-06T00:00:00.000Z');

  assert.equal(result.migrated, true);
  assert.equal(result.discarded, 0);
  assert.equal(result.logs.length, 2);
  assert.equal(result.logs[1].id, 'new-1');
  assert.equal(result.logs[1].location, '강릉');
  assert.equal(result.logs[0].type === 'scuba' && result.logs[0].durationMinutes, 48);
});

test('round-trips versioned backups and rejects unsupported payloads', () => {
  const log = {
    ...scubaDraft,
    id: 'log-1',
    createdAt: '2026-08-06T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z'
  };
  const payload = serializeLogbook([log], '2026-08-06T01:00:00.000Z');
  const result = parseLogbookPayload(payload);
  assert.deepEqual(result.logs, [log]);
  assert.throws(() => parseLogbookPayload('{"logs":[]}'), /지원하지 않는/);
});

test('discards malformed stored records without discarding valid neighbors', () => {
  const result = parseLogbookPayload([
    { ...scubaDraft, id: 'valid', diveTime: 48, entryPsi: 200, exitPsi: 60 },
    { type: 'scuba', id: 'broken' }
  ]);
  assert.equal(result.logs.length, 1);
  assert.equal(result.discarded, 1);
});
