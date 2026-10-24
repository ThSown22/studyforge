import type { Profile, User } from '../../../packages/contracts/src/index.ts';
import { api } from '../services/api.ts';
import { el, escapeHtml, navigate, toast } from '../core/dom.ts';
import { learningError, readableDate } from '../features/learning/ui.ts';

export async function renderProfilePage(signal?: AbortSignal): Promise<HTMLElement> {
  try {
    const profile = await api<Profile>('/api/profile', { signal });
    const root = el(`<section class="learning-profile-page"><div class="learning-heading"><p class="learning-eyebrow">HỒ SƠ HỌC TẬP</p><h1>Mỗi bước tiến đều đáng nhớ.</h1><p>Thông tin cá nhân và hành trình tích lũy kiến thức của bạn trên StudyForge.</p></div><div class="learning-profile-layout"><section class="learning-panel learning-profile-card"><span class="learning-avatar" aria-hidden="true">${escapeHtml(profile.user.name.slice(0, 1).toUpperCase())}</span><h2>${escapeHtml(profile.user.name)}</h2><p>${escapeHtml(profile.user.email)}</p><small>Tham gia từ ${escapeHtml(readableDate(profile.user.createdAt))}</small><form data-profile><label class="learning-text-label">Tên hiển thị<input class="learning-input" name="name" value="${escapeHtml(profile.user.name)}" required minlength="2" maxlength="80" autocomplete="name"></label><p class="learning-profile-feedback" aria-live="polite"></p><button class="learning-btn" type="submit">Lưu thay đổi</button></form></section><div><div class="learning-profile-stats"><article class="learning-panel"><strong>${profile.user.xp}</strong><span>XP tích lũy</span></article><article class="learning-panel"><strong>${profile.stats.completed}</strong><span>Bài đã hoàn thành</span></article><article class="learning-panel"><strong>${profile.stats.attempts}</strong><span>Lượt kiểm tra</span></article></div><section class="learning-panel learning-history"><div class="learning-section-heading"><h2>Lịch sử học tập</h2><button class="learning-link" data-review>Ôn tập (${profile.stats.reviewCount}) →</button></div>${profile.attempts.length ? `<div class="learning-table-wrap"><table class="learning-history-table"><thead><tr><th>Bài học</th><th>Điểm</th><th>Kết quả</th><th>Thời gian</th></tr></thead><tbody>${profile.attempts.map((attempt) => `<tr><td><strong>${escapeHtml(attempt.title)}</strong><small>${attempt.kind === 'challenge' ? 'Kiểm tra vượt cấp' : 'Kiểm tra bài học'}</small></td><td>${attempt.score}%</td><td><span class="learning-badge ${attempt.passed ? 'passed' : ''}">${attempt.passed ? 'Đạt' : 'Cần ôn'}</span></td><td>${escapeHtml(readableDate(attempt.createdAt))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="learning-empty"><h3>Hành trình đang chờ bạn.</h3><p>Hoàn thành bài kiểm tra đầu tiên để xem kết quả tại đây.</p><button class="learning-btn" data-roadmap>Bắt đầu học →</button></div>'}</section></div></div></section>`);
    root.querySelector('[data-review]')?.addEventListener('click', () => navigate('/review'));
    root.querySelector('[data-roadmap]')?.addEventListener('click', () => navigate('/roadmap/grammar'));
    const form = root.querySelector<HTMLFormElement>('[data-profile]')!;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const input = form.elements.namedItem('name') as HTMLInputElement;
      const feedback = form.querySelector<HTMLElement>('.learning-profile-feedback')!;
      const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
      button.disabled = true; button.textContent = 'Đang lưu…'; feedback.textContent = '';
      try {
        const result = await api<{ user: User }>('/api/profile', { method: 'PATCH', body: JSON.stringify({ name: input.value.trim() }), signal });
        const heading = root.querySelector<HTMLElement>('.learning-profile-card h2');
        if (heading) heading.textContent = result.user.name;
        const avatar = root.querySelector<HTMLElement>('.learning-avatar');
        if (avatar) avatar.textContent = result.user.name.slice(0, 1).toUpperCase();
        input.value = result.user.name;
        toast('Đã cập nhật tên hiển thị.', 'success');
        window.dispatchEvent(new CustomEvent('studyforge:user-updated', { detail: { user: result.user } }));
      } catch (cause) { feedback.textContent = cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ.'; feedback.classList.add('error'); }
      finally { button.disabled = false; button.textContent = 'Lưu thay đổi'; }
    });
    return root;
  } catch (error) { return learningError(error, 'Đăng nhập để xem hồ sơ học tập'); }
}
