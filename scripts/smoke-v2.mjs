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
async function request(method, path, body, expectedStatus) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (expectedStatus === undefined ? !response.ok : response.status !== expectedStatus) {
    throw new Error(`${method} ${path}: expected ${expectedStatus ?? '2xx'}, received ${response.status} ${JSON.stringify(result)}`);
  }
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return result;
}
try {
  const health = await request('GET', '/api/health');
  if (health.database !== 'postgresql') throw new Error('Health endpoint did not report PostgreSQL.');
  const unauthorized = await request('GET', '/api/collections', undefined, 401);
  if (unauthorized.error?.code !== 'AUTH_REQUIRED') throw new Error('Protected route did not reject an anonymous request.');
  const registration = await request('POST', '/api/auth/register', { name: 'Smoke Test', email, password });
  const userId = registration.user.id;
  const me = await request('GET', '/api/auth/me');
  if (me.user?.id !== userId) throw new Error('Session cookie was not accepted.');
  await request('POST', '/api/auth/logout');
  const anonymous = await request('GET', '/api/auth/me');
  if (anonymous.user !== null) throw new Error('Logout did not revoke the session.');
  const invalidLogin = await request('POST', '/api/auth/login', { email, password: `${password}-wrong` }, 401);
  if (invalidLogin.error?.code !== 'INVALID_CREDENTIALS') throw new Error('Invalid login returned an unexpected error.');
  await request('POST', '/api/auth/login', { email, password });
  const { collection: firstCollection } = await request('POST', '/api/collections', { name: 'Smoke collection A' });
  const { collection: secondCollection } = await request('POST', '/api/collections', { name: 'Smoke collection B' });
  const renamed = await request('PATCH', `/api/collections/${secondCollection.id}`, { name: 'Smoke collection renamed', description: 'QA' });
  if (renamed.collection.name !== 'Smoke collection renamed') throw new Error('Collection rename failed.');
  const first = await request('POST', '/api/words', { term, collectionId: firstCollection.id });
  const second = await request('POST', '/api/words', { term: term.toUpperCase(), collectionId: secondCollection.id });
  if (!first.created || second.created || first.word.id !== second.word.id || second.word.collectionId !== firstCollection.id) throw new Error('Duplicate saved-word rule failed.');
  const filtered = await request('GET', `/api/words?collectionId=${firstCollection.id}&status=new&q=${encodeURIComponent(term.slice(0, 12))}`);
  if (filtered.words.length !== 1 || filtered.words[0].id !== first.word.id) throw new Error('Vocabulary filters failed.');
  const moved = await request('PATCH', `/api/words/${first.word.id}/collection`, { collectionId: secondCollection.id });
  if (moved.word.collectionId !== secondCollection.id) throw new Error('Moving a word between collections failed.');
  const nonEmpty = await request('DELETE', `/api/collections/${secondCollection.id}`, undefined, 409);
  if (nonEmpty.error?.code !== 'COLLECTION_NOT_EMPTY') throw new Error('Non-empty collection deletion rule failed.');
  await request('PATCH', `/api/words/${first.word.id}/collection`, { collectionId: firstCollection.id });
  await request('DELETE', `/api/collections/${secondCollection.id}`);
  await request('PATCH', `/api/words/${first.word.id}/status`, { status: 'learning' });
  const queue = await request('GET', '/api/review/queue');
  if (!queue.words.some(word => word.id === first.word.id)) throw new Error('Saved word missing from review queue.');
  await request('POST', '/api/review/events', { savedWordId: first.word.id, correct: false, durationMs: 1000 });
  const stats = await request('GET', '/api/words/stats');
  if (stats.stats.total !== 1 || stats.stats.learning !== 1 || stats.stats.reviewEvents !== 1) throw new Error('Vocabulary statistics mismatch.');
  await request('PATCH', `/api/words/${first.word.id}/status`, { status: 'known' });
  await request('PATCH', `/api/words/${first.word.id}/status`, { status: 'new' });
  await request('POST', '/api/auth/logout');
  await request('GET', '/api/collections', undefined, 401);
  console.log('V2 Compose smoke test passed: proxy, PostgreSQL, auth lifecycle, collection CRUD, vocabulary filters/move/duplicate/status, review.');
} finally {
  try {
    await db.query('DELETE FROM users WHERE email_normalized=$1', [email]);
    await db.query(`DELETE FROM lexemes l WHERE l.language_code='en' AND l.normalized_term=$1
      AND NOT EXISTS (SELECT 1 FROM saved_words sw WHERE sw.lexeme_id=l.id)`, [term]);
  } finally { await db.end(); }
}
