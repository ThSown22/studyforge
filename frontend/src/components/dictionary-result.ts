import type { DictionaryResult } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e } from '../core/dom.ts';

export function renderDictionaryResult(result: DictionaryResult, onLookup: (term: string) => void): HTMLElement {
  const entries = result.entries;
  const parts = [...new Set(entries.map(entry => entry.partOfSpeech))];
  let currentPart = parts[0] ?? '';
  let language: 'en' | 'vi' = 'en';
  const root = el(`<section class="v2-dictionary-result panel"><p class="v2-overline">KẾT QUẢ TRA CỨU</p>
    <div class="v2-word-heading"><div><h2>${e(result.term)}</h2><p class="v2-ipa">${e(result.pronunciations.map(item=>item.ipa).filter(Boolean).join(' · ') || 'Chưa có phiên âm')}</p></div><button class="v2-audio" type="button" aria-label="Phát âm" ${result.pronunciations.some(item=>item.audioUrl)?'':'disabled'}>◖))</button></div>
    <div class="v2-language" role="group" aria-label="Ngôn ngữ định nghĩa"><button type="button" data-lang="en" aria-pressed="true">EN</button><button type="button" data-lang="vi" aria-pressed="false">VI</button></div>
    <div class="v2-pos-tabs" role="tablist" aria-label="Loại từ"></div><div class="v2-senses"></div><div class="v2-family"></div></section>`);
  const tabs = root.querySelector<HTMLElement>('.v2-pos-tabs')!;
  const senses = root.querySelector<HTMLElement>('.v2-senses')!;
  const family = root.querySelector<HTMLElement>('.v2-family')!;
  function paint() {
    tabs.innerHTML = parts.map(part=>`<button type="button" role="tab" data-pos="${e(part)}" aria-selected="${part===currentPart}">${e(part)}</button>`).join('');
    if (!entries.length) senses.innerHTML = result.suggestions.length ? `<p class="muted">Chưa tìm thấy từ này. Có thể bạn muốn tra: ${result.suggestions.map(term=>`<button type="button" class="v2-inline-term" data-term="${e(term)}">${e(term)}</button>`).join(' ')}</p>` : '<p class="muted">Chưa tìm thấy định nghĩa cho từ này.</p>';
    else {
      const selected = entries.filter(entry=>entry.partOfSpeech===currentPart);
      senses.innerHTML = selected.map(entry=>`<section class="v2-entry" aria-label="${e(entry.partOfSpeech)}">
        ${entry.headword && entry.headword.toLocaleLowerCase('en')!==result.term.toLocaleLowerCase('en') ? `<h3>${e(entry.headword)}</h3>` : ''}
        ${entry.labels.length ? `<p class="v2-labels">${entry.labels.map(e).join(' · ')}</p>` : ''}
        <ol>${entry.senses.map(sense=>`<li><p>${language==='vi' ? e(sense.definitionVi || 'Bản dịch tiếng Việt cho nghĩa này chưa có.') : e(sense.definitionEn)}</p>${sense.labels.length ? `<small>${sense.labels.map(e).join(' · ')}</small>` : ''}${sense.examplesEn.length ? `<ul>${sense.examplesEn.map(example=>`<li>${e(example)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ol></section>`).join('');
    }
    family.innerHTML = result.wordFamily.length ? `<h3>Họ từ</h3><div class="v2-family-list">${result.wordFamily.map(item=>`<button type="button" data-term="${e(item.term)}"><strong>${e(item.term)}</strong><span>${e(item.partOfSpeech || '')}</span></button>`).join('')}</div>` : '';
    root.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===language)));
  }
  root.addEventListener('click', event=>{
    const target = event.target as HTMLElement;
    const pos = target.closest<HTMLButtonElement>('[data-pos]');
    if (pos?.dataset.pos) { currentPart=pos.dataset.pos; paint(); return; }
    const lang = target.closest<HTMLButtonElement>('[data-lang]');
    if (lang?.dataset.lang==='en' || lang?.dataset.lang==='vi') { language=lang.dataset.lang; paint(); return; }
    const term=target.closest<HTMLButtonElement>('[data-term]');
    if (term?.dataset.term) onLookup(term.dataset.term);
  });
  root.querySelector('.v2-audio')?.addEventListener('click',()=>{
    const url=result.pronunciations.find(item=>item.audioUrl)?.audioUrl;
    if (url) void new Audio(url).play();
  });
  paint();
  return root;
}
