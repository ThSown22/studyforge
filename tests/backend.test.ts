import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { createApp } from '../backend/src/app.ts';
import { getConfig } from '../backend/src/config/env.ts';
import { migrate } from '../backend/src/infrastructure/database/connection.ts';
import type { User, Catalog, Profile, ReviewItem } from '../packages/contracts/src/index.ts';

async function setup() {
  const app = createApp({ databasePath: ':memory:', secureCookies: false });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const address = app.server.address();
  assert(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  const call = async <T = unknown>(path: string, method = 'GET', body?: unknown, cookie = '', headers: Record<string, string> = {}) => {
    const response = await fetch(base + path, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { response, value: await response.json() as T };
  };
  const register = async () => {
    const { response, value } = await call<{ user: User }>('/api/auth/register', 'POST', { name: 'StudyForge learner', email: `${randomUUID()}@example.test`, password: 'ValidPassword1!' });
    assert.equal(response.status, 201);
    return { user: value.user, cookie: response.headers.get('set-cookie')!.split(';')[0] };
  };
  return { app, base, call, register };
}

test('expired or malformed sessions cannot authorize requests; unrelated cookies do not break login', async () => {
  const f = await setup();
  try {
    const { user, cookie } = await f.register();
    const combined = `colour=teal; ${cookie}; language=vi`;
    assert.equal((await f.call<{ user: User }>('/api/auth/me', 'GET', undefined, combined)).value.user.id, user.id);
    assert.equal((await f.call<{ user: User | null }>('/api/auth/me', 'GET', undefined, 'studyforge_session=%invalid')).value.user, null);
    f.app.db.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(user.id);
    assert.equal((await f.call<{ user: User | null }>('/api/auth/me', 'GET', undefined, cookie)).value.user, null);
    assert.equal((await f.call('/api/profile', 'PATCH', { name: 'Tampered' }, cookie)).response.status, 401);
    assert.equal(f.app.db.prepare('SELECT name FROM users WHERE id=?').get(user.id)!.name, 'StudyForge learner');
  } finally { await f.app.close(); }
});

test('request parser rejects oversized, non-JSON and malformed bodies while keeping API alive', async () => {
  const f = await setup();
  try {
    const oversized = await fetch(f.base + '/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'bug', message: 'x'.repeat(70000) }) });
    assert.equal(oversized.status, 413);
    const chunkedStatus = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(f.base + '/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, response => {
        response.resume();
        response.on('end', () => resolve(response.statusCode!));
      });
      request.on('error', reject);
      request.write('{"message":"');
      request.write('x'.repeat(70000));
      request.end('"}');
    });
    assert.equal(chunkedStatus, 413);
    const wrongType = await fetch(f.base + '/api/support', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'not json' });
    assert.equal(wrongType.status, 415);
    const malformed = await fetch(f.base + '/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"message":' });
    assert.equal(malformed.status, 400);
    assert.equal((await f.call('/api/support', 'POST', [])).response.status, 400);
    assert.equal((await f.call('/api/health')).response.status, 200);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS count FROM feedback').get()!.count, 0);
  } finally { await f.app.close(); }
});

test('repeated invalid passwords are rate limited without invalidating an existing session', async () => {
  const f = await setup();
  try {
    const { user, cookie } = await f.register();
    for (let i = 0; i < 29; i++) {
      const result = await f.call('/api/auth/login', 'POST', { email: user.email, password: 'IncorrectPassword!' });
      assert.equal(result.response.status, 401);
    }
    const blocked = await f.call('/api/auth/login', 'POST', { email: user.email, password: 'IncorrectPassword!' });
    assert.equal(blocked.response.status, 429);
    assert(Number(blocked.response.headers.get('retry-after')) > 0);
    assert.equal((await f.call<{ user: User }>('/api/auth/me', 'GET', undefined, cookie)).value.user.id, user.id);
  } finally { await f.app.close(); }
});

