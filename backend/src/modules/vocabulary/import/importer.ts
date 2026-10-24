import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { validateDocument } from './validation.ts';
import { IMPORT_LIMITS, VocabularyImportError } from './types.ts';
import type { ImportReport, VocabularyDocument, VocabularyEntry, VocabularySource } from './types.ts';

const IMPORTER_VERSION = '1';
const WARNINGS = [
  'Giấy phép là khai báo của người nhập; công cụ không xác minh quyền sử dụng và không truy cập URL nguồn.',
  'Chỉ bổ sung flashcard. Không tự tạo câu hỏi, sửa tiến độ hoặc tái mở bài đã hoàn thành. Người biên soạn cần cập nhật đề kiểm tra trước khi công bố nội dung mở rộng.',
];

function normalized(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('en-US');
}

export function entryIdentity(entry: Pick<VocabularyEntry, 'lessonId' | 'word' | 'meaning' | 'partOfSpeech'>): string {
  return createHash('sha256').update(JSON.stringify([entry.lessonId, normalized(entry.word), normalized(entry.meaning), normalized(entry.partOfSpeech)])).digest('hex');
}

export function documentDigest(document: VocabularyDocument): string {
  return createHash('sha256').update(JSON.stringify(document)).digest('hex');
}

function schemaReady(db: DatabaseSync): boolean {
  const query = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('vocabulary_sources','vocabulary_imports','flashcard_provenance')");
  return query.all().length === 3;
}

function assertSourceMatches(db: DatabaseSync, source: VocabularySource): void {
  const row = db.prepare('SELECT name,url,license,license_url,attribution FROM vocabulary_sources WHERE id = ?').get(source.id) as Record<string, unknown> | undefined;
  if (!row) return;
  const expected = { name: source.name, url: source.url, license: source.license, license_url: source.licenseUrl ?? null, attribution: source.attribution };
  if (Object.entries(expected).some(([field, value]) => row[field] !== value)) {
    throw new VocabularyImportError('SOURCE_CONFLICT', `Nguồn ${source.id} đã tồn tại với metadata khác. Không ghi đè nguồn; dùng ID mới khi thay đổi thông tin hoặc giấy phép.`);
  }
}

interface Plan { report: ImportReport; insertions: VocabularyEntry[] }

function buildPlan(db: DatabaseSync, document: VocabularyDocument, apply: boolean): Plan {
  const ready = schemaReady(db);
  const digest = documentDigest(document);
  const report: ImportReport = {
    mode: apply ? 'apply' : 'dry-run', status: 'planned', sourceId: document.source.id,
    license: document.source.license, digest, totalRows: document.entries.length,
    insertedCount: 0, duplicateCount: 0, affectedLessons: [], provenanceSchemaReady: ready,
    importId: null, warnings: [...WARNINGS],
  };
  if (!ready) report.warnings.push('Database chưa có migration 002 về provenance. Dry-run không áp dụng migration; CLI --apply sẽ áp dụng migration trước khi nhập.');
  if (ready) {
    assertSourceMatches(db, document.source);
    const previous = db.prepare('SELECT id FROM vocabulary_imports WHERE source_id = ? AND input_sha256 = ?').get(document.source.id, digest) as { id: string } | undefined;
    if (previous) return { report: { ...report, status: 'already-imported', duplicateCount: document.entries.length, importId: previous.id }, insertions: [] };
  }
  const lessonQuery = db.prepare('SELECT u.track FROM lessons l JOIN units u ON u.id = l.unit_id WHERE l.id = ?');
  const cardQuery = db.prepare('SELECT word,meaning,part_of_speech AS partOfSpeech FROM flashcards WHERE lesson_id = ?');
  const seen = new Set<string>();
  const lessons = new Set(document.entries.map((entry) => entry.lessonId));
  for (const lessonId of lessons) {
    const lesson = lessonQuery.get(lessonId) as { track: string } | undefined;
    if (!lesson || lesson.track !== 'vocabulary') throw new VocabularyImportError('INVALID_LESSON', `Bài ${lessonId} không tồn tại hoặc không thuộc lộ trình từ vựng.`);
    for (const card of cardQuery.all(lessonId) as unknown as Pick<VocabularyEntry, 'word' | 'meaning' | 'partOfSpeech'>[]) seen.add(entryIdentity({ lessonId, ...card }));
  }
  const insertions: VocabularyEntry[] = [];
  for (const entry of document.entries) {
    const key = entryIdentity(entry);
    if (seen.has(key)) report.duplicateCount += 1;
    else { seen.add(key); insertions.push(entry); }
  }
  report.insertedCount = insertions.length;
  report.affectedLessons = [...new Set(insertions.map((entry) => entry.lessonId))];
  return { report, insertions };
}

/** Validate the entire document before any write. apply=false executes SELECTs only. */
export function importVocabulary(db: DatabaseSync, input: unknown, options: { apply?: boolean } = {}): ImportReport {
  const document = validateDocument(input);
  if (Buffer.byteLength(JSON.stringify(document), 'utf8') > IMPORT_LIMITS.maxBytes) throw new VocabularyImportError('INPUT_TOO_LARGE', `Dữ liệu chuẩn hóa vượt giới hạn ${IMPORT_LIMITS.maxBytes} byte.`);
  if (!options.apply) return buildPlan(db, document, false).report;
  if (!schemaReady(db)) throw new VocabularyImportError('MIGRATION_REQUIRED', 'Cần áp dụng migration 002 trước khi gọi importVocabulary với apply=true.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const { report, insertions } = buildPlan(db, document, true);
    if (report.status === 'already-imported') { db.exec('COMMIT'); return report; }
    const now = new Date().toISOString();
    const importId = randomUUID();
    const source = document.source;
    db.prepare('INSERT OR IGNORE INTO vocabulary_sources(id,name,url,license,license_url,attribution,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(source.id, source.name, source.url, source.license, source.licenseUrl ?? null, source.attribution, now);
    db.prepare('INSERT INTO vocabulary_imports(id,source_id,input_sha256,total_rows,inserted_count,duplicate_count,importer_version,created_at) VALUES(?,?,?,?,?,?,?,?)')
      .run(importId, source.id, report.digest, report.totalRows, report.insertedCount, report.duplicateCount, IMPORTER_VERSION, now);
    const positions = new Map<string, number>();
    const maximum = db.prepare('SELECT COALESCE(MAX(position),0) AS maximum FROM flashcards WHERE lesson_id = ?');
    const insert = db.prepare('INSERT INTO flashcards(id,lesson_id,position,word,phonetic,part_of_speech,meaning,example,translation) VALUES(?,?,?,?,?,?,?,?,?)');
    const provenance = db.prepare('INSERT INTO flashcard_provenance(flashcard_id,source_id,import_id,source_entry_key,imported_at) VALUES(?,?,?,?,?)');
    for (const entry of insertions) {
      const current = positions.get(entry.lessonId) ?? (maximum.get(entry.lessonId) as { maximum: number }).maximum;
      const position = current + 1;
      positions.set(entry.lessonId, position);
      const cardId = `card-${randomUUID()}`;
      insert.run(cardId, entry.lessonId, position, entry.word, entry.phonetic, entry.partOfSpeech, entry.meaning, entry.example, entry.translation);
      provenance.run(cardId, source.id, importId, entryIdentity(entry), now);
    }
    db.exec('COMMIT');
    return { ...report, status: 'imported', importId };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
