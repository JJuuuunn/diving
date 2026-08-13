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

test('useSettlement and ExtensionCardCustom support Kakao-style customExpenses and preset chips', async () => {
  const source = await read('src/composables/useSettlement.ts');
  assert.match(source, /customExpenses/);
  assert.match(source, /addCustomExpense/);
  assert.match(source, /removeCustomExpense/);

  const cardSource = await read('src/views/settlement/ExtensionCardCustom.vue');
  assert.match(cardSource, /preset-chips/);
  assert.match(cardSource, /custom-expense-list/);
  assert.match(cardSource, /addCustomExpense/);
});

test('useSettlement exports extension management methods and types', async () => {
  const typeSource = await read('src/types/settlement.ts');
  assert.match(typeSource, /export type SettlementExtensionType =/);
  assert.match(typeSource, /export interface SettlementExtensionItem/);
  assert.match(typeSource, /activeExtensions\?: SettlementExtensionItem\[\]/);
  assert.match(typeSource, /baseSimpleAmount\?: number/);

  const composableSource = await read('src/composables/useSettlement.ts');
  assert.match(composableSource, /toggleExtension/);
  assert.match(composableSource, /addExtensionItem/);
  assert.match(composableSource, /removeExtensionItem/);
  assert.match(composableSource, /updateExtensionItem/);
});

test('SettlementExtensionManager and specialized extension cards exist and use shared UI components', async () => {
  const managerSource = await read('src/views/settlement/SettlementExtensionManager.vue');
  assert.match(managerSource, /extension-chipbar/);
  assert.match(managerSource, /ExtensionCardPool/);
  assert.match(managerSource, /ExtensionCardCarpool/);
  assert.match(managerSource, /ExtensionCardMeal/);
  assert.match(managerSource, /ExtensionCardTank/);
  assert.match(managerSource, /ExtensionCardCustom/);

  const poolSource = await read('src/views/settlement/ExtensionCardPool.vue');
  assert.match(poolSource, /pool-grid/);
  assert.match(poolSource, /day-type-toggle/);
  assert.match(poolSource, /CustomInput/);

  const carpoolSource = await read('src/views/settlement/ExtensionCardCarpool.vue');
  assert.match(carpoolSource, /CustomSelect/);
  assert.match(carpoolSource, /CustomSwitch/);
  assert.match(carpoolSource, /driver-select/);

  const mealSource = await read('src/views/settlement/ExtensionCardMeal.vue');
  assert.match(mealSource, /attendee-chips/);
  assert.match(mealSource, /CustomNumberInput/);

  const customSource = await read('src/views/settlement/ExtensionCardCustom.vue');
  assert.match(customSource, /preset-chips/);
  assert.match(customSource, /custom-expense-list/);
});

test('SettlementMain implements Step 1 (정산 내용) -> Step 2 (인원/계좌) -> Step 3 (정산 결과) wizard flow', async () => {
  const mainSource = await read('src/views/settlement/SettlementMain.vue');
  assert.match(mainSource, /정산 내용/);
  assert.match(mainSource, /인원\/계좌/);
  assert.match(mainSource, /정산 결과/);
  assert.match(mainSource, /SettlementExtensionManager/);
  assert.match(mainSource, /PeopleCard/);
  assert.match(mainSource, /ResultSection/);
});

test('PersonCard uses compact 1-line toggles and CustomSelect without legacy arrows', async () => {
  const cardSource = await read('src/views/settlement/PersonCard.vue');
  assert.match(cardSource, /person-toggles/);
  assert.match(cardSource, /person-toggle-btn/);
  assert.match(cardSource, /CustomSelect/);
  assert.match(cardSource, /bank-select/);
});
