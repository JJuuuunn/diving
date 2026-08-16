import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('useKeyboardNav composable module exports handleRovingFocus, handleListArrowNav, and useKeyboardNav', async () => {
  const source = await read('src/composables/useKeyboardNav.ts');

  assert.match(source, /export interface RovingFocusOptions/);
  assert.match(source, /export interface ListArrowNavOptions/);
  assert.match(source, /export function handleRovingFocus/);
  assert.match(source, /export function handleListArrowNav/);
  assert.match(source, /export function useKeyboardNav/);
});

test('handleRovingFocus implementation supports circular loop, orientation, Home/End, and event.preventDefault()', async () => {
  const source = await read('src/composables/useKeyboardNav.ts');

  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /ArrowDown/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowUp/);
  assert.match(source, /Home/);
  assert.match(source, /End/);
  assert.match(source, /focus\(\)/);
});

test('handleListArrowNav implementation calculates target index and invokes onSelect callback', async () => {
  const source = await read('src/composables/useKeyboardNav.ts');

  assert.match(source, /onSelect\(nextIndex\)/);
  assert.match(source, /orientation/);
  assert.match(source, /loop/);
});
