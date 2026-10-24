import type { DatabaseSync } from 'node:sqlite';
import type { User } from '../../../../packages/contracts/src/index.ts';

export interface UserRow { id: string; name: string; email: string; password_hash: string; xp: number; created_at: string }
export function publicUser(row: UserRow): User {
  return { id: row.id, name: row.name, email: row.email, xp: row.xp, createdAt: row.created_at };
}
export class AuthRepository {
  db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }
  byEmail(email: string) { return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined; }
  byId(id: string) { return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined; }
  insert(row: UserRow) { this.db.prepare('INSERT INTO users(id,name,email,password_hash,xp,created_at) VALUES(?,?,?,?,?,?)').run(row.id, row.name, row.email, row.password_hash, row.xp, row.created_at); }
  createSession(hash: string, userId: string, expires: number) {
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    this.db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(hash, userId, expires, new Date().toISOString());
  }
  sessionUser(hash: string) {
    return this.db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?').get(hash, Date.now()) as unknown as UserRow | undefined;
  }
  deleteSession(hash: string) { this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash); }
  updateName(id: string, name: string) { this.db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id); }
}
