import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { createApp } from '../backend/src/app.ts';
import type { App } from '../backend/src/app.ts';
import type { User, Catalog, Quiz, AttemptResult, Dashboard, ReviewItem } from '../packages/contracts/src/index.ts';

async function fixture(databasePath = ':memory:') {
  const app = createApp({ databasePath, secureCookies: false });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const address = app.server.address();
  assert(address && typeof address === 'object');
  const url = `http://127.0.0.1:${address.port}`;
  const request = async <T = unknown>(path: string, method = 'GET', body?: unknown, cookie = '', headers: Record<string, string> = {}) => {
    const response = await fetch(url + path, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const value = await response.json() as T;
    return { response, value };
  };
  const register = async (email = `${randomUUID()}@example.test`) => {
    const result = await request<{ user: User }>('/api/auth/register', 'POST', { name: 'Học viên', email, password: 'StudyForge2026!' });
    assert.equal(result.response.status, 201);
    const cookie = result.response.headers.get('set-cookie')!.split(';')[0];
    return { cookie, user: result.value.user, result };
  };
  return { app, url, request, register };
}

function correctAnswers(app: App, lessonId: string) {
  return app.db.prepare('SELECT id,answer FROM questions WHERE lesson_id=? ORDER BY position').all(lessonId).map(row => ({ questionId: String(row.id), answer: String(row.answer) }));
}

test('migrations and authored seed are idempotent, counts and foreign keys are valid', async () => {
  const f = await fixture();
  try {
    const { value } = await f.request<Catalog>('/api/catalog');
    assert.deepEqual(value.stats, { grammarLessons: 18, vocabularyLessons: 50, wordCount: 250 });
    assert.equal(value.sampleData, true);
    assert.equal(value.units.length, 31);
    assert.equal(f.app.db.prepare('PRAGMA foreign_key_check').all().length, 0);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM questions').get()!.n, 340);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM lesson_sections').get()!.n, 54);
  } finally { await f.app.close(); }
});

test('auth hashes passwords, uses HttpOnly cookies, validates input and isolates sessions', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/api/auth/register', 'POST', { name: 'X', email: 'bad', password: 'short' })).response.status, 400);
    const { cookie, user, result } = await f.register('student@example.test');
    assert.match(result.response.headers.get('set-cookie')!, /HttpOnly; SameSite=Lax/);
    assert.equal('password_hash' in user, false);
    const stored = f.app.db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id)!;
    assert.match(String(stored.password_hash), /^scrypt\$/);
    assert.notEqual(stored.password_hash, 'StudyForge2026!');
    assert.equal((await f.request('/api/auth/register', 'POST', { name: 'Other', email: 'STUDENT@example.test', password: 'AnotherPassword!' })).response.status, 409);
    assert.equal((await f.request('/api/auth/login', 'POST', { email: user.email, password: 'NotThePassword!' })).response.status, 401);
    assert.equal((await f.request<{ user: User }>('/api/auth/me', 'GET', undefined, cookie)).value.user.id, user.id);
    assert.equal((await f.request('/api/profile')).response.status, 401);
    await f.request('/api/auth/logout', 'POST', {}, cookie);
    assert.equal((await f.request<{ user: User | null }>('/api/auth/me', 'GET', undefined, cookie)).value.user, null);
    const loggedIn = await f.request('/api/auth/login', 'POST', { email: user.email, password: 'StudyForge2026!' });
    assert.equal(loggedIn.response.status, 200);
  } finally { await f.app.close(); }
});

