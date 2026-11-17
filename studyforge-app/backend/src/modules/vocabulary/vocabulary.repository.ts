import type { Pool } from 'pg';
import type { LearningStatus, SavedWordSummary, VocabularyStats } from '@studyforge/contracts';
import type { VocabularyRepository } from './vocabulary.service.ts';

interface WordRow { id: string; term: string; collection_id: string; collection_name: string; status: LearningStatus; saved_at: Date; personal_note: string | null }
function summary(row: WordRow): SavedWordSummary {
  return { id: row.id, term: row.term, collectionId: row.collection_id, collectionName: row.collection_name, status: row.status, savedAt: row.saved_at.toISOString(), personalNote: row.personal_note };
}
const selected = `SELECT sw.id,l.term,sw.collection_id,c.name AS collection_name,sw.status,sw.saved_at,sw.personal_note
  FROM saved_words sw JOIN lexemes l ON l.id=sw.lexeme_id JOIN collections c ON c.id=sw.collection_id`;

export class PostgresVocabularyRepository implements VocabularyRepository {
  private readonly db: Pool;
  constructor(db: Pool) { this.db = db; }
  async list(userId: string, filter: { collectionId?: string; status?: LearningStatus; query?: string }) {
    const result = await this.db.query<WordRow>(`${selected} WHERE sw.user_id=$1
      AND ($2::uuid IS NULL OR sw.collection_id=$2::uuid)
      AND ($3::text IS NULL OR sw.status::text=$3)
      AND ($4::text IS NULL OR position(lower($4) in lower(l.term))>0)
      ORDER BY sw.saved_at DESC LIMIT 200`, [userId,filter.collectionId ?? null,filter.status ?? null,filter.query ?? null]);
    return result.rows.map(summary);
  }
  async byTerm(userId: string, normalizedTerm: string) {
    const result = await this.db.query<WordRow>(`${selected} WHERE sw.user_id=$1 AND l.normalized_term=$2 AND l.language_code='en'`, [userId,normalizedTerm]);
    return result.rows[0] ? summary(result.rows[0]) : null;
  }
  async save(userId: string, term: string, normalizedTerm: string, collectionId: string) {
    const db = await this.db.connect();
    try {
      await db.query('BEGIN');
      const collection = await db.query('SELECT 1 FROM collections WHERE user_id=$1 AND id=$2', [userId,collectionId]);
      if (!collection.rowCount) { await db.query('ROLLBACK'); return null; }
      const lexeme = await db.query<{ id: string }>(`INSERT INTO lexemes(term,normalized_term) VALUES($1,$2)
        ON CONFLICT (language_code,normalized_term) DO UPDATE SET term=lexemes.term RETURNING id`, [term,normalizedTerm]);
      const inserted = await db.query<{ id: string }>(`INSERT INTO saved_words(user_id,lexeme_id,collection_id)
        VALUES($1,$2,$3) ON CONFLICT (user_id,lexeme_id) DO NOTHING RETURNING id`, [userId,lexeme.rows[0].id,collectionId]);
      const word = await db.query<WordRow>(`${selected} WHERE sw.user_id=$1 AND sw.lexeme_id=$2`, [userId,lexeme.rows[0].id]);
      await db.query('COMMIT');
      return { word: summary(word.rows[0]), created: Boolean(inserted.rowCount) };
    } catch (error) { await db.query('ROLLBACK'); throw error; }
    finally { db.release(); }
  }
  async move(userId: string, id: string, collectionId: string) {
    const result = await this.db.query<WordRow>(`UPDATE saved_words sw SET collection_id=$3,updated_at=now()
      FROM lexemes l,collections c WHERE sw.user_id=$1 AND sw.id=$2 AND l.id=sw.lexeme_id
      AND c.user_id=$1 AND c.id=$3
      RETURNING sw.id,l.term,sw.collection_id,c.name AS collection_name,sw.status,sw.saved_at,sw.personal_note`, [userId,id,collectionId]);
    return result.rows[0] ? summary(result.rows[0]) : null;
  }
  async setStatus(userId: string, id: string, status: LearningStatus) {
    const result = await this.db.query<WordRow>(`UPDATE saved_words sw SET status=$3::learning_status,
      status_changed_at=CASE WHEN status<>$3::learning_status THEN now() ELSE status_changed_at END,updated_at=now()
      FROM lexemes l,collections c WHERE sw.user_id=$1 AND sw.id=$2 AND l.id=sw.lexeme_id
      AND c.user_id=sw.user_id AND c.id=sw.collection_id
      RETURNING sw.id,l.term,sw.collection_id,c.name AS collection_name,sw.status,sw.saved_at,sw.personal_note`, [userId,id,status]);
    return result.rows[0] ? summary(result.rows[0]) : null;
  }
  async stats(userId: string): Promise<VocabularyStats> {
    const result = await this.db.query<{ total: string; new_count: string; learning: string; known: string; review_events: string }>(`SELECT
      count(*)::text AS total,count(*) FILTER(WHERE status='new')::text AS new_count,
      count(*) FILTER(WHERE status='learning')::text AS learning,
      count(*) FILTER(WHERE status='known')::text AS known,
      (SELECT count(*)::text FROM review_events re JOIN saved_words s ON s.id=re.saved_word_id WHERE s.user_id=$1) AS review_events
      FROM saved_words WHERE user_id=$1`, [userId]);
    const row = result.rows[0];
    return { total: Number(row.total), new: Number(row.new_count), learning: Number(row.learning), known: Number(row.known), reviewEvents: Number(row.review_events) };
  }
}