test('Origin and Fetch Metadata checks reject cross-site writes and permit configured frontend', async () => {
  const f = await setup();
  try {
    const { cookie } = await f.register();
    const denied = await f.call('/api/profile', 'PATCH', { name: 'Wrong origin' }, cookie, { Origin: 'https://external.example' });
    assert.equal(denied.response.status, 403);
    const metadataDenied = await f.call('/api/profile', 'PATCH', { name: 'Cross site' }, cookie, { 'Sec-Fetch-Site': 'cross-site' });
    assert.equal(metadataDenied.response.status, 403);
    const allowed = await f.call<{ user: User }>('/api/profile', 'PATCH', { name: 'Updated through frontend' }, cookie, { Origin: 'http://localhost:3000' });
    assert.equal(allowed.response.status, 200);
    assert.equal(allowed.value.user.name, 'Updated through frontend');
    assert.equal(allowed.response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(allowed.response.headers.get('access-control-allow-credentials'), 'true');
    const preflight = await fetch(f.base + '/api/profile', { method: 'OPTIONS', headers: { Origin: 'http://localhost:3000' } });
    assert.equal(preflight.status, 204);
  } finally { await f.app.close(); }
});

test('profile validation, support persistence and student data isolation hold across API calls', async () => {
  const f = await setup();
  try {
    const first = await f.register();
    const second = await f.register();
    assert.equal((await f.call('/api/profile', 'PATCH', { name: 'A' }, first.cookie)).response.status, 400);
    assert.equal((await f.call('/api/profile', 'PATCH', { name: 'x'.repeat(81) }, first.cookie)).response.status, 400);
    await f.call('/api/profile', 'PATCH', { name: 'Học viên thứ nhất' }, first.cookie);
    const profileA = (await f.call<Profile>('/api/profile', 'GET', undefined, first.cookie)).value;
    const profileB = (await f.call<Profile>('/api/profile', 'GET', undefined, second.cookie)).value;
    assert.equal(profileA.user.name, 'Học viên thứ nhất');
    assert.equal(profileB.user.name, 'StudyForge learner');
    assert.notEqual(profileA.user.id, profileB.user.id);
    const malicious = "A useful report about a label: '); DROP TABLE users; --";
    const feedback = await f.call<{ id: string }>('/api/support', 'POST', { category: 'content', message: malicious }, first.cookie);
    assert.equal(feedback.response.status, 201);
    const stored = f.app.db.prepare('SELECT user_id,email,message FROM feedback WHERE id=?').get(feedback.value.id)!;
    assert.equal(stored.user_id, first.user.id);
    assert.equal(stored.email, first.user.email);
    assert.equal(stored.message, malicious);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS count FROM users').get()!.count, 2);
    assert.equal((await f.call('/api/support', 'POST', { category: 'bug', message: 'A valid detailed report.', email: 'invalid email' })).response.status, 400);
    assert.equal((await f.call('/api/review')).response.status, 401);
    assert.deepEqual((await f.call<{ items: ReviewItem[] }>('/api/review', 'GET', undefined, second.cookie)).value.items, []);
  } finally { await f.app.close(); }
});

test('direct challenge submissions cannot open locked levels or award XP', async () => {
  const f = await setup();
  try {
    const { cookie, user } = await f.register();
    for (const unitId of ['grammar-a2', 'grammar-b1', 'grammar-c2']) {
      const questions = f.app.db.prepare('SELECT q.id,q.answer FROM questions q JOIN lessons l ON l.id=q.lesson_id WHERE l.unit_id=?').all(unitId);
      const answers = questions.map(q => ({ questionId: String(q.id), answer: String(q.answer) }));
      const response = await f.call(`/api/units/${unitId}/attempts`, 'POST', { answers, idempotencyKey: randomUUID() }, cookie);
      assert.equal(response.response.status, 403);
    }
    assert.equal(f.app.db.prepare('SELECT xp FROM users WHERE id=?').get(user.id)!.xp, 0);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS count FROM unit_unlocks').get()!.count, 0);
    const catalog = (await f.call<Catalog>('/api/catalog', 'GET', undefined, cookie)).value;
    assert.equal(catalog.units.filter(unit => unit.track === 'grammar' && !unit.locked).length, 1);
  } finally { await f.app.close(); }
});

test('static serving cannot expose database, env or encoded traversal paths', async () => {
  const f = await setup();
  try {
    for (const path of ['/../backend/.env', '/%2e%2e%2fbackend%2f.env', '/%2e%2e%5cdatabase%5cmigrations%5c001_initial.sql', '/.env', '/data/studyforge.sqlite', '/%00']) {
      const response = await fetch(f.base + path);
      assert.equal(response.status, 404, path);
      assert.match(response.headers.get('content-type')!, /application\/json/);
    }
  } finally { await f.app.close(); }
});

test('migrations 001 and 002 apply exactly once without mutating existing curriculum', async () => {
  const f = await setup();
  try {
    const initial = f.app.db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row => row.version);
    assert.deepEqual(initial, ['001_initial.sql', '002_vocabulary_provenance.sql']);
    const count = () => f.app.db.prepare('SELECT COUNT(*) AS count FROM flashcards').get()!.count;
    assert.equal(count(), 250);
    migrate(f.app.db);
    assert.equal(count(), 250);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get()!.count, 2);
    assert.equal(f.app.db.prepare('SELECT COUNT(*) AS count FROM vocabulary_imports').get()!.count, 0);
    assert.equal(f.app.db.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally { await f.app.close(); }
});

test('backend environment validates values and refuses insecure production cookies', () => {
  const previous = { ...process.env };
  const names = ['API_PORT', 'HOST', 'DATABASE_PATH', 'FRONTEND_DIR', 'SECURE_COOKIES', 'SESSION_TTL_SECONDS', 'ALLOWED_ORIGINS', 'NODE_ENV'];
  try {
    for (const key of names) delete process.env[key];
    assert.equal(getConfig().port, 3001);
    const cases: [string, string][] = [['API_PORT', '1e3'], ['API_PORT', '0'], ['API_PORT', '65536'], ['HOST', 'not a host'], ['DATABASE_PATH', '  '], ['FRONTEND_DIR', ' '], ['SECURE_COOKIES', 'yes'], ['SESSION_TTL_SECONDS', '299'], ['ALLOWED_ORIGINS', 'https://example.test/path']];
    for (const [key, value] of cases) {
      process.env[key] = value;
      assert.throws(() => getConfig(), `${key}=${value}`);
      delete process.env[key];
    }
    process.env.NODE_ENV = 'production';
    assert.throws(() => getConfig(), /SECURE_COOKIES/);
    process.env.SECURE_COOKIES = 'true';
    assert.equal(getConfig().secureCookies, true);
  } finally {
    for (const key of names) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
