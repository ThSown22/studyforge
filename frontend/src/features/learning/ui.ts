import { el, escapeHtml, navigate, refresh } from '../../core/dom.ts';

export function authPrompt(): void {
  window.dispatchEvent(new CustomEvent('studyforge:auth', { detail: { mode: 'login' } }));
}

export function learningError(error: unknown, title = 'Chưa thể tải nội dung'): HTMLElement {
  const message = error instanceof Error ? error.message : 'Kết nối bị gián đoạn. Vui lòng thử lại.';
  const node = el(`<section class="learning-empty" role="alert"><span class="learning-eyebrow">STUDYFORGE</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><div class="learning-actions"><button class="learning-btn" data-retry>Thử lại</button><button class="learning-btn secondary" data-login>Đăng nhập</button><button class="learning-link" data-home>Về trang chủ →</button></div></section>`);
  node.querySelector('[data-retry]')?.addEventListener('click', refresh);
  node.querySelector('[data-login]')?.addEventListener('click', authPrompt);
  node.querySelector('[data-home]')?.addEventListener('click', () => navigate('/'));
  return node;
}

export function learningHeader(active: 'learn' | 'quiz', exit: string): HTMLElement {
  const node = el(`<header class="learning-toolbar"><button class="learning-exit" data-exit aria-label="Thoát bài học"><span aria-hidden="true">×</span><small>THOÁT</small></button><ol class="learning-stepper" aria-label="Các giai đoạn bài học"><li class="${active === 'learn' ? 'active' : 'done'}"><span>01</span><strong>Phần học</strong></li><li class="${active === 'quiz' ? 'active' : ''}"><span>02</span><strong>Bài kiểm tra</strong></li></ol><span class="learning-toolbar-spacer" aria-hidden="true"></span></header>`);
  node.querySelector('[data-exit]')?.addEventListener('click', () => navigate(exit));
  return node;
}

export function pronounce(text: string): boolean {
  if (!('speechSynthesis' in window)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function readableDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date);
}
