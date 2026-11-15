import type { User } from '@studyforge/contracts';
import { modal } from '../../components/modal.ts';
import { api } from '../../services/api.ts';
import { refresh, toast } from '../../core/dom.ts';

export function showAuthDialog(mode: 'login' | 'register' = 'login'): void {
  const register = mode === 'register';
  const dialog = modal(register ? 'Tạo tài khoản StudyForge' : 'Đăng nhập StudyForge', `
    <div class="auth-mark">S<span>✦</span></div>
    <p class="eyebrow">TÀI KHOẢN HỌC TẬP</p>
    <h2>${register ? 'Bắt đầu hành trình của bạn.' : 'Chào bạn trở lại.'}</h2>
    <p class="muted">${register ? 'Tạo tài khoản để lưu tiến độ và nuôi lớn cây kiến thức.' : 'Tiếp tục học, ôn lại và tiến bộ mỗi ngày cùng StudyForge.'}</p>
    <div class="auth-tabs"><button data-mode="login" class="${!register ? 'active' : ''}">Đăng nhập</button><button data-mode="register" class="${register ? 'active' : ''}">Đăng ký</button></div>
    <form class="auth-form">
      ${register ? '<label>Họ và tên<input name="name" autocomplete="name" required minlength="2" maxlength="80" placeholder="Tên của bạn" /></label>' : ''}
      <label>Email<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="ban@example.com" /></label>
      <label>Mật khẩu<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" required ${register ? 'minlength="8"' : ''} maxlength="128" placeholder="${register ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu của bạn'}" /></label>
      ${register ? '<p class="form-hint">Dùng mật khẩu riêng có ít nhất 8 ký tự.</p>' : ''}
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary full-width" type="submit">${register ? 'Tạo tài khoản →' : 'Đăng nhập →'}</button>
    </form>
    <p class="auth-note">${register ? 'Bạn có thể học thử trước khi tạo tài khoản.' : 'Chưa có tài khoản? Chọn Đăng ký để bắt đầu.'}</p>
  `, 'auth-dialog');
  dialog.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
    dialog.close(); showAuthDialog(button.dataset.mode as 'login' | 'register');
  }));
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
    const message = form.querySelector<HTMLElement>('.form-error')!;
    const values = Object.fromEntries(new FormData(form));
    button.disabled = true; message.hidden = true;
    try {
      await api<{ user: User }>(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(values) });
      dialog.close(); refresh(); toast(register ? 'Tài khoản đã sẵn sàng. Bắt đầu học thôi!' : 'Đăng nhập thành công. Chào bạn trở lại!');
    } catch (error) { message.textContent = (error as Error).message; message.hidden = false; }
    finally { button.disabled = false; }
  });
}
