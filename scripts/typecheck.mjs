import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { root } from './paths.mjs';

const require = createRequire(import.meta.url);
const compiler = resolve(root, 'node_modules/typescript/lib/typescript.js');
if (!existsSync(compiler)) {
  console.error('Chưa cài devDependencies của project. Chạy npm ci. Typecheck chỉ dùng compiler cục bộ, không dùng compiler global hoặc của editor.');
  process.exitCode = 1;
} else {
  const ts = require(compiler);
  for (const file of ['frontend/tsconfig.json', 'backend/tsconfig.json']) {
    const config = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
    const parsed = ts.parseJsonConfigFileContent(config, ts.sys, resolve(root, file, '..'));
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
    if (diagnostics.length) {
      console.error(ts.formatDiagnostics(diagnostics, { getCurrentDirectory: () => root, getCanonicalFileName: (name) => name, getNewLine: () => '\n' }));
      process.exitCode = 1;
    } else console.log(`${file}: semantic typecheck passed (project-local TypeScript ${ts.version}).`);
  }
}
