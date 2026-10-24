import type { ReviewItem } from '../../../packages/contracts/src/index.ts';
import { api } from '../services/api.ts';
import { el, escapeHtml, navigate, toast } from '../core/dom.ts';
import { learningError } from '../features/learning/ui.ts';

export async function renderReviewPage(signal?: AbortSignal): Promise<HTMLElement> {
  try {
    const response = await api<{ items: ReviewItem[] }>('/api/review', { signal });
    let items = response.items;
    const root = el('<section class="learning-review-page"></section>');
    function render(): void {
      root.innerHTML = `<div class="learning-heading"><p class="learning-eyebrow">ÔN TẬP CÁ NHÂN</p><h1>Nhớ lâu hơn, mỗi ngày.</h1><p>Những câu chưa đúng được giữ lại để bạn luyện thêm. Trả lời chính xác để hoàn thành lượt ôn.</p></div><div class="learning-review-summary"><strong>${items.length}</strong><span>câu đang chờ ôn tập</span></div>${items.length ? `<div class="learning-review-list">${items.map((item) => `<article class="learning-panel learning-review-item" data-review-id="${escapeHtml(item.id)}"><p class="learning-eyebrow">${escapeHtml(item.lessonTitle)}</p><h2>${escapeHtml(item.prompt)}</h2><p class="learning-muted">Lần trước: ${escapeHtml(item.answer || 'Chưa trả lời')}</p><form novalidate><label class="learning-text-label">Thử lại câu trả lời<input class="learning-input" name="answer" required maxlength="1000" autocomplete="off" placeholder="Nhập đáp án của bạn"></label><p class="learning-review-feedback" aria-live="polite"></p><div class="learning-actions"><button class="learning-btn" type="submit">Kiểm tra →</button><button class="learning-link" type="button" data-lesson="${escapeHtml(item.lessonId)}">Xem lại bài học</button></div></form></article>`).join('')}</div>` : '<div class="learning-panel learning-empty"><span class="learning-success-icon">✓</span><h2>Không còn câu nào cần ôn!</h2><p>Tiếp tục khám phá những bài học mới để tích lũy kiến thức.</p><button class="learning-btn" data-roadmap>Về lộ trình →</button></div>'}`;
      root.querySelector('[data-roadmap]')?.addEventListener('click', () => navigate('/roadmap/grammar'));
      root.querySelectorAll<HTMLElement>('[data-lesson]').forEach((button) => button.addEventListener('click', () => navigate(`/lesson/${encodeURIComponent(button.dataset.lesson!)}`)));
      root.querySelectorAll<HTMLElement>('[data-review-id]').forEach((article) => {
        const form = article.querySelector<HTMLFormElement>('form')!;
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          const input = form.elements.namedItem('answer') as HTMLInputElement;
          const feedback = form.querySelector<HTMLElement>('.learning-review-feedback')!;
          const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
          if (!input.value.trim()) { feedback.textContent = 'Hãy nhập một câu trả lời trước khi kiểm tra.'; input.focus(); return; }
          button.disabled = true; button.textContent = 'Đang kiểm tra…'; feedback.textContent = '';
          try {
            const result = await api<{ correct: boolean; correctAnswer: string; explanation: string }>(`/api/review/${encodeURIComponent(article.dataset.reviewId!)}/resolve`, { method: 'POST', body: JSON.stringify({ answer: input.value }), signal });
            if (result.correct) { items = items.filter((item) => item.id !== article.dataset.reviewId); toast('Chính xác! Đã hoàn thành một câu ôn tập.', 'success'); render(); }
            else { feedback.textContent = `Chưa chính xác. Đáp án: ${result.correctAnswer}. ${result.explanation}`; feedback.classList.add('error'); }
          } catch (cause) { feedback.textContent = cause instanceof Error ? cause.message : 'Chưa thể kiểm tra câu trả lời.'; feedback.classList.add('error'); }
          finally { if (button.isConnected) { button.disabled = false; button.textContent = 'Kiểm tra →'; } }
        });
      });
    }
    render();
    return root;
  } catch (error) { return learningError(error, 'Ôn tập dành riêng cho bạn'); }
}
