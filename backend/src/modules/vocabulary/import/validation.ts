import { ALLOWED_LICENSES, IMPORT_LIMITS, VocabularyImportError } from './types.ts';
import type { ImportIssue, VocabularyDocument, VocabularyEntry, VocabularySource } from './types.ts';

const ENTRY_FIELDS = ['lessonId', 'word', 'phonetic', 'partOfSpeech', 'meaning', 'example', 'translation'] as const;
const SOURCE_FIELDS = ['id', 'name', 'url', 'license', 'licenseUrl', 'attribution'];
const TEXT_LIMITS = { lessonId: 160, word: 200, phonetic: 200, partOfSpeech: 80, meaning: 1000, example: 2000, translation: 2000 };
const LICENSE_URLS: Record<string, string> = {
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC-BY-SA-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, field: string, maximum: number, issues: ImportIssue[], row?: number, required = true): string {
  if (typeof value !== 'string') {
    if (value === undefined && !required) return '';
    issues.push({ row, field, message: 'Giá trị phải là chuỗi ký tự.' });
    return '';
  }
  const cleaned = value.normalize('NFC').trim();
  if ((required && !cleaned) || cleaned.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(cleaned)) {
    issues.push({ row, field, message: `Cần ${required ? '1' : '0'}–${maximum} ký tự, không chứa ký tự điều khiển.` });
  }
  return cleaned;
}

function webUrl(value: string, field: string, issues: ImportIssue[]): void {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { issues.push({ field, message: 'Cần URL http(s) tuyệt đối, không chứa thông tin đăng nhập.' }); }
}

export function validateSource(input: unknown): VocabularySource {
  const issues: ImportIssue[] = [];
  if (!record(input)) throw new VocabularyImportError('INVALID_SOURCE', 'source phải là một object.');
  for (const key of Object.keys(input)) if (!SOURCE_FIELDS.includes(key)) issues.push({ field: `source.${key}`, message: 'Trường không được hỗ trợ.' });
  const source = {
    id: text(input.id, 'source.id', 100, issues),
    name: text(input.name, 'source.name', 200, issues),
    url: text(input.url, 'source.url', 2000, issues),
    license: text(input.license, 'source.license', 40, issues),
    licenseUrl: text(input.licenseUrl, 'source.licenseUrl', 2000, issues, undefined, false),
    attribution: text(input.attribution, 'source.attribution', 2000, issues, undefined, false),
  };
  if (!/^[a-z0-9][a-z0-9._-]{1,99}$/.test(source.id)) issues.push({ field: 'source.id', message: 'Dùng 2–100 ký tự thường a-z, số, dấu chấm, gạch nối hoặc gạch dưới.' });
  if (!(ALLOWED_LICENSES as readonly string[]).includes(source.license)) issues.push({ field: 'source.license', message: `Chỉ chấp nhận ${ALLOWED_LICENSES.join(', ')}.` });
  webUrl(source.url, 'source.url', issues);
  if (source.licenseUrl) webUrl(source.licenseUrl, 'source.licenseUrl', issues);
  if (['CC-BY-4.0', 'CC-BY-SA-4.0'].includes(source.license) && !source.attribution) issues.push({ field: 'source.attribution', message: 'Nguồn CC BY / CC BY-SA bắt buộc có nội dung ghi công.' });
  if (issues.length) throw new VocabularyImportError('INVALID_SOURCE', 'Metadata nguồn hoặc giấy phép không hợp lệ.', issues);
  return {
    id: source.id, name: source.name, url: source.url,
    license: source.license as VocabularySource['license'],
    licenseUrl: source.licenseUrl || LICENSE_URLS[source.license],
    attribution: source.attribution || source.name,
  };
}

export function validateDocument(input: unknown): VocabularyDocument {
  if (!record(input) || Object.keys(input).some((key) => !['source', 'entries'].includes(key))) throw new VocabularyImportError('INVALID_DOCUMENT', 'JSON cần đúng hai trường source và entries.');
  const source = validateSource(input.source);
  if (!Array.isArray(input.entries) || input.entries.length === 0 || input.entries.length > IMPORT_LIMITS.maxRows) throw new VocabularyImportError('INVALID_ROWS', `entries cần từ 1 đến ${IMPORT_LIMITS.maxRows} dòng.`);
  const issues: ImportIssue[] = [];
  const entries: VocabularyEntry[] = [];
  input.entries.forEach((value, index) => {
    const row = index + 1;
    if (!record(value)) { issues.push({ row, field: 'entry', message: 'Mỗi dòng phải là một object.' }); return; }
    for (const key of Object.keys(value)) if (!(ENTRY_FIELDS as readonly string[]).includes(key)) issues.push({ row, field: key, message: 'Trường không được hỗ trợ.' });
    const entry = Object.fromEntries(ENTRY_FIELDS.map((field) => [field, text(value[field], field, TEXT_LIMITS[field], issues, row, field !== 'phonetic')])) as unknown as VocabularyEntry;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.lessonId)) issues.push({ row, field: 'lessonId', message: 'ID bài học không hợp lệ.' });
    if (/[\r\n]/u.test(entry.word) || /[\r\n]/u.test(entry.partOfSpeech)) issues.push({ row, field: 'word', message: 'Từ và từ loại không được chứa xuống dòng.' });
    entries.push(entry);
  });
  if (issues.length) throw new VocabularyImportError('INVALID_ENTRIES', `${issues.length} lỗi dữ liệu; không nhập bất kỳ dòng nào.`, issues.slice(0, 100));
  return { source, entries };
}

export const CSV_HEADERS = ENTRY_FIELDS;
