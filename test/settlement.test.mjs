import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('useSettlement defines standardized storage keys and legacy migration keys', async () => {
  const source = await read('src/composables/useSettlement.ts');
  assert.match(source, /SETTLEMENT_STORAGE_KEYS\s*=\s*\{/);
  assert.match(source, /STEP:\s*['"]diving:settlement:step:v1['"]/);
  assert.match(source, /SETTINGS:\s*['"]diving:settlement:settings:v1['"]/);
  assert.match(source, /PEOPLE:\s*['"]diving:settlement:people:v1['"]/);
  assert.match(source, /RESULTS:\s*['"]diving:settlement:results:v1['"]/);

  assert.match(source, /SETTLEMENT_LEGACY_STORAGE_KEYS\s*=\s*\{/);
  assert.match(source, /STEP:\s*['"]settlement-current-step['"]/);
  assert.match(source, /SETTINGS:\s*['"]settlement-settings['"]/);
  assert.match(source, /PEOPLE:\s*['"]settlement-people['"]/);
  assert.match(source, /RESULTS:\s*['"]settlement-results['"]/);
});

test('useSettlement uses reactive ref for globalResultText', async () => {
  const source = await read('src/composables/useSettlement.ts');
  assert.match(source, /const globalResultText = ref\(['"]['"]\);/);
  assert.match(source, /globalResultText\.value = generateResultText/);
});

test('useSettlement integrates legacy storage key migration', async () => {
  const source = await read('src/composables/useSettlement.ts');
  assert.match(source, /function migrateSettlementStorageKeys\(\)/);
  assert.match(source, /localStorage\.getItem\(legacyKey\)/);
  assert.match(source, /localStorage\.setItem\(newKey,\s*legacyValue\)/);
  assert.match(source, /localStorage\.removeItem\(legacyKey\)/);
  assert.match(source, /migrateSettlementStorageKeys\(\);/);
});

test('ResultSection implements Phase 1 features: 1-sec copy, deeplinks, useCapture', async () => {
  const source = await read('src/views/settlement/ResultSection.vue');
  assert.match(source, /copiedAccountIndex/);
  assert.match(source, /useToast/);
  assert.match(source, /useCapture/);
  assert.match(source, /supertoss:\/\//);
  assert.match(source, /kakaopay:\/\//);
  assert.match(source, /CustomButton/);
  assert.match(source, /captureElement/);
  assert.match(source, /result-card/);
});
