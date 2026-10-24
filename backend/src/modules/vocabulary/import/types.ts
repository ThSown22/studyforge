export const ALLOWED_LICENSES = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'authored'] as const;
export type VocabularyLicense = typeof ALLOWED_LICENSES[number];

export interface VocabularySource {
  id: string;
  name: string;
  url: string;
  license: VocabularyLicense;
  licenseUrl?: string;
  attribution: string;
}

export interface VocabularyEntry {
  lessonId: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  translation: string;
}

export interface VocabularyDocument {
  source: VocabularySource;
  entries: VocabularyEntry[];
}

export interface ImportIssue { row?: number; field: string; message: string }
export interface ImportReport {
  mode: 'dry-run' | 'apply';
  status: 'planned' | 'imported' | 'already-imported';
  sourceId: string;
  license: VocabularyLicense;
  digest: string;
  totalRows: number;
  insertedCount: number;
  duplicateCount: number;
  affectedLessons: string[];
  provenanceSchemaReady: boolean;
  importId: string | null;
  warnings: string[];
}

export const IMPORT_LIMITS = { maxBytes: 5 * 1024 * 1024, maxRows: 10_000 } as const;

export class VocabularyImportError extends Error {
  readonly code: string;
  readonly issues: ImportIssue[];
  constructor(code: string, message: string, issues: ImportIssue[] = []) {
    super(message);
    this.name = 'VocabularyImportError';
    this.code = code;
    this.issues = issues;
  }
}
