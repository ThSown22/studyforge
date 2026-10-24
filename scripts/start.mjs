import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, frontendOutput } from './paths.mjs';

const entry = resolve(root, 'dist/backend/src/main.js');
if (!existsSync(entry)) throw new Error('Chưa có production build. Chạy npm run build trước.');
const child = spawn(process.execPath, [entry], { cwd: root, stdio: 'inherit', env: { ...process.env, FRONTEND_DIR: process.env.FRONTEND_DIR || frontendOutput } });
process.on('SIGINT', () => child.kill()); process.on('SIGTERM', () => child.kill());
child.on('exit', (code) => { process.exitCode = code || 0; });