test('guest previews never expose quiz answers and server enforces lesson locks', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/api/lessons/grammar-a1-1')).response.status, 200);
    assert.equal((await f.request('/api/lessons/grammar-a1-2')).response.status, 401);
    assert.equal((await f.request('/api/lessons/grammar-a2-1')).response.status, 401);
    assert.equal((await f.request('/api/lessons/vocabulary-education-1')).response.status, 200);
    const quiz = (await f.request<Quiz>('/api/lessons/grammar-a1-1/quiz')).value;
    assert.equal(quiz.questions.length, 5);
    for (const question of quiz.questions) {
      assert.equal('answer' in question, false);
      assert.equal('correctAnswer' in question, false);
      assert.equal('explanation' in question, false);
    }
    const attempt = await f.request<AttemptResult>('/api/lessons/grammar-a1-1/attempts', 'POST', { idempotencyKey: randomUUID(), answers: correctAnswers(f.app, 'grammar-a1-1') });
    assert.equal(attempt.value.passed, true);
    assert.equal(attempt.value.saved, false);
    assert.equal(attempt.value.xpEarned, 0);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM attempts').get()!.n, 0);
  } finally { await f.app.close(); }
});

test('grading, review, sequential unlock, XP and replay protection use database transactions', async () => {
  const f = await fixture();
  try {
    const { cookie, user } = await f.register();
    const answers = correctAnswers(f.app, 'grammar-a1-1');
    answers[0].answer = 'wrong';
    const payload = { answers, idempotencyKey: randomUUID() };
    assert.equal((await f.request('/api/lessons/grammar-a1-1/attempts', 'POST', payload, cookie)).response.status, 409);
    await f.request('/api/lessons/grammar-a1-1/learn', 'POST', {}, cookie);
    const first = await f.request<AttemptResult>('/api/lessons/grammar-a1-1/attempts', 'POST', payload, cookie);
    assert.equal(first.value.score, 80);
    assert.equal(first.value.passed, true);
    assert.equal(first.value.xpEarned, 40);
    assert.deepEqual((await f.request('/api/lessons/grammar-a1-1/attempts', 'POST', payload, cookie)).value, first.value);
    assert.equal(f.app.db.prepare('SELECT xp FROM users WHERE id=?').get(user.id)!.xp, 40);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM attempts').get()!.n, 1);
    assert.equal((await f.request('/api/lessons/grammar-a1-2', 'GET', undefined, cookie)).response.status, 200);
    assert.equal((await f.request('/api/lessons/grammar-a1-3', 'GET', undefined, cookie)).response.status, 403);
    const conflict = await f.request('/api/lessons/grammar-a1-1/attempts', 'POST', { ...payload, answers: [] }, cookie);
    assert.equal(conflict.response.status, 409);
    const second = await f.request<AttemptResult>('/api/lessons/grammar-a1-1/attempts', 'POST', { ...payload, idempotencyKey: randomUUID() }, cookie);
    assert.equal(second.value.xpEarned, 0);
    const review = (await f.request<{ items: ReviewItem[] }>('/api/review', 'GET', undefined, cookie)).value.items;
    assert.equal(review.length, 1);
    const another = await f.register();
    assert.equal((await f.request(`/api/review/${review[0].id}/resolve`, 'POST', { answer: review[0].correctAnswer }, another.cookie)).response.status, 404);
    assert.equal((await f.request<{ correct: boolean }>(`/api/review/${review[0].id}/resolve`, 'POST', { answer: 'wrong again' }, cookie)).value.correct, false);
    assert.equal((await f.request<{ items: ReviewItem[] }>('/api/review', 'GET', undefined, cookie)).value.items.length, 1);
    assert.equal((await f.request<{ correct: boolean }>(`/api/review/${review[0].id}/resolve`, 'POST', { answer: review[0].correctAnswer }, cookie)).value.correct, true);
    assert.equal((await f.request<{ items: ReviewItem[] }>('/api/review', 'GET', undefined, cookie)).value.items.length, 0);
    const dashboard = (await f.request<Dashboard>('/api/dashboard', 'GET', undefined, cookie)).value;
    assert.equal(dashboard.completedLessons, 1);
    assert.equal(dashboard.xp, 40);
  } finally { await f.app.close(); }
});

