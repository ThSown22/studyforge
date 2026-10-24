import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { migrate } from '../../../infrastructure/database/connection.ts';
import { importVocabulary } from './importer.ts';
import { parseCsvDocument, parseJsonDocument } from './parser.ts';
import { IMPORT_LIMITS, VocabularyImportError } from './types.ts';
import type { VocabularyDocument } from './types.ts';

interface CliOptions { file: string; source?: string; database: string; apply: boolean }
const HELP = `StudyForge vocabulary import (mặc định dry-run)
  npm run import:vocabulary -- --file words.json
  npm run import:vocabulary -- --file words.csv --source source.json --apply
  --database path.sqlite    Ghi đè DATABASE_PATH của backend/.env
  --apply                   Áp dụng nguyên tử, chỉ thêm flashcard mới
  --help                    Hiện trợ giúp
Giới hạn: 5 MiB/tệp dữ liệu, 10.000 dòng. Không tải dữ liệu từ mạng.`;

function loadEnvironment(): void {
  const path = resolve('backend/.env');
  if (existsSync(path)) process.loadEnvFile(path);
}

function argumentsFor(args: string[]): CliOptions {
  const options: CliOptions = { file: '', database: process.env.DATABASE_PATH ?? resolve('data/studyforge.sqlite'), apply: false };
  const seen = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (seen.has(flag)) throw new VocabularyImportError('INVALID_ARGUMENTS', `Không lặp lại ${flag}.`);
    seen.add(flag);
    if (flag === '--apply') { options.apply = true; continue; }
    if (!['--file', '--source', '--database'].includes(flag)) throw new VocabularyImportError('INVALID_ARGUMENTS', `Tham số không được hỗ trợ: ${flag}.`);
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new VocabularyImportError('INVALID_ARGUMENTS', `${flag} cần giá trị.`);
    if (flag === '--file') options.file = resolve(value);
    else if (flag === '--source') options.source = resolve(value);
    else options.database = resolve(value);
  }
  if (!options.file) throw new VocabularyImportError('INVALID_ARGUMENTS', 'Cần --file trỏ tới JSON hoặc CSV.');
  options.database = resolve(options.database);
  return options;
}

function readUtf8(path: string, maximum: number): string {
  let size: number;
  try { const info = statSync(path); if (!info.isFile()) throw new Error(); size = info.size; }
  catch { throw new VocabularyImportError('FILE_NOT_FOUND', `Không đọc được tệp: ${path}.`); }
  if (size > maximum) throw new VocabularyImportError('INPUT_TOO_LARGE', `Tệp vượt giới hạn ${maximum} byte: ${path}.`);
  const bytes = readFileSync(path);
  if (bytes.byteLength > maximum) throw new VocabularyImportError('INPUT_TOO_LARGE', `Tệp vượt giới hạn ${maximum} byte: ${path}.`);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/u, ''); }
  catch { throw new VocabularyImportError('INVALID_ENCODING', `Tệp cần được mã hóa UTF-8: ${path}.`); }
}

function loadDocument(options: CliOptions): VocabularyDocument {
  const input = readUtf8(options.file, IMPORT_LIMITS.maxBytes);
  const extension = extname(options.file).toLowerCase();
  if (extension === '.json') {
    if (options.source) throw new VocabularyImportError('INVALID_ARGUMENTS', 'JSON đã chứa source; không dùng --source để ghi đè metadata.');
    return parseJsonDocument(input);
  }
  if (extension !== '.csv') throw new VocabularyImportError('UNSUPPORTED_FORMAT', 'Chỉ hỗ trợ tệp .json hoặc .csv.');
  if (!options.source || extname(options.source).toLowerCase() !== '.json') throw new VocabularyImportError('MISSING_SOURCE', 'CSV cần --source trỏ tới manifest nguồn .json.');
  let source: unknown;
  try { source = JSON.parse(readUtf8(options.source, 64 * 1024)); }
  catch (error) { if (error instanceof VocabularyImportError) throw error; throw new VocabularyImportError('INVALID_SOURCE', 'Manifest nguồn không đúng cú pháp JSON.'); }
  return parseCsvDocument(input, source);
}

export function runVocabularyImport(args = process.argv.slice(2)): number {
  if (args.length === 1 && args[0] === '--help') { console.log(HELP); return 0; }
  let db: DatabaseSync | undefined;
  try {
    loadEnvironment();
    const options = argumentsFor(args);
    const document = loadDocument(options);
    if (!existsSync(options.database) || !statSync(options.database).isFile()) throw new VocabularyImportError('DATABASE_NOT_FOUND', 'Cần database đã chạy migrations. Dry-run không tạo database mới.');
    db = new DatabaseSync(options.database, { readOnly: !options.apply });
    db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    const initialized = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lessons'").get();
    if (!initialized) throw new VocabularyImportError('DATABASE_NOT_INITIALIZED', 'Database chưa có curriculum. Chạy db:migrate trước.');
    if (options.apply) migrate(db);
    const report = importVocabulary(db, document, { apply: options.apply });
    console.log(JSON.stringify({ database: options.database, inputFile: options.file, ...report }, null, 2));
    return 0;
  } catch (error) {
    const known = error instanceof VocabularyImportError;
    console.error(JSON.stringify({ error: { code: known ? error.code : 'IMPORT_FAILED', message: error instanceof Error ? error.message : 'Nhập dữ liệu thất bại.', ...(known && error.issues.length ? { issues: error.issues } : {}) } }, null, 2));
    return 1;
  } finally { db?.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runVocabularyImport();
