import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function connectDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  return db;
}

export function migrate(db: DatabaseSync): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const base = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../database/migrations');
  // Built output is dist/backend/src/infrastructure/database; copied SQL remains at project/database.
  const locations = [base, resolve('database/migrations')];
  let migrationDir = locations.find(dir => { try { return readdirSync(dir).some(file => file.endsWith('.sql')); } catch { return false; } });
  if (!migrationDir) throw new Error('Không tìm thấy thư mục database/migrations.');
  for (const file of readdirSync(migrationDir).filter(file => file.endsWith('.sql')).sort()) {
    if (db.prepare('SELECT version FROM schema_migrations WHERE version = ?').get(file)) continue;
    transaction(db, () => {
      db.exec(readFileSync(resolve(migrationDir!, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations(version,applied_at) VALUES(?,?)').run(file, new Date().toISOString());
    });
  }
}

export function transaction<T>(db: DatabaseSync, callback: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const value = callback(); db.exec('COMMIT'); return value; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
