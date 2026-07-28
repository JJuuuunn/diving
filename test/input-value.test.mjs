import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeInputValue } from '../src/utils/inputValue.ts';

test('preserves text by default', () => {
  assert.equal(normalizeInputValue('  diver  '), '  diver  ');
});

test('trims text when requested', () => {
  assert.equal(normalizeInputValue('  diver  ', { trim: true }), 'diver');
});

test('normalizes finite numeric input and preserves empty input', () => {
  assert.equal(normalizeInputValue('42.5', { valueType: 'number' }), 42.5);
  assert.equal(normalizeInputValue('', { valueType: 'number' }), '');
});

test('does not emit NaN for an intermediate numeric value', () => {
  assert.equal(normalizeInputValue('-', { valueType: 'number' }), '-');
});
