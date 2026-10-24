import type { LessonDetail } from '../../../../packages/contracts/src/index.ts';
import { el, escapeHtml, toast } from '../../core/dom.ts';
import { pronounce } from './ui.ts';

export function flashcardStudy(lesson: LessonDetail, finish: () => Promise<void>, signal?: AbortSignal): HTMLElement {
  const root = el('<section class="learning-flashcards" tabindex="-1"></section>');
  const queue = lesson.cards.map((_, index) => index);
  const remembered = new Set<number>();
  let flipped = false;
  let busy = false;
  let error = '';
  let remainingSeconds = 20 * 60;
  const timer = window.setInterval(() => {
    if (signal?.aborted || !queue.length) { window.clearInterval(timer); return; }
    if (remainingSeconds > 0) remainingSeconds -= 1;
    const display = root.querySelector<HTMLElement>('[data-timer]');
    if (display) display.textContent = clock();
    const progress = root.querySelector<HTMLElement>('[data-timer-progress]');
    if (progress) progress.style.width = `${remainingSeconds / 1200 * 100}%`;
  }, 1000);
  signal?.addEventListener('abort', () => window.clearInterval(timer), { once: true });
  function clock(): string { return `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`; }

  function render(): void {
    const index = queue[0];
    const card = lesson.cards[index];
    root.innerHTML = `<aside class="learning-study-clock" aria-label="Thời gian học gợi ý"><span><small>THỜI GIAN HỌC</small><strong data-timer>${clock()}</strong></span><div class="learning-meter" aria-hidden="true"><span data-timer-progress style="width:${remainingSeconds / 1200 * 100}%"></span></div><b role="progressbar" aria-label="Thẻ đã nhớ" aria-valuemin="0" aria-valuemax="${lesson.cards.length}" aria-valuenow="${remembered.size}">${remembered.size}/${lesson.cards.length} đã nhớ</b></aside><div class="learning-flashcard-top"><p class="learning-eyebrow">${escapeHtml(lesson.unit.title)}</p></div>
      ${card ? `<div class="learning-card-wrap ${flipped ? 'flipped' : ''}"><button class="learning-flashcard ${flipped ? 'flipped' : ''}" data-flip aria-label="${flipped ? 'Lật sang mặt từ' : 'Lật sang mặt nghĩa'}"><span class="learning-eyebrow">${flipped ? 'NGHĨA & NGỮ CẢNH' : 'TỪ VỰNG · STUDYFORGE'}</span><strong ${flipped ? '' : 'lang="en"'}>${escapeHtml(flipped ? card.meaning : card.word)}</strong><span class="learning-card-type">${escapeHtml(card.partOfSpeech)}</span>${flipped ? `<blockquote lang="en">${escapeHtml(card.example)}</blockquote><span>${escapeHtml(card.translation)}</span>` : '<em>↻ Lật thẻ</em>'}</button><div class="learning-pronunciation"><span>${escapeHtml(card.phonetic)}</span><button class="learning-link" data-audio aria-label="Nghe phát âm: ${escapeHtml(card.word)}">◖ Nghe</button></div></div><div class="learning-actions learning-flashcard-controls"><button class="learning-btn secondary" data-review ${flipped ? '' : 'disabled'}>↺ Cần ôn</button><button class="learning-btn" data-remember ${flipped ? '' : 'disabled'}>✓ Đã nhớ</button></div><p class="learning-muted learning-center">${flipped ? 'Chọn mức độ ghi nhớ để chuyển sang thẻ tiếp theo.' : 'Lật thẻ trước khi đánh dấu mức độ ghi nhớ.'}</p><p class="learning-keyboard">Space <span>Lật thẻ</span> &nbsp; A <span>Phát âm</span> &nbsp; 1 <span>Cần ôn</span> &nbsp; 2 <span>Đã nhớ</span></p>` : `<section class="learning-panel learning-finish"><span class="learning-success-icon">✓</span><p class="learning-eyebrow">THÊM MỘT BƯỚC TIẾN</p><h1>Bạn đã đi qua ${lesson.cards.length} thẻ từ!</h1><p>Làm bài kiểm tra để củng cố kiến thức và ghi nhận tiến độ.</p>${error ? `<p class="learning-notice error" role="alert">${escapeHtml(error)}</p>` : ''}<button class="learning-btn" data-finish ${busy ? 'disabled' : ''}>${busy ? 'Đang lưu…' : 'Bắt đầu kiểm tra →'}</button></section>`}`;
    root.querySelector('[data-flip]')?.addEventListener('click', flip);
    root.querySelector('[data-audio]')?.addEventListener('click', audio);
    root.querySelector('[data-review]')?.addEventListener('click', () => mark(false));
    root.querySelector('[data-remember]')?.addEventListener('click', () => mark(true));
    root.querySelector('[data-finish]')?.addEventListener('click', async () => {
      busy = true; error = ''; render();
      try { await finish(); }
      catch (cause) { busy = false; error = cause instanceof Error ? cause.message : 'Chưa thể lưu phần học.'; render(); }
    });
  }
  function flip(): void { if (queue.length) { flipped = !flipped; render(); root.focus({ preventScroll: true }); } }
  function audio(): void {
    const card = lesson.cards[queue[0]];
    if (card && !pronounce(card.word)) toast('Trình duyệt này chưa hỗ trợ đọc phát âm.', 'error');
  }
  function mark(known: boolean): void {
    if (!flipped || !queue.length) return;
    const current = queue.shift()!;
    if (known) remembered.add(current); else queue.push(current);
    flipped = false; render(); root.focus({ preventScroll: true });
  }
  root.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); flip(); }
    if (event.key.toLowerCase() === 'a') audio();
    if (event.key === '1') mark(false);
    if (event.key === '2') mark(true);
  });
  signal?.addEventListener('abort', () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, { once: true });
  render();
  return root;
}
