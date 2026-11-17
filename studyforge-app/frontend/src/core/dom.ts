export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
export function el(html: string): HTMLElement {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const element = template.content.firstElementChild;
  if (!(element instanceof HTMLElement)) throw new Error('A component must have one HTML root.');
  return element;
}
export function navigate(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//')) return;
  if (location.pathname + location.search !== path) history.pushState({}, '', path);
  window.dispatchEvent(new Event('studyforge:navigate'));
}
export function refresh(): void { window.dispatchEvent(new Event('studyforge:refresh')); }
export function toast(message: string, type: 'success' | 'error' = 'success'): void {
  const region = document.getElementById('toast-region')!;
  const item = el(`<div class="toast toast-${type}">${escapeHtml(message)}</div>`);
  region.append(item);
  setTimeout(() => item.remove(), 5000);
}
export function openAuth(mode: 'login' | 'register' = 'login'): void {
  window.dispatchEvent(new CustomEvent('studyforge:auth', { detail: { mode } }));
}
export function bindLinks(root: HTMLElement, signal?: AbortSignal): void {
  root.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('a[data-route]');
    if (!link || (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey || (event as MouseEvent).shiftKey) return;
    event.preventDefault();
    navigate(link.getAttribute('href') || '/');
  }, { signal });
}
export const number = (value: number): string => value.toLocaleString('vi-VN');
