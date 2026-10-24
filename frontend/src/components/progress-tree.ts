import { escapeHtml as e } from '../core/dom.ts';

const stages = ['Hạt giống', 'Nảy mầm', 'Phát triển thân', 'Phân cành', 'Ra lá', 'Kết trái'];
export function treeIllustration(stage: number): string {
  const leaves = Math.min(7, Math.max(0, stage));
  return `<svg viewBox="0 0 430 280" role="img" aria-label="Cây kiến thức StudyForge — ${e(stages[Math.min(stage, 5)])}" class="progress-tree">
    <defs><radialGradient id="sun"><stop stop-color="#ffedb5" stop-opacity=".9"/><stop offset="1" stop-color="#fff8e6" stop-opacity="0"/></radialGradient><linearGradient id="island" x2="0" y2="1"><stop stop-color="#dcf2ed"/><stop offset="1" stop-color="#f3f8f5"/></linearGradient><linearGradient id="seed"><stop stop-color="#bd8b5e"/><stop offset="1" stop-color="#735132"/></linearGradient></defs>
    <circle cx="334" cy="50" r="58" fill="url(#sun)"/><path d="M51 175q18-20 38 0M298 170q18-17 37 0" fill="none" stroke="#b4ebe7" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="218" cy="222" rx="156" ry="24" fill="url(#island)"/><path d="M75 221q125-35 282 0M103 231q22-7 49-2M289 230q18-3 34 1" fill="none" stroke="#a7dbd4" stroke-width="2"/><ellipse cx="218" cy="218" rx="38" ry="9" fill="#dbccb0"/>
    ${stage === 0 ? '<path d="M203 211q3-25 34-29-2 22-34 29" fill="url(#seed)"/><path d="m207 208 25-21" stroke="#e6c3a0" stroke-width="2"/><path d="M224 184q0 10 10 12" stroke="#755132" fill="none"/>' : `<path d="M219 214q-7-46 2-95" stroke="#866a45" stroke-width="7" fill="none" stroke-linecap="round"/>${Array.from({ length: leaves + 1 }, (_, i) => { const x = i % 2 ? 1 : -1; const y = 180 - i * 14; return `<path d="M220 ${y} q${x * 46} -42 ${x * 69} -12 q${-x * 26} 24 ${-x * 69} 12Z" fill="${i % 2 ? '#21b6a7' : '#008b7f'}"/>`; }).join('')}${stage > 3 ? '<circle cx="170" cy="151" r="8" fill="#ff8b72"/><circle cx="269" cy="135" r="9" fill="#ffd17a"/>' : ''}`}
  </svg>`;
}
export function stageSteps(stage: number): string {
  return `<ol class="growth-stages" aria-label="Sáu giai đoạn phát triển">${stages.map((name, i) => `<li class="${i === stage ? 'active' : i < stage ? 'complete' : ''}"><span>${i < stage ? '✓' : String(i + 1).padStart(2, '0')}</span><small>${name}</small></li>`).join('')}</ol>`;
}
