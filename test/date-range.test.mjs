import assert from 'node:assert/strict';
import test from 'node:test';
import { isDateInRange, selectRangeDate, selectRangeMonth } from '../src/utils/dateRange.ts';

test('starts a new range with the first selected date', () => {
  assert.deepEqual(
    selectRangeDate({ start: '', end: '' }, '2026-08-10'),
    { start: '2026-08-10', end: '' }
  );
});

test('completes a range when the second date is after the start', () => {
  assert.deepEqual(
    selectRangeDate({ start: '2026-08-10', end: '' }, '2026-08-14'),
    { start: '2026-08-10', end: '2026-08-14' }
  );
});

test('orders an earlier second selection chronologically', () => {
  assert.deepEqual(
    selectRangeDate({ start: '2026-08-10', end: '' }, '2026-08-04'),
    { start: '2026-08-04', end: '2026-08-10' }
  );
});

test('restarts a completed range and rejects malformed dates', () => {
  assert.deepEqual(
    selectRangeDate({ start: '2026-08-01', end: '2026-08-03' }, '2026-08-20'),
    { start: '2026-08-20', end: '' }
  );
  const current = { start: '2026-08-01', end: '' };
  assert.equal(selectRangeDate(current, 'invalid'), current);
});

test('identifies only dates strictly inside a completed range', () => {
  const range = { start: '2026-08-10', end: '2026-08-14' };
  assert.equal(isDateInRange('2026-08-12', range), true);
  assert.equal(isDateInRange('2026-08-10', range), false);
  assert.equal(isDateInRange('2026-08-14', range), false);
});

test('selects and chronologically orders a month range', () => {
  assert.deepEqual(
    selectRangeMonth({ start: '', end: '' }, '2026-08'),
    { start: '2026-08', end: '' }
  );
  assert.deepEqual(
    selectRangeMonth({ start: '2026-08', end: '' }, '2026-04'),
    { start: '2026-04', end: '2026-08' }
  );
});

test('restarts a completed month range and rejects malformed months', () => {
  assert.deepEqual(
    selectRangeMonth({ start: '2026-04', end: '2026-08' }, '2027-01'),
    { start: '2027-01', end: '' }
  );
  const current = { start: '2026-04', end: '' };
  assert.equal(selectRangeMonth(current, '2026-4'), current);
});
