import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { build } from './build.mjs';
import { createFrontendServer } from './frontend-server.mjs';
import { root } from './paths.mjs';

await build({ frontendOnly: true });
const api = spawn(process.execPath, ['--env-file-if-exists=backend/.env', '--watch', '--experimental-strip-types', 'backend/src/main.ts'], { cwd: root, stdio: 'inherit', env: process.env });
const frontend = createFrontendServer({ liveReload: true });
await frontend.listen();
let timer; let building = false; let pending = false;
async function rebuild() {
  if (building) { pending = true; return; }
  building = true;
  try { await build({ frontendOnly: true, quiet: true }); frontend.reload(); console.log('Frontend rebuilt.'); }
  catch (error) { console.error('Build failed:', error.message); }
  finally { building = false; if (pending) { pending = false; await rebuild(); } }
}
const watcher = watch(resolve(root, 'frontend'), { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(rebuild, 120); });
let closing = false;
function stop() { if (closing) return; closing = true; clearTimeout(timer); watcher.close(); frontend.close(); api.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
api.on('exit', (code) => { stop(); process.exitCode = code || 0; });
console.log('Ctrl+C để dừng cả frontend và backend. Thay đổi frontend tự build/reload.');
