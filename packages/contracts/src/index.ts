export interface User { id: string; name: string; email: string; xp: number; createdAt: string }
export interface ApiErrorBody { error: { code: string; message: string; details?: unknown } }

export type LearningStatus = 'new' | 'learning' | 'known';
export interface CollectionSummary { id: string; name: string; description: string | null; wordCount: number; createdAt: string }
export interface SavedWordSummary {
  id: string; term: string; collectionId: string; collectionName: string;
  status: LearningStatus; savedAt: string; personalNote: string | null;
}
export interface DictionaryPronunciation { ipa: string | null; audioUrl: string | null }
export interface DictionarySense {
  id: string; order: number; definitionEn: string; definitionVi: string | null;
  examplesEn: string[]; labels: string[];
}
export interface DictionaryEntry {
  id: string; headword?: string; partOfSpeech: string; labels: string[]; senses: DictionarySense[];
}
export interface RelatedTerm { term: string; partOfSpeech: string | null }
export interface DictionaryResult {
  term: string; language: 'en'; pronunciations: DictionaryPronunciation[];
  entries: DictionaryEntry[]; relatedEntries: DictionaryEntry[]; wordFamily: RelatedTerm[]; suggestions: string[];
  savedWord: SavedWordSummary | null;
}
export interface VocabularyStats { total: number; new: number; learning: number; known: number; reviewEvents: number }
export interface ReviewEventSummary { id: string; savedWordId: string; reviewMode: string; rating: number | null; correct: boolean | null; reviewedAt: string }
