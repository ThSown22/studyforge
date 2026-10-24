import { modal } from '../../components/modal.ts';
import { api } from '../../services/api.ts';
import { escapeHtml } from '../../core/dom.ts';

export function showSupportDialog(): void {
  const dialog = modal('Hỗ trợ và góp ý', `
    <div class="support-icon">☏</div><p class="eyebrow">CHÚNG MÌNH LUÔN LẮNG NGHE</p>
    <h2>Hỗ trợ / Góp ý</h2><p class="muted">Một thắc mắc nhỏ hay một ý tưởng mới? Gửi lời nhắn cho StudyForge.</p>
    <form class="support-form">
      <label>Bạn muốn gửi<select name="category"><option value="question">Câu hỏi học tập</option><option value="feedback">Góp ý trải nghiệm</option><option value="bug">Báo lỗi</option></select></label>
      <label>Email liên hệ<input name="email" type="email" maxlength="254" placeholder="Không bắt buộc" /></label>
      <label>Lời nhắn<textarea name="message" required minlength="10" maxlength="2000" rows="4" placeholder="Chia sẻ chi tiết để chúng mình hỗ trợ bạn…"></textarea></label>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary full-width" type="submit">Gửi lời nhắn →</button>
    </form>`, 'support-dialog');
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  form.addEventListener('submit', async event => {
    event.preventDefault(); const button = form.querySelector<HTMLButtonElement>('button')!;
    const errorBox = form.querySelector<HTMLElement>('.form-error')!;
    button.disabled = true; errorBox.hidden = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const result = await api<{ id: string }>('/api/support', { method: 'POST', body: JSON.stringify(data) });
      form.innerHTML = `<div class="success-message" role="status"><span>✓</span><h3>Đã nhận lời nhắn của bạn!</h3><p>Mã ghi nhận: <strong>${escapeHtml(result.id)}</strong></p><p class="muted">Cảm ơn bạn đã cùng xây dựng trải nghiệm học tốt hơn.</p></div>`;
    } catch (error) { errorBox.textContent = (error as Error).message; errorBox.hidden = false; button.disabled = false; }
  });
}
