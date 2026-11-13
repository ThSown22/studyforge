import { el, bindLinks } from '../core/dom.ts';

export function renderFooter(signal: AbortSignal): HTMLElement {
  const footer = el(`<footer class="site-footer"><div class="footer-inner">
    <div class="footer-identity"><a href="/" data-route class="footer-brand" aria-label="StudyForge, về trang chủ">StudyForge<span>.</span></a><p>Từ bạn gặp. Kiến thức bạn giữ lại.</p></div>
    <nav class="footer-nav" aria-label="Điều hướng cuối trang"><a href="/" data-route>Trang chủ</a><a href="/vocabulary" data-route>Kho từ</a><a href="/dictionary" data-route>Tra từ</a></nav>
    <p class="footer-copy">© ${new Date().getFullYear()} StudyForge</p>
  </div></footer>`);
  bindLinks(footer, signal);
  return footer;
}
