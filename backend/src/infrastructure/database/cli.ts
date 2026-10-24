import { getConfig } from '../../config/env.ts';
import { connectDatabase, migrate } from './connection.ts';

const command = process.argv[2] ?? 'migrate';
if (command !== 'migrate') throw new Error('Dùng: cli.ts migrate');
const config = getConfig();
const db = connectDatabase(config.databasePath);
try {
  migrate(db);
  console.log(JSON.stringify({ command, database: config.databasePath, status: 'ok' }));
} finally { db.close(); }
