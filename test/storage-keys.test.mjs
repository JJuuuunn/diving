import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();

async function read(relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

async function getFilesRecursively(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursively(res)));
    } else if (/\.(ts|vue|js|html)$/.test(entry.name)) {
      files.push(res);
    }
  }
  return files;
}

const STORAGE_KEY_PATTERN = /^diving:[a-z0-9_-]+:[a-z0-9_-]+:v[0-9]+$/;

test('theme store and index.html use diving:theme:mode:v1 and migration', async () => {
  const themeSource = await read('src/stores/theme.ts');
  const htmlSource = await read('index.html');

  assert.match(themeSource, /export const THEME_STORAGE_KEY = ['"]diving:theme:mode:v1['"]/);
  assert.match(themeSource, /localStorage\.getItem\(['"]theme-mode['"]\)/);
  assert.match(themeSource, /localStorage\.getItem\(['"]isDay['"]\)/);
  assert.match(themeSource, /localStorage\.removeItem\(['"]theme-mode['"]\)/);
  assert.match(themeSource, /localStorage\.removeItem\(['"]isDay['"]\)/);

  assert.match(htmlSource, /localStorage\.getItem\(['"]diving:theme:mode:v1['"]\)/);
});

test('competition store uses diving:competition:bookmarks:v1 and migration', async () => {
  const compSource = await read('src/stores/competition.ts');

  assert.match(compSource, /export const COMPETITION_BOOKMARKS_STORAGE_KEY = ['"]diving:competition:bookmarks:v1['"]/);
  assert.match(compSource, /export const LEGACY_BOOKMARKS_STORAGE_KEY = ['"]bookmarked-competitions-ids['"]/);
  assert.match(compSource, /export const LEGACY_BOOKMARKS_V4_FLAG_KEY = ['"]competition-bookmarks-v4['"]/);
  assert.match(compSource, /localStorage\.removeItem\(LEGACY_BOOKMARKS_STORAGE_KEY\)/);
  assert.match(compSource, /localStorage\.removeItem\(LEGACY_BOOKMARKS_V4_FLAG_KEY\)/);
});

test('all project diving:* storage keys in src and index.html conform to data-persistence.md standard format', async () => {
  const srcFiles = await getFilesRecursively(path.join(rootDir, 'src'));
  const htmlFile = path.join(rootDir, 'index.html');
  const allFiles = [...srcFiles, htmlFile];

  const foundKeys = new Set();
  const keyRegex = /['"](diving:[^'"]+)['"]/g;

  for (const filePath of allFiles) {
    const content = await readFile(filePath, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
      foundKeys.add(match[1]);
    }
  }

  assert.ok(foundKeys.size >= 10, `Expected at least 10 storage keys across project, found ${foundKeys.size}`);

  for (const key of foundKeys) {
    assert.match(
      key,
      STORAGE_KEY_PATTERN,
      `Storage key "${key}" does not match required format diving:<feature>:<data>:v<schema>`
    );
  }
});
