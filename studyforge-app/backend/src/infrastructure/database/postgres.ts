import { Pool } from 'pg';

interface DatabaseProbe { query(sql: string): Promise<unknown> }
interface WaitOptions { attempts?: number; delayMs?: number; onRetry?: (message: string) => void }

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

export function postgresOptions() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const parsed = new URL(connectionString);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('DATABASE_URL must use PostgreSQL.');
    return { connectionString };
  }
  for (const name of ['PGHOST','PGUSER','PGPASSWORD','PGDATABASE']) {
    if (!process.env[name]) throw new Error(`${name} is required when DATABASE_URL is absent.`);
  }
  const port = Number(process.env.PGPORT || '5432');
  if (!Number.isInteger(port) || port<1 || port>65535) throw new Error('PGPORT is invalid.');
  return { host: process.env.PGHOST, user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, port };
}
export function createPostgresPool(): Pool {
  const pool = new Pool({ ...postgresOptions(), max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  pool.on('error', error => {
    // node-postgres emits idle-client errors on the pool. Handling this event
    // keeps a temporary PostgreSQL restart from terminating the API process.
    console.error(`[StudyForge PostgreSQL] idle connection error: ${error.message}`);
  });
  return pool;
}

export async function waitForPostgres(db: DatabaseProbe, options: WaitOptions = {}): Promise<void> {
  const attempts = options.attempts ?? 30;
  const delayMs = options.delayMs ?? 1_000;
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error('PostgreSQL startup attempts must be a positive integer.');
  if (!Number.isInteger(delayMs) || delayMs < 0) throw new Error('PostgreSQL startup delay must be a non-negative integer.');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      const reason = error instanceof Error ? error.message : 'unknown error';
      (options.onRetry ?? console.warn)(`PostgreSQL unavailable (${attempt}/${attempts}); retrying in ${delayMs} ms: ${reason}`);
      await delay(delayMs);
    }
  }
}
