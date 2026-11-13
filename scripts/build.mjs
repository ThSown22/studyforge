import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { root } from './paths.mjs';
import { frontendConfig, browserConfigScript } from './frontend-config.mjs';

export async function sourceFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory() && ['node_modules', 'dist', '.git', '.cache', '.tmp', 'tmp', 'coverage'].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  }));
  return nested.flat();
}

export async function build({ frontendOnly = false, backendOnly = false, quiet = false } = {}) {
  if (frontendOnly && backendOnly) throw new Error('Choose one build target.');
  const sourceRoots = frontendOnly ? ['frontend/src'] : backendOnly ? ['backend/src', 'packages'] : ['frontend/src', 'backend/src', 'packages'];
  let compiled = 0;
  for (const sourceRoot of sourceRoots) {
    for (const file of await sourceFiles(resolve(root, sourceRoot))) {
      const extension = extname(file);
      const output = resolve(root, 'dist', relative(root, file).replace(/\.ts$/, '.js'));
      await mkdir(dirname(output), { recursive: true });
      if (extension === '.ts' && !file.endsWith('.d.ts')) {
        const source = await readFile(file, 'utf8');
        const code = stripTypeScriptTypes(source, { mode: 'strip' })
          .replace(/((?:from\s*|import\s*|import\s*\()(['"]))([^'"\n]+)\.ts\2/g, '$1$3.js$2');
        await writeFile(output, code, 'utf8');
        compiled++;
      } else if (!file.endsWith('.d.ts')) {
        await cp(file, output);
      }
    }
  }
  if (!backendOnly) {
    const outputRoot = resolve(root, 'dist/frontend');
    await mkdir(outputRoot, { recursive: true });
    const html = await readFile(resolve(root, 'frontend/index.html'), 'utf8');
    await writeFile(resolve(outputRoot, 'index.html'), html.replace(/(["'])[^"']*\/main\.ts\1/g, '"/src/main.js"'), 'utf8');
    const { publicConfig } = frontendConfig();
    await writeFile(resolve(outputRoot, 'config.js'), browserConfigScript(publicConfig), 'utf8');
    try { await cp(resolve(root, 'frontend/public'), outputRoot, { recursive: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!quiet) console.log(`Built ${compiled} TypeScript modules → dist/ (Node's native type stripping).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const flags = process.argv.slice(2);
  if (flags.some(flag => !['--frontend-only', '--backend-only'].includes(flag))) throw new Error('Unsupported build option.');
  const frontendOnly = flags.includes('--frontend-only');
  const backendOnly = flags.includes('--backend-only');
  if (frontendOnly && backendOnly) throw new Error('Choose one build target.');
  // The target is fixed inside the workspace; source and user data are never removed.
  const destination = resolve(root, 'dist');
  if (!destination.startsWith(`${root}\\`) && !destination.startsWith(`${root}/`)) throw new Error('Invalid build destination');
  await rm(destination, { recursive: true, force: true });
  await build({ frontendOnly, backendOnly });
}
