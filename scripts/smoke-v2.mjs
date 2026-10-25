import { randomUUID } from 'node:crypto';
import { Client } from 'pg';

if (process.env.SMOKE_TEST_ENABLED !== 'true') throw new Error('Smoke test is disabled outside the Compose qa profile.');
const base = process.env.SMOKE_BASE_URL || 'http://frontend:3000';
const email = `smoke-${randomUUID()}@studyforge.invalid`;
const password = `Qa-${randomUUID()}!`;
const term = 'smoke' + randomUUID().replaceAll('-', '');
const db = new Client();
await db.connect();
let cookie = '';
async function request(method, path, body) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return result;
}
try {
  const health = await request('GET', '/api/health');
  if (health.database !== 'postgresql') throw new Error('Health endpoint did not report PostgreSQL.');
  const registration = await request('POST', '/api/auth/register', { name: 'Smoke Test', email, password });
  const userId = registration.user.id;
  const me = await request('GET', '/api/auth/me');
  if (me.user?.id !== userId) throw new Error('Session cookie was not accepted.');
  const { collection } = await request('POST', '/api/collections', { name: 'Smoke collection' });
  const first = await request('POST', '/api/words', { term, collectionId: collection.id });
  const second = await request('POST', '/api/words', { term: term.toUpperCase(), collectionId: collection.id });
  if (!first.created || second.created || first.word.id !== second.word.id) throw new Error('Duplicate saved-word rule failed.');
  await request('PATCH', `/api/words/${first.word.id}/status`, { status: 'learning' });
  const queue = await request('GET', '/api/review/queue');
  if (!queue.words.some(word => word.id === first.word.id)) throw new Error('Saved word missing from review queue.');
  await request('POST', '/api/review/events', { savedWordId: first.word.id, correct: false, durationMs: 1000 });
  const stats = await request('GET', '/api/words/stats');
  if (stats.stats.total !== 1 || stats.stats.learning !== 1 || stats.stats.reviewEvents !== 1) throw new Error('Vocabulary statistics mismatch.');
  console.log('V2 Compose smoke test passed: proxy, PostgreSQL, auth, collections, duplicate save, status, review.');
} finally {
  try {
    await db.query('DELETE FROM users WHERE email_normalized=$1', [email]);
    await db.query(`DELETE FROM lexemes l WHERE l.language_code='en' AND l.normalized_term=$1
      AND NOT EXISTS (SELECT 1 FROM saved_words sw WHERE sw.lexeme_id=l.id)`, [term]);
  } finally { await db.end(); }
}
