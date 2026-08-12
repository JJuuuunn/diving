import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('logbook exposes four selectable card designs and applies the selection to cards', async () => {
  const picker = await read('src/views/logbook/LogCardDesignPicker.vue');
  const main = await read('src/views/logbook/LogbookMain.vue');
  const card = await read('src/views/logbook/LogCard.vue');

  for (const design of ['ocean', 'expedition', 'coral', 'minimal']) {
    assert.match(picker, new RegExp(`value: '${design}'`));
  }
  assert.match(picker, /:aria-pressed="modelValue === option\.value"/);
  assert.match(main, /<LogCardDesignPicker v-model="selectedCardDesign"/);
  assert.match(main, /:design="selectedCardDesign"/);
  assert.match(card, /`design-\$\{design\}`/);
});

test('signature display stays transparent and switches ink for dark mode', async () => {
  const styles = await read('src/assets/scss/pages/_logbook.scss');
  const cardSignature = styles.match(/\.sig-img-box \{([\s\S]*?)\n\s*\}\n\s*\}/)?.[1] ?? '';

  assert.match(cardSignature, /background: transparent/);
  assert.match(cardSignature, /filter: none/);
  assert.match(cardSignature, /filter: invert\(1\) brightness\(2\)/);
});
