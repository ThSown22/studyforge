import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const migrations = resolve(root, 'database/migrations/postgres');
const connectionString = process.env.DATABASE_URL;
let options;
if (connectionString) {
  const parsed = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('DATABASE_URL must use PostgreSQL.');
  options = { connectionString };
} else {
  for (const name of ['PGHOST','PGUSER','PGPASSWORD','PGDATABASE']) {
    if (!process.env[name]) throw new Error(`${name} is required for PostgreSQL migrations.`);
  }
  const port = Number(process.env.PGPORT || '5432');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PGPORT is invalid.');
  options = { host: process.env.PGHOST, user: process.env.PGUSER, password: process.env.PGPASSWORD, database: process.env.PGDATABASE, port };
}
const { Client } = await import('pg');
const client = new Client(options);
await client.connect();
try {
  await client.query('SELECT pg_advisory_lock($1)', [73191284]);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const files = (await readdir(migrations)).filter(name => /^\d+_[a-z0-9_-]+\.sql$/.test(name)).sort();
  if (!files.length) throw new Error('No PostgreSQL migrations found.');
  for (const file of files) {
    const sql = await readFile(resolve(migrations, file), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await client.query('SELECT sha256 FROM schema_migrations WHERE version = $1', [file]);
    if (existing.rows.length) {
      if (existing.rows[0].sha256 !== checksum) throw new Error(`Migration ${file} changed after application.`);
      console.log(`Already applied: ${file}`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version,sha256) VALUES($1,$2)', [file, checksum]);
      await client.query('COMMIT');
      console.log(`Applied: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  try { await client.query('SELECT pg_advisory_unlock($1)', [73191284]); }
  finally { await client.end(); }
}
