import type { LessonDetail } from '../../../../packages/contracts/src/index.ts';
import { el, escapeHtml } from '../../core/dom.ts';

export function grammarStudy(lesson: LessonDetail, finish: () => Promise<void>): HTMLElement {
  const root = el('<section class="learning-grammar"></section>');
  let index = 0;
  let busy = false;
  let error = '';

  function render(): void {
    const section = lesson.sections[index];
    root.innerHTML = `<div class="learning-heading grammar-heading"><div><p class="learning-eyebrow">${escapeHtml(lesson.unit.title)} · PHẦN HỌC ${index + 1}/${lesson.sections.length}</p><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.description)}</p></div><span class="learning-level-chip" aria-label="Bậc ${escapeHtml(lesson.unit.title)}">${escapeHtml(lesson.unit.title)}</span></div>
      <div class="learning-meter" role="progressbar" aria-label="Tiến độ phần học" aria-valuemin="0" aria-valuemax="${lesson.sections.length}" aria-valuenow="${index + 1}"><span style="width:${((index + 1) / Math.max(1, lesson.sections.length)) * 100}%"></span></div>
      ${section ? `<article class="learning-knowledge"><div class="learning-knowledge-grid"><div class="learning-summary-box"><span class="learning-eyebrow">${String(index + 1).padStart(2, '0')} · TRỌNG TÂM</span><h2 tabindex="-1">${escapeHtml(section.title)}</h2><p class="learning-prose">${escapeHtml(section.body)}</p></div>${section.formula ? `<div class="learning-formula"><small>CẤU TRÚC CHÍNH</small><strong>${escapeHtml(section.formula)}</strong></div>` : ''}</div><div class="learning-examples">${section.examples.map((example) => `<div class="learning-example"><div class="learning-example-caption"><small>VÍ DỤ · ĐỌC VÀ SUY NGẪM</small><span>${escapeHtml(example.vietnamese)}</span></div><p lang="en">${escapeHtml(example.english)}</p></div>`).join('')}</div></article>` : '<p class="learning-notice">Bài học chưa có nội dung kiến thức.</p>'}
      ${error ? `<p class="learning-notice error" role="alert">${escapeHtml(error)}</p>` : ''}
      <nav class="learning-actions spread" aria-label="Điều hướng phần học"><button class="learning-btn secondary" data-prev ${index === 0 || busy ? 'disabled' : ''}>← Quay lại</button><span class="learning-muted">Đọc, hiểu rồi tiến thêm một bước.</span><button class="learning-btn" data-next ${busy || !section ? 'disabled' : ''}>${busy ? 'Đang lưu…' : index < lesson.sections.length - 1 ? 'Tiếp tục →' : 'Hoàn thành phần học →'}</button></nav>`;
    root.querySelector('[data-prev]')?.addEventListener('click', () => { index -= 1; render(); root.querySelector<HTMLElement>('h2')?.focus(); });
    root.querySelector('[data-next]')?.addEventListener('click', async () => {
      if (index < lesson.sections.length - 1) { index += 1; render(); root.querySelector<HTMLElement>('h2')?.focus(); return; }
      busy = true;
      error = '';
      render();
      try { await finish(); }
      catch (cause) { error = cause instanceof Error ? cause.message : 'Chưa thể lưu phần học. Vui lòng thử lại.'; busy = false; render(); }
    });
  }
  render();
  return root;
}
