import { CSV_HEADERS, validateDocument } from './validation.ts';
import { IMPORT_LIMITS, VocabularyImportError } from './types.ts';
import type { VocabularyDocument } from './types.ts';

function bounded(text: string, maximum = IMPORT_LIMITS.maxBytes): string {
  if (Buffer.byteLength(text, 'utf8') > maximum) throw new VocabularyImportError('INPUT_TOO_LARGE', `Tệp nhập vượt giới hạn ${maximum} byte.`);
  return text.replace(/^\uFEFF/u, '');
}

export function parseJsonDocument(input: string): VocabularyDocument {
  let value: unknown;
  try { value = JSON.parse(bounded(input)); }
  catch (error) {
    if (error instanceof VocabularyImportError) throw error;
    throw new VocabularyImportError('INVALID_JSON', 'JSON không đúng cú pháp.');
  }
  return validateDocument(value);
}

/** Strict RFC 4180 quoting, accepting CRLF, LF and CR line endings. */
export function parseCsvRows(input: string): string[][] {
  const text = bounded(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let closedQuote = false;
  const endCell = () => { row.push(cell); cell = ''; closedQuote = false; };
  const endRow = () => {
    endCell(); rows.push(row); row = [];
    if (rows.length > IMPORT_LIMITS.maxRows + 1) throw new VocabularyImportError('TOO_MANY_ROWS', `CSV vượt giới hạn ${IMPORT_LIMITS.maxRows} dòng dữ liệu.`);
  };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') { cell += '"'; index += 1; }
        else { quoted = false; closedQuote = true; }
      } else cell += char;
      continue;
    }
    if (closedQuote && ![',', '\r', '\n'].includes(char)) throw new VocabularyImportError('INVALID_CSV', `Ký tự sau dấu nháy đóng không hợp lệ tại vị trí ${index + 1}.`);
    if (char === '"') {
      if (cell.length) throw new VocabularyImportError('INVALID_CSV', `Dấu nháy trong ô không được trích dẫn tại vị trí ${index + 1}.`);
      quoted = true;
    } else if (char === ',') endCell();
    else if (char === '\r' || char === '\n') {
      endRow();
      if (char === '\r' && text[index + 1] === '\n') index += 1;
    } else cell += char;
  }
  if (quoted) throw new VocabularyImportError('INVALID_CSV', 'Ô được trích dẫn chưa đóng dấu nháy.');
  if (row.length || cell.length || closedQuote) endRow();
  return rows;
}

export function parseCsvDocument(input: string, source: unknown): VocabularyDocument {
  const rows = parseCsvRows(input);
  const headers = rows.shift();
  if (!headers || headers.length !== CSV_HEADERS.length || new Set(headers).size !== headers.length || headers.some((field) => !(CSV_HEADERS as readonly string[]).includes(field))) {
    throw new VocabularyImportError('INVALID_CSV_HEADERS', `CSV cần đúng các cột, không trùng: ${CSV_HEADERS.join(',')}.`);
  }
  const entries = rows.map((row, index) => {
    if (row.length !== headers.length) throw new VocabularyImportError('INVALID_CSV_COLUMNS', `Dòng dữ liệu ${index + 1} có ${row.length} cột; cần ${headers.length} cột.`);
    return Object.fromEntries(headers.map((field, column) => [field, row[column]]));
  });
  return validateDocument({ source, entries });
}
