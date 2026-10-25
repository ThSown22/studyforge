import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { CollectionSummary } from '../../../../packages/contracts/src/index.ts';
import type { CollectionRepository } from './collections.service.ts';

interface CollectionRow { id: string; name: string; description: string | null; word_count: string; created_at: Date }
function summary(row: CollectionRow): CollectionSummary {
  return { id: row.id, name: row.name, description: row.description, wordCount: Number(row.word_count), createdAt: row.created_at.toISOString() };
}

export class PostgresCollectionRepository implements CollectionRepository {
  private readonly db: Pool;
  constructor(db: Pool) { this.db = db; }
  async list(userId: string) {
    const result = await this.db.query<CollectionRow>(`SELECT c.id,c.name,c.description,c.created_at,count(sw.id)::text AS word_count
      FROM collections c LEFT JOIN saved_words sw ON sw.collection_id=c.id AND sw.user_id=c.user_id
      WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.created_at DESC`, [userId]);
    return result.rows.map(summary);
  }
  async create(userId: string, name: string, normalizedName: string, description: string | null) {
    const result = await this.db.query<CollectionRow>(`INSERT INTO collections(id,user_id,name,normalized_name,description)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT (user_id,normalized_name) DO NOTHING
      RETURNING id,name,description,created_at,'0'::text AS word_count`, [randomUUID(),userId,name,normalizedName,description]);
    return result.rows[0] ? summary(result.rows[0]) : null;
  }
  async update(userId: string, id: string, name: string, normalizedName: string, description: string | null) {
    const existing = await this.db.query('SELECT 1 FROM collections WHERE user_id=$1 AND id=$2', [userId,id]);
    if (!existing.rowCount) return null;
    const result = await this.db.query<CollectionRow>(`UPDATE collections SET name=$3,normalized_name=$4,description=$5,updated_at=now()
      WHERE user_id=$1 AND id=$2 AND NOT EXISTS (SELECT 1 FROM collections WHERE user_id=$1 AND normalized_name=$4 AND id<>$2)
      RETURNING id,name,description,created_at,(SELECT count(*)::text FROM saved_words WHERE user_id=$1 AND collection_id=$2) AS word_count`, [userId,id,name,normalizedName,description]);
    return result.rows[0] ? summary(result.rows[0]) : 'duplicate';
  }
  async remove(userId: string, id: string) {
    const result = await this.db.query(`DELETE FROM collections c WHERE c.user_id=$1 AND c.id=$2
      AND NOT EXISTS (SELECT 1 FROM saved_words sw WHERE sw.user_id=$1 AND sw.collection_id=$2) RETURNING id`, [userId,id]);
    if (result.rowCount) return 'deleted';
    const existing = await this.db.query('SELECT 1 FROM collections WHERE user_id=$1 AND id=$2', [userId,id]);
    return existing.rowCount ? 'not_empty' : 'not_found';
  }
}
