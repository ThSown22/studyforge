import { el, bindLinks } from './core/dom.ts';
import { api, ApiError } from './services/api.ts';
import { renderHeader } from './layouts/header.ts';
import { renderFooter } from './layouts/footer.ts';
import { renderHomePage } from './pages/home-page.ts';
import { renderRoadmapPage } from './pages/roadmap-page.ts';
import { renderLessonPage } from './pages/lesson-page.ts';
import { renderQuizPage } from './pages/quiz-page.ts';
import { renderReviewPage } from './pages/review-page.ts';
import { renderProfilePage } from './pages/profile-page.ts';
import { showAuthDialog } from './features/auth/auth-dialog.ts';
import { showSupportDialog } from './features/support/support-dialog.ts';
import type { User } from '../../packages/contracts/src/index.ts';

const app = document.getElementById('app')!;
let current = new AbortController();
let sequence = 0;
let user: User | null = null;
async function render(scroll = true): Promise<void> {
  current.abort(); current = new AbortController(); const { signal } = current; const turn = ++sequence;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
  const shell = el('<div class="app-shell"><main id="page-content" tabindex="-1"><div class="page-loading" role="status"><span></span>Đang chuẩn bị bài học…</div></main></div>');
  shell.prepend(renderHeader(user, location.pathname, signal));
  shell.append(renderFooter(signal));
  const support = el('<button class="support-fab" aria-label="Hỗ trợ và góp ý"><span>☏</span><strong>Hỗ trợ/Góp ý</strong></button>');
  support.addEventListener('click', showSupportDialog, { signal }); shell.append(support);
  app.replaceChildren(shell);
  if (scroll) window.scrollTo({ top: 0 });
  const main = shell.querySelector('main')!;
  try {
    const session = await api<{ user: User | null }>('/api/auth/me', { signal });
    if (turn !== sequence) return;
    user = session.user; shell.querySelector('header')!.replaceWith(renderHeader(user, location.pathname, signal));
    const parts = location.pathname.split('/').filter(Boolean);
    let page: HTMLElement;
    if (!parts.length) page = await renderHomePage(signal);
    else if (parts[0] === 'roadmap' && ['grammar', 'vocabulary'].includes(parts[1])) page = await renderRoadmapPage(parts[1] as 'grammar' | 'vocabulary', signal);
    else if (parts[0] === 'lesson' && parts[1]) page = await renderLessonPage({ id: decodeURIComponent(parts[1]) }, signal);
    else if (['quiz', 'challenge'].includes(parts[0]) && parts[1]) page = await renderQuizPage({ id: decodeURIComponent(parts[1]), kind: parts[0] === 'challenge' ? 'challenge' : 'lesson' }, signal);
    else if (parts[0] === 'review') page = await renderReviewPage(signal);
    else if (parts[0] === 'profile') page = await renderProfilePage(signal);
    else page = el('<section class="empty-state panel"><span class="empty-icon">↗</span><h1>Bạn đang tìm một chặng mới?</h1><p>Trang này không tồn tại. Cùng quay về hành trình học nhé.</p><a href="/" class="btn btn-primary" data-route>Về trang chủ →</a></section>');
    if (turn !== sequence) return;
    bindLinks(page, signal); main.replaceChildren(page);
    document.title = `${page.querySelector('h1')?.textContent?.trim() || 'Hành trình học tập'} — StudyForge`;
  } catch (error) {
    if (signal.aborted) return;
    const unauthorized = error instanceof ApiError && error.status === 401;
    const view = el(`<section class="empty-state panel"><span class="empty-icon">${unauthorized ? '↗' : '!'}</span><h1>${unauthorized ? 'Lưu hành trình học của bạn.' : 'Chặng này chưa mở được.'}</h1><p class="error-message"></p><button class="btn btn-primary">${unauthorized ? 'Đăng nhập →' : 'Thử lại →'}</button><a href="/" data-route class="text-link">Về trang chủ</a></section>`);
    view.querySelector('.error-message')!.textContent = (error as Error).message;
    view.querySelector('button')!.addEventListener('click', () => unauthorized ? showAuthDialog() : void render(false), { signal });
    bindLinks(view, signal); main.replaceChildren(view);
  }
}
window.addEventListener('popstate', () => void render());
window.addEventListener('studyforge:navigate', () => void render());
window.addEventListener('studyforge:refresh', () => void render(false));
window.addEventListener('studyforge:auth', event => showAuthDialog((event as CustomEvent).detail?.mode || 'login'));
for (const event of ['studyforge:progress-updated', 'studyforge:user-updated']) window.addEventListener(event, async () => {
  try { user = (await api<{ user: User | null }>('/api/auth/me')).user; app.querySelector('header')?.replaceWith(renderHeader(user, location.pathname, current.signal)); } catch { /* Current page retains its own action error handling. */ }
});
void render();
