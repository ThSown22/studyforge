import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importVocabulary } from '../backend/src/modules/vocabulary/import/importer.ts';
import { parseCsvDocument, parseCsvRows, parseJsonDocument } from '../backend/src/modules/vocabulary/import/parser.ts';
import { IMPORT_LIMITS, VocabularyImportError } from '../backend/src/modules/vocabulary/import/types.ts';
import type { VocabularyDocument } from '../backend/src/modules/vocabulary/import/types.ts';

function database(provenance = true): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(new URL('../database/migrations/001_initial.sql', import.meta.url), 'utf8'));
  if (provenance) db.exec(readFileSync(new URL('../database/migrations/002_vocabulary_provenance.sql', import.meta.url), 'utf8'));
  db.exec(`INSERT INTO units(id,track,title,subtitle,description,position,color) VALUES('vocab','vocabulary','Vocabulary','Topic','Description',1,'teal'),('grammar','grammar','Grammar','A1','Description',1,'teal');
    INSERT INTO lessons(id,unit_id,title,category,description,position) VALUES('vocab-1','vocab','Vocabulary 1','Words','Description',1),('grammar-1','grammar','Grammar 1','Grammar','Description',1);
    INSERT INTO questions(id,lesson_id,position,prompt,type,options_json,answer,explanation) VALUES('question-1','vocab-1',1,'A question','choice','["A","B"]','A','Explanation');`);
  return db;
}

function document(): VocabularyDocument {
  return {
    source: { id: 'test-authored', name: 'Original test words', url: 'https://example.org/original', license: 'authored', attribution: 'Authored for this test.' },
    entries: [{ lessonId: 'vocab-1', word: 'learning journal', phonetic: '/ˈlɜːnɪŋ/', partOfSpeech: 'noun phrase', meaning: 'nhật ký học tập', example: 'Mai writes a learning journal.', translation: 'Mai viết nhật ký học tập.' }],
  };
}

function count(db: DatabaseSync, table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;
}

test('JSON and CSV accept UTF-8 BOM, commas, escaped quotes and embedded newlines', () => {
  const json = parseJsonDocument(`\uFEFF${JSON.stringify(document())}`);
  assert.equal(json.entries[0].meaning, 'nhật ký học tập');
  const csv = '\uFEFFlessonId,word,phonetic,partOfSpeech,meaning,example,translation\r\nvocab-1,journal,,noun,"ghi chép, nhật ký","She said ""hello"".\r\nThen she wrote.",Cô ấy viết.\r\n';
  const parsed = parseCsvDocument(csv, document().source);
  assert.equal(parsed.entries[0].meaning, 'ghi chép, nhật ký');
  assert.equal(parsed.entries[0].example, 'She said "hello".\r\nThen she wrote.');
  assert.equal(parsed.entries[0].phonetic, '');
});

test('malformed CSV quoting, duplicate/missing/unknown headers and column counts are rejected', () => {
  assert.throws(() => parseCsvRows('a,b\n"unfinished'), /chưa đóng/);
  assert.throws(() => parseCsvRows('a,b\nwrong"quote,value'), /Dấu nháy/);
  assert.throws(() => parseCsvRows('a,b\n"value"junk,b'), /nháy đóng/);
  for (const header of [
    'lessonId,word,phonetic,partOfSpeech,meaning,example,example',
    'lessonId,word,meaning',
    'lessonId,word,phonetic,partOfSpeech,meaning,example,unknown',
  ]) assert.throws(() => parseCsvDocument(`${header}\na,b,c`, document().source), /CSV cần đúng/);
  assert.throws(() => parseCsvDocument('lessonId,word,phonetic,partOfSpeech,meaning,example,translation\nvocab-1,journal', document().source), /cần 7 cột/);
});

