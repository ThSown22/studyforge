import { createHash, randomUUID } from 'node:crypto';
import type { Answer, AnswerResult, AttemptResult, ReviewItem, User } from '../../../../packages/contracts/src/index.ts';
import { HttpError } from '../../shared/errors.ts';
import { record, text } from '../../shared/validation.ts';
import { transaction } from '../../infrastructure/database/connection.ts';
import { LearningService } from '../curriculum/curriculum.service.ts';
import type { QuestionRow } from '../curriculum/curriculum.repository.ts';

const normalise = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '').toLowerCase();

export class AssessmentService {
  learning: LearningService;
  constructor(learning: LearningService) { this.learning = learning; }
  submit(kind: 'lesson' | 'challenge', id: string, user: User | null, body: unknown): AttemptResult {
    const db = this.learning.repository.db;
    const input = record(body);
    const key = text(input.idempotencyKey, 'Mã lần nộp', 8, 100);
    if (!Array.isArray(input.answers) || input.answers.length > 100) throw new HttpError(400, 'INVALID_ANSWERS', 'Danh sách câu trả lời không hợp lệ.');
    const answers: Answer[] = input.answers.map(raw => {
      const a = record(raw);
      if (typeof a.answer !== 'string' || a.answer.length > 2000) throw new HttpError(400, 'INVALID_ANSWERS', 'Câu trả lời không hợp lệ.');
      return { questionId: text(a.questionId, 'Mã câu hỏi', 1, 120), answer: a.answer.trim() };
    });
    if (new Set(answers.map(a => a.questionId)).size !== answers.length) throw new HttpError(400, 'DUPLICATE_ANSWER', 'Mỗi câu hỏi chỉ được gửi một câu trả lời.');
    const requestHash = createHash('sha256').update(JSON.stringify({ kind, id, answers: [...answers].sort((a, b) => a.questionId.localeCompare(b.questionId)) })).digest('hex');
    if (user) {
      const cached = db.prepare('SELECT request_hash,result_json FROM attempts WHERE user_id=? AND idempotency_key=?').get(user.id, key);
      if (cached) {
        if (cached.request_hash !== requestHash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Mã lần nộp đã được dùng cho nội dung khác.');
        return JSON.parse(String(cached.result_json)) as AttemptResult;
      }
    }
    let questions: QuestionRow[];
    let lessonXp = 0;
    if (kind === 'lesson') {
      const { lesson } = this.learning.summary(id, user);
      questions = this.learning.repository.questions(id);
      lessonXp = lesson.xp;
      if (user && !lesson.learned) throw new HttpError(409, 'LEARNING_REQUIRED', 'Hoàn thành phần học trước khi nộp bài kiểm tra.');
    } else {
      if (!user) throw new HttpError(401, 'AUTH_REQUIRED', 'Đăng nhập để làm bài vượt cấp.');
      this.learning.challenge(id, user);
      questions = this.learning.repository.challengeQuestions(id);
    }
    const validIds = new Set(questions.map(q => q.id));
    if (answers.some(answer => !validIds.has(answer.questionId))) throw new HttpError(400, 'UNKNOWN_QUESTION', 'Câu hỏi không thuộc bài kiểm tra này.');
    const answersById = new Map(answers.map(a => [a.questionId, a.answer]));
    const results: AnswerResult[] = questions.map(q => {
      const answer = answersById.get(q.id) ?? '';
      return { questionId: q.id, prompt: q.prompt, answer, correctAnswer: q.answer, correct: normalise(answer) === normalise(q.answer), explanation: q.explanation };
    });
    const correct = results.filter(r => r.correct).length;
    const score = questions.length ? Math.round(correct * 100 / questions.length) : 0;
    const passed = questions.length > 0 && correct / questions.length >= .8;
    const result: AttemptResult = { attemptId: null, score, passed, total: questions.length, correct, xpEarned: 0, saved: !!user, results, nextLessonId: null };
    if (!user) return result;
    return transaction(db, () => {
      const now = new Date().toISOString();
      if (kind === 'lesson') {
        const old = db.prepare('SELECT completed FROM progress WHERE user_id=? AND lesson_id=?').get(user.id, id);
        result.xpEarned = passed && !old?.completed ? lessonXp : 0;
        db.prepare(`INSERT INTO progress(user_id,lesson_id,learned,completed,best_score,completed_at,updated_at) VALUES(?,?,1,?,?,?,?)
          ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=MAX(progress.completed,excluded.completed),
          best_score=MAX(progress.best_score,excluded.best_score),completed_at=COALESCE(progress.completed_at,excluded.completed_at),updated_at=excluded.updated_at`)
          .run(user.id, id, passed ? 1 : 0, score, passed ? now : null, now);
      } else if (passed) {
        const previousPass = db.prepare("SELECT id FROM attempts WHERE user_id=? AND unit_id=? AND kind='challenge' AND passed=1 LIMIT 1").get(user.id, id);
        result.xpEarned = previousPass ? 0 : 60;
        const currentUnit = this.learning.repository.unit(id)!;
        const nextUnit = this.learning.repository.units().find(u => u.track === currentUnit.track && u.position === currentUnit.position + 1);
        if (nextUnit) db.prepare('INSERT OR IGNORE INTO unit_unlocks(user_id,unit_id,created_at) VALUES(?,?,?)').run(user.id, nextUnit.id, now);
      }
      if (result.xpEarned) db.prepare('UPDATE users SET xp=xp+? WHERE id=?').run(result.xpEarned, user.id);
      for (const answer of results) {
        if (answer.correct) db.prepare('UPDATE review_items SET resolved_at=? WHERE user_id=? AND question_id=?').run(now, user.id, answer.questionId);
        else db.prepare(`INSERT INTO review_items(id,user_id,question_id,answer,created_at,resolved_at) VALUES(?,?,?,?,?,NULL)
          ON CONFLICT(user_id,question_id) DO UPDATE SET answer=excluded.answer,resolved_at=NULL,created_at=excluded.created_at`).run(randomUUID(), user.id, answer.questionId, answer.answer, now);
      }
      const catalog = this.learning.catalog(user);
      const current = catalog.lessons.find(l => l.id === id);
      result.nextLessonId = kind === 'lesson' && passed ? (catalog.lessons.find(l => l.unitId === current?.unitId && l.position === (current?.position ?? 0) + 1 && !l.locked)?.id ?? catalog.lessons.find(l => l.track === current?.track && !l.locked && !l.completed)?.id ?? null) : null;
      result.attemptId = randomUUID();
      db.prepare('INSERT INTO attempts(id,user_id,lesson_id,unit_id,kind,score,passed,xp_earned,created_at,idempotency_key,request_hash,result_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(result.attemptId, user.id, kind === 'lesson' ? id : null, kind === 'challenge' ? id : null, kind, score, passed ? 1 : 0, result.xpEarned, now, key, requestHash, JSON.stringify(result));
      const insertAnswer = db.prepare('INSERT INTO attempt_answers(attempt_id,question_id,answer,correct) VALUES(?,?,?,?)');
      for (const answer of results) insertAnswer.run(result.attemptId, answer.questionId, answer.answer, answer.correct ? 1 : 0);
      return result;
    });
  }
  review(user: User): { items: ReviewItem[] } {
    const rows = this.learning.repository.db.prepare(`SELECT r.id,q.lesson_id,l.title AS lesson_title,q.prompt,r.answer,q.answer AS correct_answer,q.explanation
      FROM review_items r JOIN questions q ON q.id=r.question_id JOIN lessons l ON l.id=q.lesson_id
      WHERE r.user_id=? AND r.resolved_at IS NULL ORDER BY r.created_at DESC`).all(user.id);
    return { items: rows.map(r => ({ id: String(r.id), lessonId: String(r.lesson_id), lessonTitle: String(r.lesson_title), prompt: String(r.prompt), answer: String(r.answer), correctAnswer: String(r.correct_answer), explanation: String(r.explanation) })) };
  }
  resolveReview(id: string, user: User, body: unknown) {
    const input = record(body);
    const answer = text(input.answer, 'Câu trả lời', 1, 2000);
    const db = this.learning.repository.db;
    const row = db.prepare(`SELECT r.id,q.answer,q.explanation FROM review_items r JOIN questions q ON q.id=r.question_id
      WHERE r.id=? AND r.user_id=? AND r.resolved_at IS NULL`).get(id, user.id);
    if (!row) throw new HttpError(404, 'REVIEW_NOT_FOUND', 'Không tìm thấy câu cần ôn.');
    const correct = normalise(answer) === normalise(String(row.answer));
    if (correct) db.prepare('UPDATE review_items SET resolved_at=? WHERE id=? AND user_id=?').run(new Date().toISOString(), id, user.id);
    return { correct, correctAnswer: String(row.answer), explanation: String(row.explanation) };
  }
}
