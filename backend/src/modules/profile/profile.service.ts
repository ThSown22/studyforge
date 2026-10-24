import type { Profile, User } from '../../../../packages/contracts/src/index.ts';
import { AuthRepository, publicUser } from '../auth/auth.repository.ts';
import { text, record } from '../../shared/validation.ts';

export class ProfileService {
  repository: AuthRepository;
  constructor(repository: AuthRepository) { this.repository = repository; }
  get(user: User): Profile {
    const db = this.repository.db;
    const attempts = db.prepare(`SELECT a.id,a.score,a.passed,a.created_at,a.kind,COALESCE(l.title,'Kiểm tra kiến thức '||u.title) AS title
      FROM attempts a LEFT JOIN lessons l ON l.id=a.lesson_id LEFT JOIN units u ON u.id=a.unit_id WHERE a.user_id=? ORDER BY a.created_at DESC LIMIT 100`).all(user.id);
    const count = (sql: string) => Number(db.prepare(sql).get(user.id)?.count ?? 0);
    return { user: publicUser(this.repository.byId(user.id)!), stats: {
      completed: count('SELECT COUNT(*) AS count FROM progress WHERE user_id=? AND completed=1'),
      attempts: count('SELECT COUNT(*) AS count FROM attempts WHERE user_id=?'),
      reviewCount: count('SELECT COUNT(*) AS count FROM review_items WHERE user_id=? AND resolved_at IS NULL'),
    }, attempts: attempts.map(row => ({ id: String(row.id), title: String(row.title), score: Number(row.score), passed: !!row.passed, createdAt: String(row.created_at), kind: row.kind as 'lesson' | 'challenge' })) };
  }
  update(user: User, body: unknown) {
    const name = text(record(body).name, 'Tên', 2, 80);
    this.repository.updateName(user.id, name);
    return { user: publicUser(this.repository.byId(user.id)!) };
  }
}
