import type { AttemptResult, LessonDetail, Quiz } from '../../../packages/contracts/src/index.ts';
import { api } from '../services/api.ts';
import { el, escapeHtml } from '../core/dom.ts';
import { learningError, learningHeader } from '../features/learning/ui.ts';
import { quizResults } from '../features/learning/quiz-results.ts';

export async function renderQuizPage(params: { id: string; kind?: 'lesson' | 'challenge' }, signal?: AbortSignal): Promise<HTMLElement> {
  const challenge = params.kind === 'challenge';
  const base = challenge ? `/api/units/${encodeURIComponent(params.id)}` : `/api/lessons/${encodeURIComponent(params.id)}`;
  try {
    const [quiz, lesson] = await Promise.all([
      api<Quiz>(`${base}/${challenge ? 'challenge' : 'quiz'}`, { signal }),
      challenge ? Promise.resolve(null) : api<LessonDetail>(base, { signal }),
    ]);
    const root = el('<div class="learning-page"></div>');
    const exit = lesson ? `/roadmap/${lesson.track}?unit=${encodeURIComponent(lesson.unitId)}` : '/roadmap/grammar';
    root.append(learningHeader('quiz', exit));
    const body = el('<section class="learning-quiz"></section>');
    root.append(body);
    const answers = new Map<string, string>();
    const idempotencyKey = crypto.randomUUID();
    let index = 0;
    let busy = false;
    let error = '';

    function render(): void {
      const question = quiz.questions[index];
      if (!question) { body.innerHTML = '<div class="learning-empty"><h1>Bài kiểm tra chưa có câu hỏi.</h1><p>Vui lòng quay lại phần học.</p></div>'; return; }
      const selected = answers.get(question.id) ?? '';
      body.innerHTML = `<div class="learning-heading"><p class="learning-eyebrow">${challenge ? 'BÀI KIỂM TRA VƯỢT CẤP' : 'KIỂM TRA KIẾN THỨC'} · MỐC ĐẠT ${quiz.passPercent}%</p><h1>${escapeHtml(quiz.title)}</h1><p>Hoàn thành từng câu. Bạn có thể quay lại để kiểm tra đáp án trước khi nộp.</p></div><div class="learning-quiz-layout"><aside class="learning-panel learning-question-nav"><p class="learning-eyebrow">TIẾN ĐỘ</p><strong>${answers.size}/${quiz.questions.length} câu đã trả lời</strong><div class="learning-question-grid">${quiz.questions.map((item, i) => `<button class="${i === index ? 'active' : ''} ${answers.has(item.id) ? 'answered' : ''}" data-question="${i}" aria-label="Câu ${i + 1}${answers.has(item.id) ? ', đã trả lời' : ''}" ${i === index ? 'aria-current="step"' : ''}>${String(i + 1).padStart(2, '0')}</button>`).join('')}</div><p class="learning-muted">Điểm được chấm bởi StudyForge sau khi bạn nộp bài.</p></aside><div class="learning-panel learning-question"><p class="learning-eyebrow">CÂU ${String(index + 1).padStart(2, '0')} / ${quiz.questions.length}</p><h2 id="question-prompt" tabindex="-1">${escapeHtml(question.prompt)}</h2><fieldset class="learning-options" aria-labelledby="question-prompt"><legend class="learning-sr-only">Chọn hoặc nhập câu trả lời</legend>${question.type === 'choice' ? (question.options ?? []).map((option, i) => `<label class="learning-option ${selected === option ? 'selected' : ''}"><input type="radio" name="answer" value="${escapeHtml(option)}" ${selected === option ? 'checked' : ''} ${busy ? 'disabled' : ''}><span class="learning-option-letter">${String.fromCharCode(65 + i)}</span><span>${escapeHtml(option)}</span></label>`).join('') : `<label class="learning-text-label">Câu trả lời của bạn<input class="learning-input" name="text-answer" autocomplete="off" value="${escapeHtml(selected)}" ${busy ? 'disabled' : ''} placeholder="Nhập câu trả lời…"></label>`}</fieldset><div class="learning-actions spread"><button class="learning-btn secondary" data-prev ${index === 0 || busy ? 'disabled' : ''}>← Quay lại</button><button class="learning-btn" data-next ${index === quiz.questions.length - 1 || busy ? 'disabled' : ''}>Câu tiếp theo →</button></div></div></div>${error ? `<p class="learning-notice error" role="alert">${escapeHtml(error)}</p>` : ''}<div class="learning-quiz-submit"><span class="learning-muted">${answers.size === quiz.questions.length ? 'Bạn đã trả lời tất cả câu hỏi.' : `Còn ${quiz.questions.length - answers.size} câu chưa trả lời.`}</span><button class="learning-btn" data-submit ${answers.size < quiz.questions.length || busy ? 'disabled' : ''}>${busy ? 'Đang chấm điểm…' : 'Nộp bài kiểm tra →'}</button></div>`;
      body.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => input.addEventListener('change', () => { answers.set(question.id, input.value); render(); body.querySelector<HTMLInputElement>('input:checked')?.focus(); }));
      body.querySelector<HTMLInputElement>('[name="text-answer"]')?.addEventListener('input', (event) => {
        const input = event.target as HTMLInputElement;
        if (input.value.trim()) answers.set(question.id, input.value); else answers.delete(question.id);
        const submit = body.querySelector<HTMLButtonElement>('[data-submit]');
        if (submit) submit.disabled = answers.size < quiz.questions.length || busy;
        const status = body.querySelector<HTMLElement>('.learning-quiz-submit .learning-muted');
        if (status) status.textContent = answers.size === quiz.questions.length ? 'Bạn đã trả lời tất cả câu hỏi.' : `Còn ${quiz.questions.length - answers.size} câu chưa trả lời.`;
      });
      body.querySelectorAll<HTMLElement>('[data-question]').forEach((button) => button.addEventListener('click', () => { if (busy) return; index = Number(button.dataset.question); render(); body.querySelector<HTMLElement>('h2')?.focus(); }));
      body.querySelector('[data-prev]')?.addEventListener('click', () => { index -= 1; render(); });
      body.querySelector('[data-next]')?.addEventListener('click', () => { index += 1; render(); });
      body.querySelector('[data-submit]')?.addEventListener('click', submit);
    }
    async function submit(): Promise<void> {
      if (busy || answers.size !== quiz.questions.length) return;
      busy = true; error = ''; render();
      try {
        const result = await api<AttemptResult>(`${base}/attempts`, { method: 'POST', body: JSON.stringify({ answers: quiz.questions.map((question) => ({ questionId: question.id, answer: answers.get(question.id)! })), idempotencyKey }), signal });
        if (result.saved) window.dispatchEvent(new CustomEvent('studyforge:progress-updated'));
        body.replaceWith(quizResults(quiz, result, exit));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (cause) { busy = false; error = cause instanceof Error ? cause.message : 'Chưa thể chấm điểm. Vui lòng thử lại.'; render(); }
    }
    render();
    return root;
  } catch (error) { return learningError(error, 'Chưa thể mở bài kiểm tra'); }
}
