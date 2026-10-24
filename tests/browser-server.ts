import { createApp } from '../backend/src/app.ts';
import { resolve } from 'node:path';

// A separate, disposable database keeps browser acceptance data out of the app database.
const port = Number(process.env.BROWSER_TEST_PORT || 3131);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid browser acceptance port.');
const app = createApp({
  databasePath: resolve('.tmp/browser-acceptance.sqlite'),
  frontendDir: resolve('dist/frontend'),
  allowedOrigins: [`http://127.0.0.1:${port}`],
  secureCookies: false,
});
app.server.listen(port, '127.0.0.1', () => console.log(`Browser acceptance: http://127.0.0.1:${port} (isolated .tmp/ database)`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => void app.close());
