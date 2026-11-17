import type { VocabularyStats } from '@studyforge/contracts';

const stages = [
  { threshold: 0, label: 'Hạt giống', message: 'Lưu từ đầu tiên để gieo hạt cho khu vườn.' },
  { threshold: 1, label: 'Nảy mầm', message: 'Mầm non đã xuất hiện. Tiếp tục lưu và ôn từ nhé.' },
  { threshold: 10, label: 'Ra lá', message: 'Cây bắt đầu ra lá từ những lần học đều đặn.' },
  { threshold: 30, label: 'Cây non', message: 'Thói quen học đang tạo nên một cây kiến thức khỏe mạnh.' },
  { threshold: 70, label: 'Tươi tốt', message: 'Khu vườn đã tươi tốt nhờ hành trình học bền bỉ của bạn.' },
] as const;

export interface KnowledgeGrowth {
  stage: number;
  label: string;
  message: string;
  points: number;
  progress: number;
  pointsToNext: number | null;
}

export function getKnowledgeGrowth(stats: Pick<VocabularyStats, 'total' | 'known' | 'reviewEvents'>): KnowledgeGrowth {
  const total = Math.max(0, Math.trunc(stats.total));
  const known = Math.max(0, Math.trunc(stats.known));
  const reviews = Math.max(0, Math.trunc(stats.reviewEvents));
  const points = total + (known * 2) + reviews;
  let stage = 0;
  for (let index = stages.length - 1; index >= 0; index--) {
    if (points >= stages[index].threshold) { stage = index; break; }
  }
  const current = stages[stage];
  const next = stages[stage + 1];
  const progress = next
    ? Math.round(((points - current.threshold) / (next.threshold - current.threshold)) * 100)
    : 100;
  return {
    stage,
    label: current.label,
    message: current.message,
    points,
    progress: Math.min(100, Math.max(0, progress)),
    pointsToNext: next ? next.threshold - points : null,
  };
}

function treeArtwork(stage: number): string {
  if (stage === 0) return `
    <ellipse class="tree-shadow" cx="180" cy="242" rx="74" ry="13" />
    <path class="tree-soil" d="M108 235c17-35 127-35 144 0-43 16-101 16-144 0Z" />
    <ellipse class="tree-seed" cx="180" cy="224" rx="13" ry="9" />`;
  if (stage === 1) return `
    <ellipse class="tree-shadow" cx="180" cy="246" rx="76" ry="13" />
    <path class="tree-soil" d="M105 238c20-35 130-35 150 0-45 17-105 17-150 0Z" />
    <path class="tree-trunk" d="M179 226c-2-32-4-68 0-103 2-13 19-12 20 1 2 36-2 72-1 102Z" />
    <path class="tree-leaf" d="M180 151c-36 4-57-11-65-29 28-12 57-5 68 13Z" />
    <path class="tree-leaf tree-leaf-light" d="M196 169c5-34 24-54 43-58 9 29 0 55-19 67Z" />`;
  if (stage === 2) return `
    <ellipse class="tree-shadow" cx="180" cy="248" rx="91" ry="14" />
    <path class="tree-soil" d="M90 239c24-38 156-38 180 0-54 19-126 19-180 0Z" />
    <path class="tree-trunk" d="M165 231c5-48 8-95 4-141l23-2c4 48 1 96 7 143Z" />
    <path class="tree-branch" d="M178 145 132 109M182 127l44-38M180 174l-52 5M187 157l50 15" />
    <ellipse class="tree-leaf" cx="126" cy="105" rx="36" ry="24" transform="rotate(18 126 105)" />
    <ellipse class="tree-leaf tree-leaf-light" cx="226" cy="88" rx="34" ry="24" transform="rotate(-28 226 88)" />
    <ellipse class="tree-leaf tree-leaf-light" cx="123" cy="176" rx="34" ry="22" transform="rotate(-8 123 176)" />
    <ellipse class="tree-leaf" cx="239" cy="171" rx="36" ry="23" transform="rotate(13 239 171)" />
    <ellipse class="tree-leaf" cx="176" cy="91" rx="38" ry="28" />`;
  if (stage === 3) return `
    <ellipse class="tree-shadow" cx="180" cy="250" rx="105" ry="15" />
    <path class="tree-soil" d="M74 241c28-39 184-39 212 0-62 21-150 21-212 0Z" />
    <path class="tree-trunk" d="M157 234c12-55 14-106 9-158l31-2c-5 56-2 108 10 160Z" />
    <path class="tree-branch" d="M178 149 112 98M183 126l61-53M174 176l-70 7M190 164l68 15M182 106l-9-49" />
    <circle class="tree-leaf" cx="106" cy="104" r="45" />
    <circle class="tree-leaf tree-leaf-light" cx="245" cy="88" r="47" />
    <circle class="tree-leaf tree-leaf-light" cx="105" cy="174" r="43" />
    <circle class="tree-leaf" cx="256" cy="169" r="45" />
    <circle class="tree-leaf" cx="174" cy="76" r="51" />
    <circle class="tree-leaf tree-leaf-dark" cx="181" cy="141" r="55" />`;
  return `
    <ellipse class="tree-shadow" cx="180" cy="252" rx="116" ry="16" />
    <path class="tree-soil" d="M62 242c31-42 205-42 236 0-69 23-167 23-236 0Z" />
    <path class="tree-trunk" d="M151 237c16-59 19-116 11-173l39-3c-7 61-2 119 15 176Z" />
    <path class="tree-branch" d="M180 155 94 91M187 128l78-66M173 184 82 17M170 171l-80 16M181 105l-13-62" />
    <circle class="tree-leaf tree-leaf-dark" cx="88" cy="111" r="52" />
    <circle class="tree-leaf" cx="118" cy="62" r="48" />
    <circle class="tree-leaf tree-leaf-light" cx="180" cy="55" r="58" />
    <circle class="tree-leaf" cx="245" cy="64" r="51" />
    <circle class="tree-leaf tree-leaf-dark" cx="278" cy="118" r="49" />
    <circle class="tree-leaf tree-leaf-light" cx="92" cy="177" r="49" />
    <circle class="tree-leaf tree-leaf-dark" cx="169" cy="138" r="69" />
    <circle class="tree-leaf" cx="262" cy="178" r="52" />
    <circle class="tree-fruit" cx="128" cy="125" r="7" /><circle class="tree-fruit" cx="217" cy="101" r="7" />
    <circle class="tree-fruit" cx="248" cy="167" r="7" /><circle class="tree-fruit" cx="173" cy="172" r="7" />`;
}

export function renderKnowledgeTree(stats: Pick<VocabularyStats, 'total' | 'known' | 'reviewEvents'>): string {
  const growth = getKnowledgeGrowth(stats);
  return `<div class="knowledge-tree" data-stage="${growth.stage}">
    <svg viewBox="0 0 360 280" role="img" aria-label="Cây kiến thức: ${growth.label}">${treeArtwork(growth.stage)}</svg>
    <div class="knowledge-tree-caption"><strong>${growth.label}</strong><span>${growth.message}</span></div>
  </div>`;
}
