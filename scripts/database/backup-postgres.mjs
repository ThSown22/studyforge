import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { root } from '../paths.mjs';
import { postgres, writeComposeOutput } from './postgres-compose.mjs';

const timestamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}Z$/, 'Z');
const requested = process.argv[2];
const target = requested
  ? resolve(root, requested)
  : resolve(root, 'backups', 'postgres', `studyforge-${timestamp}.dump`);
const partial = `${target}.partial`;

await mkdir(dirname(target), { recursive: true });
try {
  await writeComposeOutput([
    'exec', '-T', postgres.service,
    'pg_dump', '-U', postgres.user, '-d', postgres.database,
    '--format=custom', '--compress=6', '--no-owner', '--no-privileges',
  ], partial, 'PostgreSQL backup');
  const metadata = await stat(partial);
  if (metadata.size === 0) throw new Error('PostgreSQL backup produced an empty archive');
  await rename(partial, target);
  console.log(`PostgreSQL backup created: ${relative(root, target)} (${metadata.size} bytes)`);
} catch (error) {
  await rm(partial, { force: true });
  throw error;
}
