import type { User, CollectionSummary, DictionaryResult } from '@studyforge/contracts';
import { el, escapeHtml as e, bindLinks, openAuth, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';
import { lookupDictionary } from '../services/dictionary-api.ts';
import { renderDictionaryResult } from '../components/dictionary-result.ts';

const recent: string[] = [];
export function renderDictionaryPage(user: User | null, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page v2-dictionary-grid"><div class="v2-main-column">
    <section class="panel v2-search-hero"><p class="v2-overline">TRA CỨU VÀ GHI NHỚ TỪ VỰNG</p><h1>Mỗi từ mới là một<br><span>khám phá nhỏ.</span></h1><p>Tra nghĩa tiếng Anh, xem ví dụ và lưu lại những từ bạn muốn học.</p>
      <form class="v2-search-form"><label class="v2-visually-hidden" for="dictionary-term">Từ cần tra</label><input id="dictionary-term" name="term" autocomplete="off" placeholder="Nhập từ hoặc cụm từ tiếng Anh…" required maxlength="255"><button class="btn btn-primary" type="submit">Tra từ →</button></form></section>
    <div class="v2-lookup-state" role="status"></div><div class="v2-result-slot"></div></div>
    <aside class="v2-aside"><section class="v2-tip"><p class="v2-overline">MẸO HỌC TỪ</p><h2>Lưu cả câu, không chỉ một từ.</h2><p>Gặp từ lạ → Tra nghĩa → Lưu vào StudyForge.</p></section><section class="panel v2-recent"><h2>Tra cứu gần đây</h2><div class="v2-recent-list"></div></section><section class="v2-extension-card"><p class="v2-overline">ÔN TẬP HIỆU QUẢ</p><h2>Ôn đúng bộ từ bạn đang học.</h2><p>Mở Kho từ, chọn một bộ sưu tập rồi bắt đầu phiên flashcard riêng.</p><a href="/vocabulary" data-route class="text-link">Chọn bộ để ôn →</a></section></aside></div>`);
  bindLinks(root,signal);
  const form=root.querySelector<HTMLFormElement>('form')!;
  const input=form.elements.namedItem('term') as HTMLInputElement;
  const state=root.querySelector<HTMLElement>('.v2-lookup-state')!;
  const slot=root.querySelector<HTMLElement>('.v2-result-slot')!;
  const recentSlot=root.querySelector<HTMLElement>('.v2-recent-list')!;
  let collections: CollectionSummary[]=[];
  let lookupVersion=0;
  if (user) void api<{ collections: CollectionSummary[] }>('/api/collections',{signal}).then(data=>{collections=data.collections;}).catch(()=>{});
  function paintRecent(){recentSlot.innerHTML=recent.length?recent.map(term=>`<button type="button" data-recent="${e(term)}">${e(term)} ↗</button>`).join(''):'<p class="muted">Chưa có lượt tra nào trong phiên này.</p>';}
  paintRecent();
  recentSlot.addEventListener('click',event=>{const term=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-recent]')?.dataset.recent;if(term)void lookup(term);},{signal});
  async function lookup(term: string){
    const value=term.trim(); if(!value)return;
    input.value=value; const version=++lookupVersion;
    history.replaceState({},'',`/dictionary?q=${encodeURIComponent(value)}`);
    state.textContent='Đang tra từ…'; slot.replaceChildren();
    try {
      const result=await lookupDictionary(value,'en',signal);
      if(signal.aborted||version!==lookupVersion)return;
      state.textContent='';
      const view=renderDictionaryResult(result,next=>void lookup(next),()=>lookupDictionary(result.term,'vi',signal));
      slot.append(view);
      recent.unshift(value); const unique=[...new Set(recent)].slice(0,6);recent.splice(0,recent.length,...unique);paintRecent();
      if(user) {
        if(!collections.length) { try { collections=(await api<{collections:CollectionSummary[]}>('/api/collections',{signal})).collections; } catch { /* Save form reports the issue. */ } }
        const save=el(`<section class="panel v2-save"><h2>Lưu vào kho từ của tôi</h2><p>${result.savedWord ? `Đã lưu trong bộ <strong>${e(result.savedWord.collectionName)}</strong>. Bạn có thể chuyển sang bộ khác.` : 'Chọn một bộ sưu tập để lưu từ.'}</p><form><label>Bộ sưu tập<select name="collectionId" required>${collections.map(item=>`<option value="${e(item.id)}" ${item.id===result.savedWord?.collectionId?'selected':''}>${e(item.name)}</option>`).join('')}</select></label><button class="btn btn-primary" type="submit" ${collections.length?'':'disabled'}>${result.savedWord?'Chuyển bộ':'Lưu từ'}</button></form>${collections.length?'':'<p class="muted">Chưa có bộ sưu tập. Hãy tạo một bộ ở Kho từ trước.</p><a href="/vocabulary" data-route class="text-link">Mở Kho từ →</a>'}</section>`);
        bindLinks(save,signal); slot.append(save);
        save.querySelector('form')?.addEventListener('submit',async event=>{
          event.preventDefault(); const button=save.querySelector<HTMLButtonElement>('button[type=submit]')!;button.disabled=true;
          const collectionId=(save.querySelector('select') as HTMLSelectElement).value;
          try {
            if(result.savedWord){
              const updated=await api<{word:typeof result.savedWord}>(`/api/words/${result.savedWord.id}/collection`,{method:'PATCH',body:JSON.stringify({collectionId})});
              result.savedWord=updated.word;
              toast('Đã chuyển từ sang bộ sưu tập mới.');
            } else {
              const saved=await api<{word:typeof result.savedWord}>('/api/words',{method:'POST',body:JSON.stringify({term:result.term,collectionId})});
              result.savedWord=saved.word;
              toast('Đã lưu từ vào Kho từ.');
            }
            const collection=collections.find(item=>item.id===result.savedWord?.collectionId);
            save.querySelector('p')!.textContent=collection ? 'Đã lưu trong bộ '+collection.name+'. Bạn có thể chuyển sang bộ khác.' : 'Đã lưu từ.';
            button.textContent='Chuyển bộ';button.disabled=false;
          } catch(error){toast((error as Error).message,'error');button.disabled=false;}
        },{signal});
      } else {
        const guest=el('<section class="panel v2-save"><h2>Giữ lại từ bạn muốn học</h2><p>Đăng nhập để lưu từ vào bộ sưu tập của riêng bạn.</p><button class="btn btn-primary" type="button">Đăng nhập</button></section>');
        guest.querySelector('button')!.addEventListener('click',()=>openAuth(),{signal});slot.append(guest);
      }
    }catch(error){if(!signal.aborted&&version===lookupVersion)state.textContent=(error as Error).message;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();void lookup(input.value);},{signal});
  const initial=new URLSearchParams(location.search).get('q');
  if(initial)void lookup(initial);
  return root;
}
