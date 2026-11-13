import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForPostgres } from '../backend/src/infrastructure/database/postgres.ts';

test('PostgreSQL startup probe retries transient failures', async () => {
  let queries = 0;
  const retries: string[] = [];
  const db = { query: async () => {
    queries++;
    if (queries < 3) throw new Error('database is starting');
    return {};
  } };
  await waitForPostgres(db, { attempts: 3, delayMs: 0, onRetry: message => retries.push(message) });
  assert.equal(queries, 3);
  assert.equal(retries.length, 2);
});

test('PostgreSQL startup probe reports the final failure', async () => {
  let queries = 0;
  const db = { query: async () => { queries++; throw new Error('database unavailable'); } };
  await assert.rejects(() => waitForPostgres(db, { attempts: 2, delayMs: 0, onRetry: () => undefined }), /database unavailable/);
  assert.equal(queries, 2);
});
