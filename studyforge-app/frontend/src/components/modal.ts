import { el, escapeHtml } from '../core/dom.ts';

export function modal(title: string, content: string, className = ''): HTMLDialogElement {
  const dialog = el(`<dialog class="modal ${className}" aria-label="${escapeHtml(title)}">
    <button class="modal-close" aria-label="Đóng cửa sổ">×</button>${content}</dialog>`) as HTMLDialogElement;
  const previouslyFocused = document.activeElement as HTMLElement | null;
  dialog.querySelector('.modal-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { dialog.remove(); previouslyFocused?.focus(); }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
