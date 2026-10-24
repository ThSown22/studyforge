import type { LessonSummary } from '../../../packages/contracts/src/index.ts';
import { escapeHtml as e, navigate } from '../core/dom.ts';
import { modal } from './modal.ts';

export function showLessonDialog(lesson: LessonSummary, unitTitle: string): void {
  const dialog = modal(lesson.title, `<div class="lesson-dialog-head"><div class="lesson-number">${String(lesson.position).padStart(2, '0')}</div><div><p class="eyebrow">${e(unitTitle)} · ${lesson.track === 'grammar' ? 'NGỮ PHÁP' : 'TỪ VỰNG'}</p><h2>${e(lesson.title)}</h2></div></div>
    <div class="lesson-stages"><article><b>01</b><div><small>Giai đoạn 1</small><strong>Phần học</strong><span>${lesson.track === 'grammar' ? `${lesson.sectionCount} phần kiến thức` : `${lesson.cardCount} thẻ từ`}</span></div></article><article><b>02</b><div><small>Giai đoạn 2</small><strong>Bài kiểm tra</strong><span>${lesson.questionCount} câu · Mốc đạt 80%</span></div></article></div>
    <div class="lesson-status"><strong>${lesson.completed ? `Đã hoàn thành · ${lesson.bestScore}%` : lesson.learned ? 'Sẵn sàng kiểm tra' : 'Chưa làm bài'}</strong><p class="muted">Học kiến thức trước, sau đó kiểm tra để nhận ${lesson.xp} XP và mở bài tiếp theo.</p></div>
    <div class="dialog-actions"><button class="btn btn-outline" data-close>Đóng</button><button class="btn btn-primary" data-start>${lesson.completed ? 'Học lại' : 'Bắt đầu học'} →</button></div>`, 'lesson-dialog');
  dialog.querySelector('[data-close]')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-start]')!.addEventListener('click', () => { dialog.close(); navigate(`/lesson/${encodeURIComponent(lesson.id)}`); });
}
