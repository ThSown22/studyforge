import { el, bindLinks } from '../core/dom.ts';
import { showSupportDialog } from '../features/support/support-dialog.ts';

export function renderFooter(signal: AbortSignal): HTMLElement {
  const footer = el(`<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-primary">
        <a href="/" data-route class="footer-brand" aria-label="StudyForge, về trang chủ">StudyForge<span>.</span></a>
        <p>Học ngữ pháp, ghi nhớ từ vựng và tiến bộ từng ngày theo nhịp của bạn.</p>
        <span class="footer-signature">RÈN TRI THỨC · VỮNG TƯƠNG LAI</span>
      </div>
      <nav class="footer-nav" aria-label="Lộ trình học">
        <h2>Khám phá</h2>
        <a href="/roadmap/grammar" data-route>Ngữ pháp CEFR <span>↗</span></a>
        <a href="/roadmap/vocabulary" data-route>Từ vựng theo chủ đề <span>↗</span></a>
      </nav>
      <nav class="footer-nav" aria-label="Tài khoản và hỗ trợ">
        <h2>Đồng hành</h2>
        <a href="/profile" data-route>Hồ sơ học tập <span>↗</span></a>
        <a href="/review" data-route>Ôn câu chưa đúng <span>↗</span></a>
        <button type="button" data-footer-support>Hỗ trợ / Góp ý <span>↗</span></button>
      </nav>
    </div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} StudyForge</span><span>Nội dung học mẫu được biên soạn độc lập cho dự án.</span></div>
  </footer>`);
  bindLinks(footer, signal);
  footer.querySelector('[data-footer-support]')?.addEventListener('click', showSupportDialog, { signal });
  return footer;
}
