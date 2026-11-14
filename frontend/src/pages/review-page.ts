import type { User, SavedWordSummary, DictionaryResult } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e, bindLinks, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';
import { lookupDictionary } from '../services/dictionary-api.ts';
import { renderDictionaryResult } from '../components/dictionary-result.ts';

export function renderReviewPage(user: User | null, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page"><div class="v2-page-head"><div><p class="v2-overline">ÔN TẬP TỪ KHO CỦA BẠN</p><h1>Tự kiểm tra hôm nay</h1><p>Đoán nghĩa trước, xem định nghĩa thật rồi tự đánh giá. Trạng thái ghi nhớ của từ chỉ thay đổi khi bạn chủ động chỉnh trong Kho từ.</p></div><a href="/vocabulary" data-route class="btn btn-outline">← Kho từ</a></div><section class="panel v2-review-card" role="status">Đang tải từ cần ôn…</section></div>`);
  bindLinks(root,signal);
  const card=root.querySelector<HTMLElement>('.v2-review-card')!;
  if(!user){card.innerHTML='<h2>Đăng nhập để ôn từ của bạn</h2><p>Kho từ sẽ được đồng bộ với tài khoản của bạn.</p>';return root;}
  let queue:SavedWordSummary[]=[];let index=0;let started=Date.now();let lookup:DictionaryResult|null=null;
  async function paint(){
    if(index>=queue.length){card.innerHTML='<h2>Đã ôn hết lượt từ hôm nay.</h2><p>Bạn có thể quay lại Kho từ để tự chỉnh trạng thái ghi nhớ.</p><a href="/vocabulary" data-route class="btn btn-primary">Mở Kho từ →</a>';bindLinks(card,signal);return;}
    const word=queue[index];started=Date.now();lookup=null;
    card.innerHTML=`<p class="v2-overline">THẺ ${index+1} / ${queue.length} · ${e(word.collectionName)}</p><h2>${e(word.term)}</h2><p>Hãy thử nhớ nghĩa của từ này trước khi lật thẻ.</p><button type="button" class="btn btn-primary" data-reveal>Xem nghĩa</button><div class="v2-review-answer"></div>`;
    const reveal=card.querySelector<HTMLButtonElement>('[data-reveal]')!;
    reveal.addEventListener('click',async()=>{
      reveal.disabled=true;const answer=card.querySelector<HTMLElement>('.v2-review-answer')!;answer.textContent='Đang tải định nghĩa…';
      try{
        lookup=await lookupDictionary(word.term,'en',signal);
        if(signal.aborted||index>=queue.length||queue[index].id!==word.id)return;
        if(!lookup.entries.length){answer.textContent='Nguồn từ điển chưa có định nghĩa cho từ này. Bạn có thể bỏ qua thẻ.';return;}
        answer.replaceChildren(renderDictionaryResult(lookup,term=>{history.pushState({},'',`/dictionary?q=${encodeURIComponent(term)}`);window.dispatchEvent(new Event('studyforge:navigate'));},()=>lookupDictionary(word.term,'vi',signal)));
        const actions=el('<div class="v2-review-actions"><button type="button" data-correct="false" class="btn btn-outline">Chưa nhớ</button><button type="button" data-correct="true" class="btn btn-primary">Đã nhớ trong lượt này</button></div>');answer.append(actions);
        actions.addEventListener('click',async event=>{
          const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-correct]');if(!button)return;
          actions.querySelectorAll('button').forEach(item=>item.disabled=true);
          try{await api('/api/review/events',{method:'POST',body:JSON.stringify({savedWordId:word.id,correct:button.dataset.correct==='true',durationMs:Math.min(Date.now()-started,3600000)})});index++;await paint();}
          catch(error){toast((error as Error).message,'error');actions.querySelectorAll('button').forEach(item=>item.disabled=false);}
        },{signal});
      }catch(error){answer.textContent=`Chưa thể tải nghĩa: ${(error as Error).message}`;reveal.disabled=false;}
    },{signal});
  }
  void api<{words:SavedWordSummary[]}>('/api/review/queue',{signal}).then(data=>{if(signal.aborted)return;queue=data.words;void paint();}).catch(error=>{if(!signal.aborted)card.textContent=(error as Error).message;});
  return root;
}
