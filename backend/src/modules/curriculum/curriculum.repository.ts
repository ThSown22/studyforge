import type { DatabaseSync } from 'node:sqlite';

export interface UnitRow { id: string; track: 'grammar' | 'vocabulary'; title: string; subtitle: string; description: string; position: number; color: string }
export interface LessonRow { id: string; unit_id: string; title: string; category: string; description: string; position: number; xp: number; track: 'grammar' | 'vocabulary'; question_count: number; card_count: number; section_count: number }
export interface ProgressRow { user_id: string; lesson_id: string; learned: number; completed: number; best_score: number }
export interface QuestionRow { id: string; lesson_id: string; position: number; prompt: string; type: 'choice' | 'text'; options_json: string | null; answer: string; explanation: string }
export interface SectionRow { title: string; body: string; formula: string | null; examples_json: string }
export interface CardRow { id: string; word: string; phonetic: string; part_of_speech: string; meaning: string; example: string; translation: string }

const lessonSelect = `SELECT l.*,u.track,
  (SELECT COUNT(*) FROM questions q WHERE q.lesson_id=l.id) AS question_count,
  (SELECT COUNT(*) FROM flashcards f WHERE f.lesson_id=l.id) AS card_count,
  (SELECT COUNT(*) FROM lesson_sections s WHERE s.lesson_id=l.id) AS section_count
  FROM lessons l JOIN units u ON u.id=l.unit_id`;

export class LearningRepository {
  db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }
  units(): UnitRow[] { return this.db.prepare('SELECT * FROM units ORDER BY track,position').all() as unknown as UnitRow[]; }
  unit(id: string): UnitRow | undefined { return this.db.prepare('SELECT * FROM units WHERE id=?').get(id) as unknown as UnitRow | undefined; }
  lessons(): LessonRow[] { return this.db.prepare(`${lessonSelect} ORDER BY u.track,u.position,l.position`).all() as unknown as LessonRow[]; }
  lesson(id: string): LessonRow | undefined { return this.db.prepare(`${lessonSelect} WHERE l.id=?`).get(id) as unknown as LessonRow | undefined; }
  progress(userId: string | null): ProgressRow[] { return userId ? this.db.prepare('SELECT * FROM progress WHERE user_id=?').all(userId) as unknown as ProgressRow[] : []; }
  unlocks(userId: string | null): string[] {
    return userId ? this.db.prepare('SELECT unit_id FROM unit_unlocks WHERE user_id=?').all(userId).map(row => String(row.unit_id)) : [];
  }
  sections(id: string): SectionRow[] { return this.db.prepare('SELECT * FROM lesson_sections WHERE lesson_id=? ORDER BY position').all(id) as unknown as SectionRow[]; }
  cards(id: string): CardRow[] { return this.db.prepare('SELECT * FROM flashcards WHERE lesson_id=? ORDER BY position').all(id) as unknown as CardRow[]; }
  questions(id: string): QuestionRow[] { return this.db.prepare('SELECT * FROM questions WHERE lesson_id=? ORDER BY position').all(id) as unknown as QuestionRow[]; }
  challengeQuestions(unitId: string): QuestionRow[] {
    return this.db.prepare('SELECT q.* FROM questions q JOIN lessons l ON l.id=q.lesson_id WHERE l.unit_id=? ORDER BY l.position,q.position').all(unitId) as unknown as QuestionRow[];
  }
  learned(userId: string, lessonId: string) {
    this.db.prepare(`INSERT INTO progress(user_id,lesson_id,learned,updated_at) VALUES(?,?,1,?)
      ON CONFLICT(user_id,lesson_id) DO UPDATE SET learned=1,updated_at=excluded.updated_at`).run(userId, lessonId, new Date().toISOString());
  }
}
