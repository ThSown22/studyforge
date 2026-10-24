import { createApp } from './app.ts';
import { getConfig } from './config/env.ts';

const config = getConfig();
const app = createApp();
app.server.listen(config.port, config.host, () => {
  console.log(`StudyForge API http://${config.host}:${config.port}`);
  console.log(`SQLite: ${config.databasePath}`);
});
app.server.on('error', async error => { console.error(error.message); await app.close(); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => { await app.close(); process.exit(0); });
