import { readFile, readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
async function sourceFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const nested = await Promise.all(entries.map(async entry => {
    if (entry.isDirectory() && ['node_modules', 'dist', '.git', '.cache', '.tmp', 'tmp', 'coverage'].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return nested.flat();
}

const formatOnly = process.argv.includes('--format-only');
const files = (await Promise.all(['frontend', 'backend', 'packages', 'scripts', 'tests'].map((dir) => sourceFiles(resolve(root, dir))))).flat().filter((file) => /\.(ts|js|mjs|css|html)$/.test(file));
const failures = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (/[^\S\r\n]+$/m.test(content)) failures.push(`${file}: trailing whitespace`);
  if (!content.endsWith('\n')) failures.push(`${file}: missing final newline`);
  if (formatOnly || !/\.(ts|js|mjs)$/.test(file) || file.endsWith('.d.ts')) continue;
  const checked = spawnSync(process.execPath, ['--experimental-strip-types', '--check', file], { encoding: 'utf8' });
  if (checked.status !== 0) failures.push(`${file}: ${checked.stderr.trim()}`);
  for (const match of content.matchAll(/(?:from\s*|import\s*|import\s*\()(['"])(\.[^'"\n]+)\1/g)) {
    const target = resolve(dirname(file), match[2]);
    try { await stat(target); } catch { failures.push(`${file}: unresolved import ${match[2]}`); }
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${formatOnly ? 'Format' : 'Syntax/import/format'} checks passed for ${files.length} files.`);
