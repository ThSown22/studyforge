import type { User } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e, bindLinks, openAuth, refresh, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';

export function renderHeader(user: User | null, pathname: string, signal: AbortSignal): HTMLElement {
  const active = pathname === '/' ? '/' : pathname.startsWith('/vocabulary') ? '/vocabulary' : pathname.startsWith('/dictionary') ? '/dictionary' : '';
  const root = el(`<header class="site-header"><div class="header-inner">
    <a href="/" data-route class="brand" aria-label="StudyForge, về trang chủ"><span>StudyForge<i>.</i></span><small>RÈN TRÍ THỨC · VỮNG TƯƠNG LAI</small></a>
    <nav class="main-navigation" aria-label="Điều hướng chính"><a data-route href="/" ${active === '/' ? 'aria-current="page"' : ''}>Trang chủ</a><a data-route href="/vocabulary" ${active === '/vocabulary' ? 'aria-current="page"' : ''}>Kho từ</a><a data-route href="/dictionary" ${active === '/dictionary' ? 'aria-current="page"' : ''}>Tra từ</a></nav>
    <details class="account-menu"><summary aria-label="Mở khu vực tài khoản"><span class="account-avatar">${user ? e(user.name.charAt(0).toUpperCase()) : '↗'}</span><span class="account-label">${user ? e(user.name.split(' ').at(-1)) : 'Đăng nhập'}</span><span class="chevron">⌄</span></summary>
    <div class="account-panel">${user ? `<p class="eyebrow">TÀI KHOẢN CỦA BẠN</p><strong>${e(user.name)}</strong><span class="muted">${e(user.email)}</span><button class="account-logout">Đăng xuất</button>` : `<p class="eyebrow">BẮT ĐẦU</p><strong>Tạo Kho từ của riêng bạn</strong><p class="muted">Tra cứu miễn phí; đăng nhập để lưu và ôn từ.</p><div class="account-actions"><button class="btn btn-primary" data-auth="login">Đăng nhập</button><button class="btn btn-outline" data-auth="register">Đăng ký</button></div>`}</div></details>
  </div></header>`);
  bindLinks(root, signal);
  root.querySelectorAll<HTMLButtonElement>('[data-auth]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.auth as 'login' | 'register'), { signal }));
  root.querySelector('.account-logout')?.addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); refresh(); toast('Bạn đã đăng xuất.'); }
    catch (error) { toast((error as Error).message, 'error'); }
  }, { signal });
  return root;
}
