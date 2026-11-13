import { randomBytes } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';
import { root } from '../paths.mjs';
import { captureCompose, postgres, runCompose, sendFileToCompose } from './postgres-compose.mjs';

async function latestBackup() {
  const directory = resolve(root, 'backups', 'postgres');
  const candidates = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.dump'))
    .map((entry) => resolve(directory, entry.name));
  if (!candidates.length) throw new Error('No .dump backup found in backups/postgres');
  const dated = await Promise.all(candidates.map(async (file) => ({ file, modified: (await stat(file)).mtimeMs })));
  dated.sort((left, right) => right.modified - left.modified);
  return dated[0].file;
}

const source = process.argv[2] ? resolve(root, process.argv[2]) : await latestBackup();
const metadata = await stat(source);
if (!metadata.isFile() || metadata.size === 0) throw new Error(`Invalid backup archive: ${source}`);

const temporaryDatabase = `studyforge_restore_check_${Date.now()}_${randomBytes(3).toString('hex')}`;
const countQuery = `SELECT jsonb_build_object(
  'schema_migrations', (SELECT count(*) FROM schema_migrations),
  'users', (SELECT count(*) FROM users),
  'user_settings', (SELECT count(*) FROM user_settings),
  'auth_sessions', (SELECT count(*) FROM auth_sessions),
  'collections', (SELECT count(*) FROM collections),
  'lexemes', (SELECT count(*) FROM lexemes),
  'saved_words', (SELECT count(*) FROM saved_words),
  'review_events', (SELECT count(*) FROM review_events),
  'dictionary_sources', (SELECT count(*) FROM dictionary_sources),
  'dictionary_entries', (SELECT count(*) FROM dictionary_entries),
  'dictionary_pronunciations', (SELECT count(*) FROM dictionary_pronunciations),
  'dictionary_senses', (SELECT count(*) FROM dictionary_senses),
  'sense_examples', (SELECT count(*) FROM sense_examples),
  'sense_translations', (SELECT count(*) FROM sense_translations),
  'related_terms', (SELECT count(*) FROM related_terms)
)::text;`;

async function counts(database) {
  const output = await captureCompose([
    'exec', '-T', postgres.service,
    'psql', '-U', postgres.user, '-d', database, '--no-psqlrc', '-Atqc', countQuery,
  ], `Count rows in ${database}`);
  return JSON.parse(output);
}

try {
  await runCompose([
    'exec', '-T', postgres.service,
    'createdb', '-U', postgres.user, '--template=template0', temporaryDatabase,
  ], 'Create isolated restore-check database');
  await sendFileToCompose(source, [
    'exec', '-T', postgres.service,
    'pg_restore', '-U', postgres.user, '-d', temporaryDatabase,
    '--no-owner', '--no-privileges', '--exit-on-error',
  ], 'Restore backup into isolated database');
  const [sourceCounts, restoredCounts] = await Promise.all([counts(postgres.database), counts(temporaryDatabase)]);
  if (JSON.stringify(sourceCounts) !== JSON.stringify(restoredCounts)) {
    throw new Error(`Restore row counts do not match the live database: ${JSON.stringify({ sourceCounts, restoredCounts })}`);
  }
  console.log(`PostgreSQL backup verified in isolated database: ${relative(root, source)}`);
  console.log(`Archive: ${basename(source)}; ${metadata.size} bytes; table counts match.`);
} finally {
  await runCompose([
    'exec', '-T', postgres.service,
    'dropdb', '-U', postgres.user, '--if-exists', temporaryDatabase,
  ], 'Remove isolated restore-check database');
}
