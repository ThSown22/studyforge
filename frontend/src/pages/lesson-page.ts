import type { LessonDetail } from '../../../packages/contracts/src/index.ts';
import { api } from '../services/api.ts';
import { el, navigate } from '../core/dom.ts';
import { grammarStudy } from '../features/learning/grammar-study.ts';
import { flashcardStudy } from '../features/learning/flashcards.ts';
import { learningError, learningHeader } from '../features/learning/ui.ts';

export async function renderLessonPage(params: { id: string }, signal?: AbortSignal): Promise<HTMLElement> {
  try {
    const lesson = await api<LessonDetail>(`/api/lessons/${encodeURIComponent(params.id)}`, { signal });
    const root = el('<div class="learning-page"></div>');
    root.append(learningHeader('learn', `/roadmap/${lesson.track}?unit=${encodeURIComponent(lesson.unitId)}`));
    async function finish(): Promise<void> {
      await api(`/api/lessons/${encodeURIComponent(lesson.id)}/learn`, { method: 'POST', body: '{}', signal });
      navigate(`/quiz/${encodeURIComponent(lesson.id)}`);
    }
    root.append(lesson.track === 'vocabulary' ? flashcardStudy(lesson, finish, signal) : grammarStudy(lesson, finish));
    return root;
  } catch (error) { return learningError(error); }
}