test('challenge completion unlocks only the next CEFR unit, and XP cannot be farmed', async () => {
  const f = await fixture();
  try {
    const { cookie } = await f.register();
    assert.equal((await f.request('/api/units/grammar-a1/challenge')).response.status, 401);
    assert.equal((await f.request('/api/units/grammar-a2/challenge', 'GET', undefined, cookie)).response.status, 403);
    const questions = (await f.request<Quiz>('/api/units/grammar-a1/challenge', 'GET', undefined, cookie)).value.questions;
    const answers = questions.map((q: { id: string }) => ({ questionId: q.id, answer: String(f.app.db.prepare('SELECT answer FROM questions WHERE id=?').get(q.id)!.answer) }));
    const result = (await f.request<AttemptResult>('/api/units/grammar-a1/attempts', 'POST', { answers, idempotencyKey: randomUUID() }, cookie)).value;
    assert.equal(result.score, 100);
    assert.equal(result.xpEarned, 60);
    const catalog = (await f.request<Catalog>('/api/catalog', 'GET', undefined, cookie)).value;
    assert.equal(catalog.units.find(u => u.id === 'grammar-a2')!.locked, false);
    assert.equal(catalog.units.find(u => u.id === 'grammar-b1')!.locked, true);
    const replay = (await f.request<AttemptResult>('/api/units/grammar-a1/attempts', 'POST', { answers, idempotencyKey: randomUUID() }, cookie)).value;
    assert.equal(replay.xpEarned, 0);
  } finally { await f.app.close(); }
});

test('malformed answers, unknown questions, bad origins and invalid support submissions are rejected', async () => {
  const f = await fixture();
  try {
    const { cookie } = await f.register();
    await f.request('/api/lessons/grammar-a1-1/learn', 'POST', {}, cookie);
    const bad = await f.request('/api/lessons/grammar-a1-1/attempts', 'POST', { idempotencyKey: randomUUID(), answers: [{ questionId: 'outside-question', answer: 'x' }] }, cookie);
    assert.equal(bad.response.status, 400);
    const origin = await f.request('/api/auth/logout', 'POST', {}, cookie, { Origin: 'https://untrusted.example' });
    assert.equal(origin.response.status, 403);
    assert.equal((await f.request<{ user: User | null }>('/api/auth/me', 'GET', undefined, cookie)).value.user !== null, true);
    assert.equal((await f.request('/api/support', 'POST', { category: 'bug', message: 'tiny' })).response.status, 400);
    assert.equal((await f.request('/api/support', 'POST', { category: 'bug', message: 'Trang bài học hiển thị chưa đúng trên màn hình nhỏ.' })).response.status, 201);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM feedback').get()!.n, 1);
    const duplicate = correctAnswers(f.app, 'grammar-a1-1').slice(0, 1);
    duplicate.push(duplicate[0]);
    assert.equal((await f.request('/api/lessons/grammar-a1-1/attempts', 'POST', { answers: duplicate, idempotencyKey: randomUUID() }, cookie)).response.status, 400);
    const invalidJson = await fetch(f.url + '/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
    assert.equal(invalidJson.status, 400);
  } finally { await f.app.close(); }
});

test('profile changes and database survive app restart without reseeding duplicates', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'studyforge-backend-'));
  const path = join(directory, 'test.sqlite');
  let first: Awaited<ReturnType<typeof fixture>> | undefined;
  let second: Awaited<ReturnType<typeof fixture>> | undefined;
  try {
    first = await fixture(path);
    const { cookie, user } = await first.register('persistent@example.test');
    assert.equal((await first.request<{ user: User }>('/api/profile', 'PATCH', { name: 'Tên đã đổi' }, cookie)).value.user.name, 'Tên đã đổi');
    await first.app.close();
    second = await fixture(path);
    assert.equal((await second.request<{ user: User }>('/api/auth/me', 'GET', undefined, cookie)).value.user.name, 'Tên đã đổi');
    assert.equal(second.app.db.prepare('SELECT COUNT(*) AS n FROM lessons').get()!.n, 68);
    assert.equal(second.app.db.prepare('SELECT COUNT(*) AS n FROM users WHERE id=?').get(user.id)!.n, 1);
  } finally {
    await first?.app.close(); await second?.app.close();
    const target = resolve(directory);
    assert(target.startsWith(resolve(tmpdir()) + sep) && target.includes('studyforge-backend-'));
    rmSync(target, { recursive: true, force: true });
  }
});
