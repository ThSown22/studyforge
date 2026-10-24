import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { sourceFiles } from './build.mjs';
import { root } from './paths.mjs';

const tests = (await Promise.all(['tests', 'scripts'].map((dir) => sourceFiles(resolve(root, dir))))).flat().filter((file) => /\.test\.(ts|mjs|js)$/.test(file));
if (!tests.length) throw new Error('Chưa có test được triển khai.');
const child = spawn(process.execPath, ['--experimental-strip-types', '--test', ...tests], { cwd: root, stdio: 'inherit' });
child.on('exit', (code) => { process.exitCode = code || 0; });
