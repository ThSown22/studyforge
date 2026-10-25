import { el, bindLinks } from '../core/dom.ts';

export function renderFooter(signal: AbortSignal): HTMLElement {
  const footer = el(`<footer class="site-footer"><div class="footer-inner">
    <div class="footer-primary"><a href="/" data-route class="footer-brand" aria-label="StudyForge, về trang chủ">StudyForge<span>.</span></a><p>Từ bạn gặp. Kiến thức bạn giữ lại.</p><span class="footer-signature">RÈN TRÍ THỨC · VỮNG TƯƠNG LAI</span></div>
    <nav class="footer-nav" aria-label="Khám phá"><h2>Khám phá</h2><a href="/" data-route>Trang chủ <span>↗</span></a><a href="/vocabulary" data-route>Kho từ <span>↗</span></a><a href="/dictionary" data-route>Tra từ <span>↗</span></a></nav>
    <div class="footer-nav"><h2>StudyForge V2</h2><p>Học từ những gì bạn thật sự gặp, theo nhịp của riêng bạn.</p><p>Nội dung từ điển được truy vấn từ dịch vụ bên ngoài khi đã cấu hình.</p></div>
  </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} StudyForge</span><span>Ứng dụng học từ vựng cá nhân</span></div></footer>`);
  bindLinks(footer, signal);
  return footer;
}
