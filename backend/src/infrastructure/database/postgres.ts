import { Pool } from 'pg';

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
  return new Pool({ ...postgresOptions(), max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
}
