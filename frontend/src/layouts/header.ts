import type { User } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e, bindLinks, openAuth, refresh, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';

export function renderHeader(user: User | null, pathname: string, signal: AbortSignal): HTMLElement {
  const active = pathname === '/' ? 'home' : 'roadmap';
  const root = el(`<header class="site-header"><div class="header-inner">
    <a href="/" data-route class="brand" aria-label="Về trang chủ StudyForge"><span>StudyForge<i>.</i></span><small>RÈN TRI THỨC · VỮNG TƯƠNG LAI</small></a>
    <nav class="main-navigation" aria-label="Điều hướng chính"><a data-route href="/" ${active === 'home' ? 'aria-current="page"' : ''}>Trang chủ</a><a data-route href="/roadmap/grammar" ${active === 'roadmap' ? 'aria-current="page"' : ''}>Lộ trình</a></nav>
    <details class="account-menu"><summary aria-label="Mở khu vực tài khoản"><span class="account-avatar">${user ? e(user.name.charAt(0).toUpperCase()) : '↗'}</span><span class="account-label">${user ? e(user.name.split(' ').at(-1)) : 'Đăng nhập'}</span><span class="chevron">⌄</span></summary>
    <div class="account-panel">${user ? `<p class="eyebrow">TÀI KHOẢN CỦA BẠN</p><strong>${e(user.name)}</strong><span class="muted">${e(user.email)}</span><div class="xp-pill">✦ ${user.xp} XP</div><a href="/profile" data-route>Hồ sơ & tiến độ <span>↗</span></a><a href="/review" data-route>Ôn câu chưa đúng <span>↺</span></a><button class="account-logout">Đăng xuất</button>` : `<p class="eyebrow">CHẾ ĐỘ HỌC THỬ</p><strong>Khởi đầu một hành trình mới</strong><p class="muted">Học thử bài đầu tiên. Tạo tài khoản để lưu tiến độ và mở bài tiếp theo.</p><div class="account-actions"><button class="btn btn-primary" data-auth="login">Đăng nhập</button><button class="btn btn-outline" data-auth="register">Đăng ký</button></div>`}</div></details>
  </div></header>`);
  bindLinks(root, signal);
  root.querySelectorAll<HTMLButtonElement>('[data-auth]').forEach(b => b.addEventListener('click', () => openAuth(b.dataset.auth as 'login' | 'register'), { signal }));
  root.querySelector('.account-logout')?.addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); refresh(); toast('Bạn đã đăng xuất. Hẹn gặp lại!'); }
    catch (error) { toast((error as Error).message, 'error'); }
  }, { signal });
  return root;
}
