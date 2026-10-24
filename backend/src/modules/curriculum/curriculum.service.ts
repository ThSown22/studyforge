import type { Catalog, Dashboard, LessonDetail, LessonSummary, Quiz, Unit, User } from '../../../../packages/contracts/src/index.ts';
import { HttpError } from '../../shared/errors.ts';
import { LearningRepository } from './curriculum.repository.ts';
import type { QuestionRow } from './curriculum.repository.ts';

export class LearningService {
  repository: LearningRepository;
  constructor(repository: LearningRepository) { this.repository = repository; }
  catalog(user: User | null): Catalog {
    const rawUnits = this.repository.units();
    const rawLessons = this.repository.lessons();
    const progress = new Map(this.repository.progress(user?.id ?? null).map(p => [p.lesson_id, p]));
    const unlocks = new Set(this.repository.unlocks(user?.id ?? null));
    const units: Unit[] = rawUnits.map(row => {
      const lessons = rawLessons.filter(lesson => lesson.unit_id === row.id);
      const previous = rawUnits.find(unit => unit.track === 'grammar' && unit.position === row.position - 1);
      const previousComplete = previous ? rawLessons.filter(l => l.unit_id === previous.id).every(l => !!progress.get(l.id)?.completed) : true;
      const locked = row.track === 'grammar' && row.position > 1 && (!user || (!previousComplete && !unlocks.has(row.id)));
      return { id: row.id, track: row.track, title: row.title, subtitle: row.subtitle, description: row.description, position: row.position, color: row.color, lessonCount: lessons.length, completedCount: lessons.filter(l => !!progress.get(l.id)?.completed).length, locked };
    });
    const lessons: LessonSummary[] = rawLessons.map(row => {
      const previous = rawLessons.find(l => l.unit_id === row.unit_id && l.position === row.position - 1);
      const unit = units.find(u => u.id === row.unit_id)!;
      const p = progress.get(row.id);
      const locked = unit.locked || (row.position > 1 && (!user || !progress.get(previous?.id ?? '')?.completed));
      return { id: row.id, unitId: row.unit_id, track: row.track, title: row.title, category: row.category, description: row.description, position: row.position, xp: row.xp, questionCount: row.question_count, cardCount: row.card_count, sectionCount: row.section_count, locked, completed: !!p?.completed, learned: !!p?.learned, bestScore: p ? p.best_score : null };
    });
    return { units, lessons, stats: { grammarLessons: lessons.filter(l => l.track === 'grammar').length, vocabularyLessons: lessons.filter(l => l.track === 'vocabulary').length, wordCount: lessons.reduce((sum, lesson) => sum + lesson.cardCount, 0) }, sampleData: false };
  }
  unit(id: string, user: User | null) {
    const catalog = this.catalog(user);
    const unit = catalog.units.find(u => u.id === id);
    if (!unit) throw new HttpError(404, 'UNIT_NOT_FOUND', 'Không tìm thấy chặng học.');
    return { unit, lessons: catalog.lessons.filter(l => l.unitId === id) };
  }
  summary(id: string, user: User | null) {
    const catalog = this.catalog(user);
    const lesson = catalog.lessons.find(l => l.id === id);
    if (!lesson) throw new HttpError(404, 'LESSON_NOT_FOUND', 'Không tìm thấy bài học.');
    if (lesson.locked) throw new HttpError(user ? 403 : 401, user ? 'LESSON_LOCKED' : 'AUTH_REQUIRED', user ? 'Hoàn thành bài hoặc chặng trước để mở nội dung này.' : 'Đăng nhập để mở thêm bài học và lưu tiến độ.');
    return { lesson, catalog };
  }
  detail(id: string, user: User | null): LessonDetail {
    const { lesson, catalog } = this.summary(id, user);
    return {
      ...lesson, unit: catalog.units.find(unit => unit.id === lesson.unitId)!,
      sections: this.repository.sections(id).map(row => ({ title: row.title, body: row.body, ...(row.formula ? { formula: row.formula } : {}), examples: JSON.parse(row.examples_json) })),
      cards: this.repository.cards(id).map(row => ({ id: row.id, word: row.word, phonetic: row.phonetic, partOfSpeech: row.part_of_speech, meaning: row.meaning, example: row.example, translation: row.translation })),
    };
  }
  markLearned(id: string, user: User | null) {
    this.summary(id, user);
    if (user) this.repository.learned(user.id, id);
    return { saved: !!user };
  }
  questionsToQuiz(questions: QuestionRow[], title: string, reference: { lessonId?: string; unitId?: string }): Quiz {
    return { ...reference, title, passPercent: 80, questions: questions.map(q => ({ id: q.id, prompt: q.prompt, type: q.type, ...(q.options_json ? { options: JSON.parse(q.options_json) } : {}) })) };
  }
  quiz(id: string, user: User | null): Quiz {
    const { lesson } = this.summary(id, user);
    return this.questionsToQuiz(this.repository.questions(id), lesson.title, { lessonId: id });
  }
  challenge(id: string, user: User): Quiz {
    const { unit } = this.unit(id, user);
    if (unit.track !== 'grammar') throw new HttpError(400, 'NO_CHALLENGE', 'Bài vượt cấp chỉ áp dụng cho lộ trình ngữ pháp.');
    if (unit.locked) throw new HttpError(403, 'UNIT_LOCKED', 'Hãy mở chặng này trước khi làm bài vượt cấp.');
    return this.questionsToQuiz(this.repository.challengeQuestions(id), `Kiểm tra kiến thức ${unit.title}`, { unitId: id });
  }
  dashboard(user: User | null): Dashboard {
    const { lessons } = this.catalog(user);
    const completed = lessons.filter(l => l.completed);
    const percent = lessons.length ? Math.floor(completed.length * 100 / lessons.length) : 0;
    const xp = user?.xp ?? 0;
    const thresholds = [0, 120, 360, 720, 1200, 1800];
    const names = ['Hạt giống', 'Nảy mầm', 'Phát triển thân', 'Phân cành', 'Ra lá', 'Kết trái'];
    let index = 0;
    thresholds.forEach((threshold, i) => { if (xp >= threshold) index = i; });
    const next = thresholds[index + 1];
    return { user, completedLessons: completed.length, totalLessons: lessons.length, xp, percent,
      stage: { index, name: names[index], nextName: names[index + 1] ?? null, remaining: next ? next - xp : 0, percent: next ? Math.min(100, Math.floor((xp - thresholds[index]) * 100 / (next - thresholds[index]))) : 100 },
      nextLesson: lessons.find(l => l.track === 'grammar' && !l.locked && !l.completed) ?? lessons.find(l => !l.locked && !l.completed) ?? lessons[0] ?? null,
      grammarCompleted: completed.filter(l => l.track === 'grammar').length, vocabularyCompleted: completed.filter(l => l.track === 'vocabulary').length };
  }
}
