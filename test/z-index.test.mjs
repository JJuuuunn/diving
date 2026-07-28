import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('shared z-index tokens preserve the intended stacking order', async () => {
  const source = await read('src/assets/scss/abstracts/_variables.scss');
  const token = (name) => {
    const match = source.match(new RegExp(`--z-${name}:\\s*(\\d+)`));
    assert.ok(match, `missing --z-${name}`);
    return Number(match[1]);
  };

  const order = [
    'sticky-nav',
    'dropdown',
    'menu-toggle',
    'sidebar-overlay',
    'sidebar',
    'scroll-top',
    'modal',
    'toast',
  ].map(token);

  for (let index = 1; index < order.length; index += 1) {
    assert.ok(order[index] > order[index - 1], 'z-index tokens must increase by layer');
  }
});

test('playground lets active popup controls escape card stacking contexts', async () => {
  const source = await read('src/views/dev/ComponentPlayground.vue');
  assert.match(source, /\.test-section\s*\{[\s\S]*?overflow:\s*visible/);
  assert.match(source, /&:has\([\s\S]*?\.custom-select > \.select-trigger\.is-active,[\s\S]*?\.custom-datepicker > \.datepicker-trigger\.is-active[\s\S]*?\)\s*\{\s*z-index:\s*var\(--z-dropdown\)/);
  assert.doesNotMatch(source, /&:has\(\.is-active\)/);
});
