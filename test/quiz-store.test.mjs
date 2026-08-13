import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();

async function read(relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

test('quiz types export WrongNoteItem with required fields', async () => {
  const quizTypeSource = await read('src/types/quiz.ts');

  assert.match(quizTypeSource, /export interface WrongNoteItem/);
  assert.match(quizTypeSource, /questionId:\s*number;/);
  assert.match(quizTypeSource, /question:\s*Question;/);
  assert.match(quizTypeSource, /userAnswer:\s*any;/);
  assert.match(quizTypeSource, /addedAt:\s*string;/);
});

test('quiz store implements wrong notes and bookmarks state and methods', async () => {
  const quizStoreSource = await read('src/stores/quiz.ts');

  // Keys
  assert.match(quizStoreSource, /export const QUIZ_WRONG_NOTES_KEY = ['"]diving:quiz:wrong_notes:v1['"]/);
  assert.match(quizStoreSource, /export const LEGACY_QUIZ_WRONG_NOTES_KEY = ['"]diving_quiz_wrong_notes['"]/);
  assert.match(quizStoreSource, /export const QUIZ_BOOKMARKS_KEY = ['"]diving:quiz:bookmarks:v1['"]/);
  assert.match(quizStoreSource, /export const LEGACY_QUIZ_BOOKMARKS_KEY = ['"]diving_quiz_bookmarks['"]/);

  // Wrong notes methods
  assert.match(quizStoreSource, /addWrongNote/);
  assert.match(quizStoreSource, /removeWrongNote/);
  assert.match(quizStoreSource, /isWrongNote/);
  assert.match(quizStoreSource, /clearWrongNotes/);

  // Bookmarks methods
  assert.match(quizStoreSource, /toggleBookmark/);
  assert.match(quizStoreSource, /isBookmarked/);
  assert.match(quizStoreSource, /clearBookmarks/);
});
