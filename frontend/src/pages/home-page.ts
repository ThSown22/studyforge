import type { Catalog, Dashboard } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e, bindLinks, number, navigate } from '../core/dom.ts';
import { api } from '../services/api.ts';
import { treeIllustration, stageSteps } from '../components/progress-tree.ts';

export async function renderHomePage(signal: AbortSignal): Promise<HTMLElement> {
  const [catalog, progress] = await Promise.all([api<Catalog>('/api/catalog', { signal }), api<Dashboard>('/api/dashboard', { signal })]);
  const next = progress.nextLesson || catalog.lessons.find(lesson => !lesson.locked);
  const unit = catalog.units.find(item => item.id === next?.unitId);
  const root = el(`<div class="home-page page-container">
    <section class="hero panel">
      <div class="hero-copy"><h1>Học theo từng chặng,<br><em>vững vàng từng ngày.</em></h1>
        <p>Ngữ pháp và từ vựng nằm trong hai lộ trình riêng. Học kiến thức, luyện ghi nhớ và kiểm tra — từng bước nhỏ làm nên tiến bộ lớn.</p>
        <div class="hero-actions"><a class="btn btn-primary" href="/roadmap/grammar" data-route>Học ngữ pháp <span>→</span></a><a class="btn btn-outline" href="/roadmap/vocabulary" data-route>Học từ vựng</a></div>
      </div>
      <button class="next-lesson-card" data-next aria-label="Mở bài học tiếp theo: ${e(next?.title || 'Khám phá lộ trình')}">
        <span class="card-ring"></span><span class="next-head"><span class="level-chip">${e(next?.track === 'grammar' ? unit?.title || 'A1' : '01')}</span><span><small>BÀI HỌC TIẾP THEO</small><b>Lộ trình ${next?.track === 'vocabulary' ? 'từ vựng' : 'ngữ pháp'}</b></span><i>↗</i></span>
        <strong class="next-title">${e(next?.title || 'Bắt đầu hành trình')}</strong>
        <span class="next-steps"><span class="current"><b>01</b><span><small>ĐANG HỌC</small><strong>Học kiến thức</strong></span></span><i>--○--</i><span><b>02</b><span><small>TIẾP THEO</small><strong>Kiểm tra</strong></span></span></span>
        <span class="progress-track next-progress"><span style="width:${progress.percent}%"></span></span><small class="next-count">${progress.completedLessons}/${progress.totalLessons} bài đã hoàn thành</small>
      </button>
    </section>
    <section class="growth-section panel" aria-label="Cây tiến độ học tập">
      <div class="growth-copy"><h2>${e(progress.stage.name)}</h2><p class="muted">Mỗi bài hoàn thành bổ sung XP cho cây. Kiến thức lớn dần cùng những nỗ lực nhỏ của bạn mỗi ngày.</p>
        <div class="growth-meter"><div class="meter-heading"><strong>${progress.stage.nextName ? `Còn ${number(progress.stage.remaining)} XP để đạt ${e(progress.stage.nextName)}` : 'Cây kiến thức của bạn đã kết trái!'}</strong><span>${Math.round(progress.stage.percent)}%</span></div>
          <div class="progress-track"><span style="width:${progress.stage.percent}%"></span></div>${stageSteps(progress.stage.index)}</div>
      </div>
      <div class="tree-scene">${treeIllustration(progress.stage.index)}<span class="tree-stage-tag">${progress.stage.index + 1} GIAI ĐOẠN</span><div class="tree-total"><div class="progress-track"><span style="width:${progress.percent}%"></span></div><strong>${progress.percent}% TOÀN KHOÁ HỌC</strong></div></div>
    </section>
    <section class="choose-section"><div class="section-heading"><h2>Chọn nội dung học</h2><span>Hai lộ trình. Một hành trình tiến bộ.</span></div>
      <div class="course-grid"><a href="/roadmap/grammar" data-route class="course-card panel"><div class="course-art grammar-art"><span>A1 → C2</span><div class="sentence-parts"><div><small>Chủ ngữ</small><strong>She</strong><b>S</b></div><i>+</i><div><small>Động từ</small><strong>learns</strong><b>V</b></div><i>+</i><div><small>Bổ ngữ</small><strong>English</strong><b>O</b></div></div></div><div class="course-copy"><h3>Ngữ pháp theo bậc CEFR</h3><p>${catalog.stats.grammarLessons} bài học trong sáu bậc A1 đến C2. Xây nền tảng vững vàng, diễn đạt tự nhiên và tự tin hơn.</p><div><strong>${progress.grammarCompleted}/${catalog.stats.grammarLessons} bài đã hoàn thành</strong><b>→</b></div></div></a>
      <a href="/roadmap/vocabulary" data-route class="course-card panel"><div class="course-art vocab-art"><span>${catalog.units.filter(u => u.track === 'vocabulary').length} CHỦ ĐỀ</span><div class="word-sample"><small>Ngữ cảnh</small><strong>learn by doing</strong><div><span>Nghĩa<br><b>học</b></span><span>Động từ<br><b>learn</b> /lɜːn/</span></div></div></div><div class="course-copy"><h3>Từ vựng theo chủ đề</h3><p>${number(catalog.stats.wordCount)} thẻ từ trong ${catalog.units.filter(u => u.track === 'vocabulary').length} chủ đề quen thuộc. Học bằng thẻ lật, kiểm tra và ôn lại câu chưa đúng.</p><div><strong>${progress.vocabularyCompleted}/${catalog.stats.vocabularyLessons} bài đã hoàn thành</strong><b>→</b></div></div></a></div>
    </section>
    ${progress.user ? `<section class="review-banner panel"><div><p class="eyebrow">MỘT CHÚT ÔN TẬP, MỘT BƯỚC TIẾN XA</p><h3>Biến câu chưa đúng thành điều đã nhớ.</h3></div><a href="/review" data-route class="btn btn-primary">Ôn tập của tôi ↺</a></section>` : `<div class="guest-note"><span>✦</span><p>Bạn đang học thử. <button data-register>Tạo tài khoản miễn phí</button> để lưu tiến độ và mở bài tiếp theo.</p></div>`}
    <p class="sample-note">Nội dung học mẫu do StudyForge biên soạn độc lập · Tiến độ được tính trên ${progress.totalLessons} bài hiện có.</p>
  </div>`);
  bindLinks(root, signal);
  root.querySelector('[data-next]')!.addEventListener('click', () => navigate(`/roadmap/${next?.track || 'grammar'}${unit ? `?unit=${encodeURIComponent(unit.id)}` : ''}`), { signal });
  root.querySelector('[data-register]')?.addEventListener('click', () => window.dispatchEvent(new CustomEvent('studyforge:auth', { detail: { mode: 'register' } })), { signal });
  return root;
}
