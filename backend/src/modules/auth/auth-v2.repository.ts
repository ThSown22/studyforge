import type { Pool } from 'pg';
import type { User } from '../../../../packages/contracts/src/index.ts';

export interface V2UserRow { id: string; email: string; display_name: string; created_at: Date; password_hash: string }
export function publicV2User(row: V2UserRow): User {
  return { id: row.id, email: row.email, name: row.display_name, xp: 0, createdAt: row.created_at.toISOString() };
}
export class PostgresAuthRepository {
  private readonly db: Pool;
  constructor(db: Pool) { this.db = db; }
  async byEmail(email: string) {
    const result = await this.db.query<V2UserRow>('SELECT id,email,display_name,created_at,password_hash FROM users WHERE email_normalized=$1 AND is_active=true', [email]);
    return result.rows[0] ?? null;
  }
  async insert(name: string, email: string, passwordHash: string) {
    const result = await this.db.query<V2UserRow>(`INSERT INTO users(email,email_normalized,display_name,password_hash)
      VALUES($1,$2,$3,$4) RETURNING id,email,display_name,created_at,password_hash`, [email,email,name,passwordHash]);
    return result.rows[0];
  }
  async createSession(hash: string, userId: string, expiresAt: Date) {
    await this.db.query('INSERT INTO auth_sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [userId,hash,expiresAt]);
  }
  async sessionUser(hash: string) {
    const result = await this.db.query<V2UserRow>(`SELECT u.id,u.email,u.display_name,u.created_at,u.password_hash FROM auth_sessions s
      JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.revoked_at IS NULL AND u.is_active=true`, [hash]);
    return result.rows[0] ?? null;
  }
  async revokeSession(hash: string) {
    await this.db.query('UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL', [hash]);
  }
}
