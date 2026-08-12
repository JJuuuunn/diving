import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('light and dark themes expose the shared semantic color contract', async () => {
  const source = await read('src/assets/scss/abstracts/_variables.scss');
  const tokens = [
    'action',
    'info-text',
    'info-bg',
    'success-text',
    'success-bg',
    'warning-text',
    'warning-bg',
    'danger-text',
    'danger-bg',
    'neutral-text',
    'neutral-bg',
    'disabled-text',
    'disabled-bg'
  ];

  for (const token of tokens) {
    const occurrences = source.match(new RegExp(`--color-${token}:`, 'g')) ?? [];
    assert.equal(occurrences.length, 4, `--color-${token} must exist in all four themes`);
  }
});

test('competition status colors use semantic tokens', async () => {
  const source = await read('src/assets/scss/pages/_competition.scss');
  assert.match(source, /\.registration-open \{ background: var\(--color-success-bg\)/);
  assert.match(source, /\.registration-closed \{ background: var\(--color-danger-bg\)/);
  assert.match(source, /\.schedule-upcoming \{ background: var\(--color-info-bg\)/);
  assert.match(source, /\.schedule-ended \{ background: var\(--color-neutral-bg\)/);
});

test('primary module surfaces use the shared page color contract', async () => {
  const moduleStyles = [
    'src/assets/scss/pages/_competition.scss',
    'src/assets/scss/pages/_home.scss',
    'src/assets/scss/pages/_logbook.scss',
    'src/assets/scss/pages/_medical.scss',
    'src/assets/scss/pages/_quiz.scss'
  ];

  for (const moduleStyle of moduleStyles) {
    const source = await read(moduleStyle);
    assert.match(source, /var\(--page-card-bg\)/, `${moduleStyle} must use the shared card surface`);
    assert.match(source, /var\(--page-card-border\)/, `${moduleStyle} must use the shared card border`);
  }
});

test('competition calendar constrains long event names to their day cell', async () => {
  const source = await read('src/assets/scss/pages/_competition.scss');
  const panelSource = await read('src/assets/scss/components/_calendar-panel.scss');

  assert.match(panelSource, /&__day\.custom-ui-button \{[\s\S]*?overflow: hidden;/);
  assert.match(panelSource, /\.custom-ui-button__content \{[\s\S]*?min-width: 0;[\s\S]*?overflow: hidden;/);
  assert.match(source, /\.calendar-event, \.calendar-more \{[\s\S]*?max-width: 100%;[\s\S]*?text-overflow: ellipsis;/);
});

test('shared calendar keeps predictable two-event desktop and compact mobile cell heights', async () => {
  const source = await read('src/assets/scss/components/_calendar-panel.scss');

  assert.match(source, /&__day\.custom-ui-button \{[\s\S]*?height: 112px;[\s\S]*?min-height: 112px;/);
  assert.match(source, /&__day\.custom-ui-button \{[\s\S]*?align-items: flex-start;[\s\S]*?justify-content: flex-start;/);
  assert.match(source, /\.custom-ui-button__content \{[\s\S]*?flex-direction: column;[\s\S]*?height: 100%;[\s\S]*?text-align: left;/);
  assert.match(source, /&__day-number \{[\s\S]*?width: 100%;[\s\S]*?font-size: \.85rem;[\s\S]*?text-align: left;/);
  assert.match(source, /&__cell-content \{[\s\S]*?margin-top: auto;[\s\S]*?overflow: hidden;/);
  assert.match(source, /@media \(max-width: 520px\)[\s\S]*?&__day\.custom-ui-button \{[\s\S]*?height: 76px;/);
});

test('competition calendar event labels use theme-aware semantic colors', async () => {
  const source = await read('src/assets/scss/pages/_competition.scss');

  assert.match(source, /\.calendar-event \{[\s\S]*?background: var\(--color-info-bg\);[\s\S]*?color: var\(--color-info-text\);/);
  assert.match(source, /\.calendar-more \{[\s\S]*?background: var\(--color-neutral-bg\);[\s\S]*?color: var\(--color-neutral-text\);/);
});