test('unknown licenses, credential-bearing URLs and missing CC attribution are rejected', () => {
  for (const source of [
    { ...document().source, license: 'free-on-the-internet' },
    { ...document().source, url: 'javascript:alert(1)' },
    { ...document().source, url: 'https://user:password@example.org/data' },
    { ...document().source, licenseUrl: 'file:///private/license' },
    { ...document().source, license: 'CC-BY-4.0', attribution: '' },
    { ...document().source, license: 'CC-BY-SA-4.0', attribution: '' },
  ]) assert.throws(() => parseJsonDocument(JSON.stringify({ ...document(), source })), VocabularyImportError);
  const licensed = parseJsonDocument(JSON.stringify({ ...document(), source: { ...document().source, license: 'CC-BY-4.0' } }));
  assert.equal(licensed.source.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/');
});

test('all entry fields, row limits and byte limits are validated before writes', () => {
  const db = database();
  try {
    const invalid = document();
    invalid.entries.push({ ...invalid.entries[0], word: '', example: 'Another example.' });
    assert.throws(() => importVocabulary(db, invalid, { apply: true }), /không nhập bất kỳ dòng/);
    assert.equal(count(db, 'flashcards'), 0);
    assert.equal(count(db, 'vocabulary_sources'), 0);
    assert.throws(() => parseJsonDocument(' '.repeat(IMPORT_LIMITS.maxBytes + 1)), /vượt giới hạn/);
    assert.throws(() => parseJsonDocument(JSON.stringify({ ...document(), entries: Array.from({ length: IMPORT_LIMITS.maxRows + 1 }, () => document().entries[0]) })), /entries cần/);
  } finally { db.close(); }
});

test('dry-run performs no database mutation, including without provenance migration', () => {
  const db = database(false);
  try {
    const before = db.prepare('SELECT total_changes() AS changes').get();
    const plan = importVocabulary(db, document());
    assert.equal(plan.mode, 'dry-run');
    assert.equal(plan.status, 'planned');
    assert.equal(plan.insertedCount, 1);
    assert.equal(plan.provenanceSchemaReady, false);
    assert.deepEqual(db.prepare('SELECT total_changes() AS changes').get(), before);
    assert.equal(count(db, 'flashcards'), 0);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='vocabulary_sources'").get(), undefined);
    assert.throws(() => importVocabulary(db, document(), { apply: true }), /migration 002/);
  } finally { db.close(); }
});

test('missing and grammar lessons fail the complete import without partial rows', () => {
  for (const lessonId of ['missing-lesson', 'grammar-1']) {
    const db = database();
    try {
      const invalid = document();
      invalid.entries.push({ ...invalid.entries[0], lessonId, word: 'second entry' });
      assert.throws(() => importVocabulary(db, invalid, { apply: true }), /không tồn tại hoặc không thuộc/);
      assert.equal(count(db, 'flashcards'), 0);
      assert.equal(count(db, 'vocabulary_imports'), 0);
    } finally { db.close(); }
  }
});

test('apply appends cards with provenance, normalized deduplication and digest idempotency', () => {
  const db = database();
  try {
    const input = document();
    input.entries.push({ ...input.entries[0], word: '  LEARNING   JOURNAL ', meaning: 'NHẬT KÝ HỌC TẬP', partOfSpeech: 'NOUN PHRASE' });
    const report = importVocabulary(db, input, { apply: true });
    assert.equal(report.status, 'imported');
    assert.equal(report.insertedCount, 1);
    assert.equal(report.duplicateCount, 1);
    assert.equal(count(db, 'flashcards'), 1);
    assert.equal(count(db, 'flashcard_provenance'), 1);
    assert.equal(count(db, 'questions'), 1);
    assert.equal(count(db, 'progress'), 0);
    const again = importVocabulary(db, input, { apply: true });
    assert.equal(again.status, 'already-imported');
    assert.equal(again.insertedCount, 0);
    assert.equal(again.importId, report.importId);
    assert.equal(count(db, 'vocabulary_imports'), 1);
    const changed = document();
    changed.entries.push({ ...changed.entries[0], word: 'study partner', meaning: 'bạn cùng học' });
    const next = importVocabulary(db, changed, { apply: true });
    assert.equal(next.insertedCount, 1);
    assert.equal(next.duplicateCount, 1);
    assert.deepEqual((db.prepare('SELECT position FROM flashcards ORDER BY position').all() as { position: number }[]).map((row) => row.position), [1, 2]);
  } finally { db.close(); }
});

test('source metadata cannot be silently overwritten', () => {
  const db = database();
  try {
    importVocabulary(db, document(), { apply: true });
    const changed = document();
    changed.source.url = 'https://example.org/different';
    assert.throws(() => importVocabulary(db, changed, { apply: true }), /metadata khác/);
    assert.equal(count(db, 'vocabulary_sources'), 1);
    assert.equal(count(db, 'flashcards'), 1);
  } finally { db.close(); }
});

test('a failure midway rolls back cards, source, import ledger and provenance together', () => {
  const db = database();
  try {
    db.exec("CREATE TRIGGER reject_test_card BEFORE INSERT ON flashcards WHEN NEW.word = 'force failure' BEGIN SELECT RAISE(ABORT,'intentional test failure'); END;");
    const input = document();
    input.entries.push({ ...input.entries[0], word: 'force failure', meaning: 'một nghĩa khác' });
    assert.throws(() => importVocabulary(db, input, { apply: true }), /intentional test failure/);
    for (const table of ['flashcards', 'vocabulary_sources', 'vocabulary_imports', 'flashcard_provenance']) assert.equal(count(db, table), 0);
    assert.equal(count(db, 'questions'), 1);
  } finally { db.close(); }
});

test('CLI dry-run leaves an existing database byte-identical; apply and replay work end to end', () => {
  const directory = mkdtempSync(join(tmpdir(), 'studyforge-vocabulary-import-'));
  const databasePath = join(directory, 'test.sqlite');
  const inputPath = join(directory, 'input.json');
  const invalidPath = join(directory, 'invalid.json');
  const cli = fileURLToPath(new URL('../backend/src/modules/vocabulary/import/cli.ts', import.meta.url));
  try {
    const db = new DatabaseSync(databasePath);
    db.exec(readFileSync(new URL('../database/migrations/001_initial.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO schema_migrations(version,applied_at) VALUES(?,?)').run('001_initial.sql', new Date().toISOString());
    db.exec("INSERT INTO units(id,track,title,subtitle,description,position,color) VALUES('vocab','vocabulary','Words','Topic','Description',1,'teal'); INSERT INTO lessons(id,unit_id,title,category,description,position) VALUES('vocab-1','vocab','Words','Words','Description',1);");
    db.close();
    writeFileSync(inputPath, `\uFEFF${JSON.stringify(document())}`, 'utf8');
    writeFileSync(invalidPath, Buffer.from([0xc3, 0x28]));
    const run = (...args: string[]) => spawnSync(process.execPath, ['--experimental-strip-types', cli, '--file', inputPath, '--database', databasePath, ...args], { encoding: 'utf8' });
    const before = readFileSync(databasePath);
    const preview = run();
    assert.equal(preview.status, 0, preview.stderr);
    const planned = JSON.parse(preview.stdout);
    assert.equal(planned.mode, 'dry-run');
    assert.equal(planned.insertedCount, 1);
    assert.equal(planned.provenanceSchemaReady, false);
    assert.deepEqual(readFileSync(databasePath), before);
    const applied = run('--apply');
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(JSON.parse(applied.stdout).status, 'imported');
    const replay = run('--apply');
    assert.equal(replay.status, 0, replay.stderr);
    assert.equal(JSON.parse(replay.stdout).status, 'already-imported');
    const invalid = spawnSync(process.execPath, ['--experimental-strip-types', cli, '--file', invalidPath, '--database', databasePath], { encoding: 'utf8' });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /INVALID_ENCODING/);
  } finally {
    assert.equal(resolve(dirname(directory)), resolve(tmpdir()));
    for (const file of [inputPath, invalidPath, databasePath]) {
      try { unlinkSync(file); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    rmdirSync(directory);
  }
});
