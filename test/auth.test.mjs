import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_STORAGE_KEY } from '../src/stores/auth.ts';

test('auth store uses correct storage key format', () => {
  assert.equal(AUTH_STORAGE_KEY, 'diving:auth:admin:v1');
});
