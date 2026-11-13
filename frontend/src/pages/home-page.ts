import type { User, VocabularyStats } from '../../../packages/contracts/src/index.ts';
import { el, bindLinks } from '../core/dom.ts';
import { api } from '../services/api.ts';

export function renderHomePage(user: User | null, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page"><section class="panel v2-home-hero"><div><p class="v2-overline">BẮT ĐẦU TỪ NHỮNG TỪ BẠN THẬT SỰ GẶP</p><h1>Gặp từ mới hôm nay,<br><span>nhớ thật lâu mai sau.</span></h1><p>Tra từ bằng tiếng Anh, giữ lại trong bộ sưu tập và ôn theo nhịp của bạn. Kho từ lớn lên từ những gì bạn thật sự đọc mỗi ngày.</p><div class="v2-hero-actions"><a class="btn btn-primary" href="/dictionary" data-route>Tra từ mới →</a><a class="btn btn-outline" href="/vocabulary" data-route>Mở Kho từ</a></div></div><div class="v2-hero-art" aria-hidden="true"><small>● HỌC THEO CÁCH CỦA BẠN</small><strong>figure out</strong><p>Gặp từ → Hiểu nghĩa → Lưu lại</p><span>Kho từ của riêng bạn ↗</span></div></section>
    <section class="panel v2-garden"><div><p class="v2-overline">HÀNH TRÌNH CỦA BẠN</p><h2>Vườn từ đang lớn lên</h2><p>Mỗi từ bạn tự chọn là một hạt giống kiến thức mới.</p><div class="v2-garden-meter"><strong class="v2-garden-count">${user?'Đang tải tiến độ…':'Đăng nhập để xem tiến độ của bạn.'}</strong><div class="v2-meter"><span></span></div><small>Hạt giống · Nảy mầm · Ra lá · Phát triển · Tươi tốt</small></div></div><div class="v2-sprout" aria-hidden="true"><span></span></div></section>
    <section class="v2-features"><div class="v2-section-head"><p class="v2-overline">CÁCH HỌC CỦA BẠN</p><h2>Học từ những gì bạn chọn</h2></div><div class="v2-feature-grid"><a class="panel v2-feature" href="/vocabulary" data-route><div class="v2-feature-art v2-feature-green"><span>resilient</span><span>figure out</span><span>reliable</span></div><h3>Thư viện từ vựng cá nhân</h3><p>Sắp xếp từ theo bộ sưu tập và theo dõi mức độ ghi nhớ.</p><strong>Khám phá Kho từ →</strong></a><a class="panel v2-feature" href="/vocabulary/review" data-route><div class="v2-feature-art v2-feature-sand"><span>ÔN TẬP HÔM NAY</span><span>Tự đánh giá</span></div><h3>Ôn tập theo nhịp của bạn</h3><p>Lật thẻ, xem nghĩa và ghi lại lượt tự đánh giá mà không tự đổi trạng thái từ.</p><strong>Bắt đầu ôn →</strong></a></div></section>
    <section class="panel v2-bottom-cta"><div><p class="v2-overline">BÔI ĐEN · TRA NGHĨA · LƯU LẠI</p><h2>Từ gặp hôm nay có thể là từ bạn nhớ mãi.</h2><p>Chrome Extension đang được phát triển; hiện bạn có thể tra và lưu từ trực tiếp trên web.</p></div><a class="btn btn-primary" href="/dictionary" data-route>Tra từ trên web →</a></section></div>`);
  bindLinks(root,signal);
  if(user) void api<{stats:VocabularyStats}>('/api/words/stats',{signal}).then(({stats})=>{
    if(signal.aborted)return;
    root.querySelector('.v2-garden-count')!.textContent=`Bạn đã lưu ${stats.total} từ · ${stats.known} từ đã nhớ`;
    const progress=stats.total ? Math.round(stats.known/stats.total*100) : 0;
    (root.querySelector('.v2-meter span') as HTMLElement).style.width=`${progress}%`;
  }).catch(()=>{if(!signal.aborted)root.querySelector('.v2-garden-count')!.textContent='Chưa tải được tiến độ. Thử mở Kho từ để kiểm tra.';});
  return root;
}
