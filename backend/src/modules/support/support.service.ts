import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { User } from '../../../../packages/contracts/src/index.ts';
import { record, text, email } from '../../shared/validation.ts';

export class SupportService {
  db: DatabaseSync;
  constructor(db: DatabaseSync) { this.db = db; }
  submit(body: unknown, user: User | null) {
    const input = record(body);
    const category = text(input.category, 'Chủ đề', 2, 40);
    const message = text(input.message, 'Nội dung', 10, 5000);
    const contact = input.email ? email(input.email) : user?.email ?? null;
    const id = randomUUID();
    this.db.prepare('INSERT INTO feedback(id,user_id,category,message,email,created_at) VALUES(?,?,?,?,?,?)').run(id, user?.id ?? null, category, message, contact, new Date().toISOString());
    return { id };
  }
}
