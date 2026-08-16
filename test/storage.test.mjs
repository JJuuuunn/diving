import test from 'node:test';
import assert from 'node:assert/strict';
import { getStoredItem, setStoredItem, migrateLegacyKey, removeStoredItem } from '../src/utils/storage.ts';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockStorage = new MemoryStorage();
globalThis.window = globalThis;
globalThis.localStorage = mockStorage;

test('migrateLegacyKey copies oldKey to newKey and removes oldKey', () => {
  mockStorage.clear();
  mockStorage.setItem('old-key', 'legacy-value');

  const migrated = migrateLegacyKey('old-key', 'new-key');
  assert.equal(migrated, true);
  assert.equal(mockStorage.getItem('new-key'), 'legacy-value');
  assert.equal(mockStorage.getItem('old-key'), null);
});

test('migrateLegacyKey does not overwrite existing newKey', () => {
  mockStorage.clear();
  mockStorage.setItem('old-key', 'old-val');
  mockStorage.setItem('new-key', 'existing-val');

  const migrated = migrateLegacyKey('old-key', 'new-key');
  assert.equal(migrated, true);
  assert.equal(mockStorage.getItem('new-key'), 'existing-val');
  assert.equal(mockStorage.getItem('old-key'), null);
});

test('getStoredItem returns fallback when key does not exist', () => {
  mockStorage.clear();
  const val = getStoredItem('non-existent', 'default-val');
  assert.equal(val, 'default-val');
});

test('getStoredItem parses valid JSON and raw strings', () => {
  mockStorage.clear();
  setStoredItem('json-key', { a: 1, b: 'test' });
  assert.deepEqual(getStoredItem('json-key', {}), { a: 1, b: 'test' });

  setStoredItem('string-key', 'plain-text');
  assert.equal(getStoredItem('string-key', 'fallback'), 'plain-text');
});

test('getStoredItem uses parseValidator correctly', () => {
  mockStorage.clear();
  setStoredItem('theme-key', 'coral');

  const theme = getStoredItem('theme-key', 'light', (parsed) =>
    ['light', 'dark', 'coral', 'abyss'].includes(parsed)
  );
  assert.equal(theme, 'coral');

  setStoredItem('invalid-theme', 'neon-purple');
  const fallbackTheme = getStoredItem('invalid-theme', 'light', (parsed) =>
    ['light', 'dark', 'coral', 'abyss'].includes(parsed)
  );
  assert.equal(fallbackTheme, 'light');
});

test('setStoredItem and removeStoredItem manipulate storage safely', () => {
  mockStorage.clear();
  setStoredItem('item-1', [1, 2, 3]);
  assert.equal(mockStorage.getItem('item-1'), '[1,2,3]');

  removeStoredItem('item-1');
  assert.equal(mockStorage.getItem('item-1'), null);
});
