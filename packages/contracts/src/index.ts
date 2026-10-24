export type Track = 'grammar' | 'vocabulary';
export interface User { id: string; name: string; email: string; xp: number; createdAt: string }
export interface Unit {
  id: string; track: Track; title: string; subtitle: string; description: string;
  position: number; color: string; lessonCount: number; completedCount: number; locked: boolean;
}
export interface LessonSummary {
  id: string; unitId: string; track: Track; title: string; category: string;
  position: number; description: string; xp: number; questionCount: number;
  cardCount: number; sectionCount: number; locked: boolean; completed: boolean;
  learned: boolean; bestScore: number | null;
}
export interface Example { english: string; vietnamese: string }
export interface LessonSection { title: string; body: string; formula?: string; examples: Example[] }
export interface WordCard { id: string; word: string; phonetic: string; partOfSpeech: string; meaning: string; example: string; translation: string }
export interface LessonDetail extends LessonSummary { unit: Unit; sections: LessonSection[]; cards: WordCard[] }
export interface Catalog { units: Unit[]; lessons: LessonSummary[]; stats: { grammarLessons: number; vocabularyLessons: number; wordCount: number }; sampleData: boolean }
export interface Dashboard {
  user: User | null; completedLessons: number; totalLessons: number; xp: number; percent: number;
  stage: { index: number; name: string; nextName: string | null; remaining: number; percent: number };
  nextLesson: LessonSummary | null; grammarCompleted: number; vocabularyCompleted: number;
}
export interface QuizQuestion { id: string; prompt: string; type: 'choice' | 'text'; options?: string[] }
export interface Quiz { lessonId?: string; unitId?: string; title: string; questions: QuizQuestion[]; passPercent: number }
export interface Answer { questionId: string; answer: string }
export interface AnswerResult extends Answer { prompt: string; correctAnswer: string; correct: boolean; explanation: string }
export interface AttemptResult {
  attemptId: string | null; score: number; passed: boolean; total: number; correct: number;
  xpEarned: number; saved: boolean; results: AnswerResult[]; nextLessonId?: string | null;
}
export interface ReviewItem { id: string; lessonId: string; lessonTitle: string; prompt: string; answer: string; correctAnswer: string; explanation: string }
export interface AttemptSummary { id: string; title: string; score: number; passed: boolean; createdAt: string; kind: 'lesson' | 'challenge' }
export interface Profile { user: User; stats: { completed: number; attempts: number; reviewCount: number }; attempts: AttemptSummary[] }
export interface ApiErrorBody { error: { code: string; message: string; details?: unknown } }

// V2 contracts are added alongside V1 contracts until the web/API cutover is verified.
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
export interface ReviewEventSummary { id: string; savedWordId: string; reviewMode: string; correct: boolean | null; reviewedAt: string }
