import type { CollectionSummary, DictionaryResult, SavedWordSummary, User } from '../../../packages/contracts/src/index.ts';
import { bindLinks, el, escapeHtml as e, openAuth, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';
import { lookupDictionary } from '../services/dictionary-api.ts';

type Rating = 1 | 2 | 3;

function answerMarkup(result: DictionaryResult, language: 'en' | 'vi'): string {
  const entries=result.entries.filter(entry=>entry.senses.length);
  const senses=entries.flatMap(entry=>entry.senses.map(sense=>({sense,partOfSpeech:entry.partOfSpeech}))).slice(0,3);
  const pronunciation=result.pronunciations.find(item=>item.ipa||item.audioUrl);
  const audio=result.pronunciations.find(item=>item.audioUrl)?.audioUrl??null;
  return `<div class="review-answer-head"><div><span class="review-part-of-speech">${e([...new Set(entries.map(item=>item.partOfSpeech))].slice(0,3).join(' · ')||'từ vựng')}</span>${pronunciation?.ipa?`<span class="review-ipa">/${e(pronunciation.ipa)}/</span>`:''}</div>${audio?`<button type="button" class="review-audio" data-audio="${e(audio)}" aria-label="Phát âm ${e(result.term)}"><span aria-hidden="true">▶</span> Phát âm</button>`:''}</div>
    ${senses.length?`<ol class="review-definitions">${senses.map(({sense,partOfSpeech})=>`<li><small>${e(partOfSpeech)}</small><p>${e(language==='vi'?(sense.definitionVi||sense.definitionEn):sense.definitionEn)}</p>${sense.examplesEn[0]?`<blockquote>${e(sense.examplesEn[0])}</blockquote>`:''}</li>`).join('')}</ol>`:'<p class="review-no-definition">Từ điển chưa trả về định nghĩa cho mục từ này. Bạn vẫn có thể tự đánh giá và tiếp tục phiên ôn.</p>'}`;
}

export function renderReviewPage(user: User | null, collectionId: string, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page v2-review-page"><div class="v2-review-loading panel" role="status">Đang chuẩn bị phiên ôn tập…</div></div>`);
  if(!user){
    root.innerHTML='<section class="panel v2-access-state"><p class="v2-overline">ÔN TẬP CÁ NHÂN</p><h1>Đăng nhập để ôn bộ từ</h1><p>StudyForge cần tài khoản để lấy đúng bộ sưu tập và lưu kết quả tự đánh giá.</p><button type="button" class="btn btn-primary">Đăng nhập</button><a href="/vocabulary" data-route class="btn btn-outline">← Kho từ</a></section>';
    root.querySelector('button')!.addEventListener('click',()=>openAuth(),{signal});bindLinks(root,signal);return root;
  }
  let queue:SavedWordSummary[]=[];
  let index=0;
  let started=Date.now();
  let missed:SavedWordSummary[]=[];
  let ratings:Record<Rating,number>={1:0,2:0,3:0};
  let collection:CollectionSummary|null=null;

  function renderSummary(stage:HTMLElement){
    const remembered=ratings[2]+ratings[3];
    stage.innerHTML=`<section class="panel review-summary"><span class="review-summary-mark" aria-hidden="true">✓</span><p class="v2-overline">HOÀN THÀNH PHIÊN ÔN</p><h2>Bạn đã đi hết ${queue.length} thẻ.</h2><p>Ôn ngắn nhưng đều đặn sẽ giúp cây kiến thức phát triển bền vững hơn.</p><div class="review-summary-grid"><div><strong>${ratings[3]}</strong><span>Đã nhớ</span></div><div><strong>${ratings[2]}</strong><span>Hơi nhớ</span></div><div><strong>${ratings[1]}</strong><span>Chưa nhớ</span></div><div><strong>${remembered}</strong><span>Ghi nhớ tốt</span></div></div><div class="review-summary-actions">${missed.length?'<button type="button" class="btn btn-primary" data-review-missed>Ôn lại từ chưa nhớ</button>':''}<a href="/vocabulary/collections/${e(collectionId)}" data-route class="btn btn-outline">Về bộ sưu tập</a></div></section>`;
    stage.querySelector('[data-review-missed]')?.addEventListener('click',()=>{
      queue=[...missed];missed=[];index=0;ratings={1:0,2:0,3:0};void paint(stage);
    },{signal});bindLinks(stage,signal);
  }

  async function recordRating(word:SavedWordSummary,rating:Rating,stage:HTMLElement,actions:HTMLElement){
    actions.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.disabled=true);
    try{
      await api('/api/review/events',{method:'POST',body:JSON.stringify({savedWordId:word.id,rating,durationMs:Math.min(Date.now()-started,3600000)})});
      ratings[rating]++;
      if(rating===1)missed.push(word);
      index++;await paint(stage);
    }catch(error){toast((error as Error).message,'error');actions.querySelectorAll<HTMLButtonElement>('button').forEach(button=>button.disabled=false);}
  }

  async function paint(stage:HTMLElement){
    if(index>=queue.length){renderSummary(stage);return;}
    const word=queue[index];started=Date.now();
    const progress=Math.round((index/queue.length)*100);
    stage.innerHTML=`<div class="review-session-head"><div><a href="/vocabulary/collections/${e(collectionId)}" data-route class="v2-back-link">← ${e(collection?.name||'Bộ sưu tập')}</a><p class="v2-overline">FLASHCARD · THẺ ${index+1}/${queue.length}</p></div><span>${progress}% hoàn thành</span></div><div class="review-progress" aria-label="Tiến độ ${progress}%"><span style="width:${progress}%"></span></div>
      <article class="panel review-flashcard"><div class="review-card-front"><span class="review-card-label">NHỚ NGHĨA CỦA TỪ NÀY?</span><h1>${e(word.term)}</h1>${word.personalNote?`<p class="review-note">Gợi ý của bạn: ${e(word.personalNote)}</p>`:'<p>Hãy tự trả lời trong đầu trước khi lật thẻ.</p>'}<button type="button" class="btn btn-primary review-reveal" data-reveal>Lật thẻ xem nghĩa</button><button type="button" class="review-skip" data-skip>Bỏ qua thẻ này</button></div><div class="review-card-back" hidden><div class="review-language" role="group" aria-label="Ngôn ngữ định nghĩa"><button type="button" data-language="en" aria-pressed="true">EN</button><button type="button" data-language="vi" aria-pressed="false">VI</button></div><div class="review-answer" role="status"></div><div class="review-rating-copy"><strong>Bạn nhớ từ này đến đâu?</strong><span>Chọn một mức để sang thẻ tiếp theo.</span></div><div class="review-rating-actions"><button type="button" data-rating="1" class="review-rating review-rating-again"><span>1</span><strong>Chưa nhớ</strong><small>Ôn lại cuối phiên</small></button><button type="button" data-rating="2" class="review-rating review-rating-close"><span>2</span><strong>Hơi nhớ</strong><small>Còn hơi phân vân</small></button><button type="button" data-rating="3" class="review-rating review-rating-known"><span>3</span><strong>Đã nhớ</strong><small>Trả lời chắc chắn</small></button></div></div></article>`;
    bindLinks(stage,signal);
    stage.querySelector<HTMLButtonElement>('[data-skip]')!.addEventListener('click',()=>{queue.push(queue.splice(index,1)[0]);void paint(stage);},{signal,once:true});
    stage.querySelector<HTMLButtonElement>('[data-reveal]')!.addEventListener('click',async event=>{
      const reveal=event.currentTarget as HTMLButtonElement;reveal.disabled=true;reveal.textContent='Đang tải nghĩa…';
      try{
        let lookup=await lookupDictionary(word.term,'en',signal);
        if(signal.aborted||queue[index]?.id!==word.id)return;
        const front=stage.querySelector<HTMLElement>('.review-card-front')!;
        const back=stage.querySelector<HTMLElement>('.review-card-back')!;
        const answer=stage.querySelector<HTMLElement>('.review-answer')!;
        front.hidden=true;back.hidden=false;answer.innerHTML=answerMarkup(lookup,'en');
        const bindAudio=()=>answer.querySelector<HTMLButtonElement>('[data-audio]')?.addEventListener('click',event=>{
          const url=(event.currentTarget as HTMLButtonElement).dataset.audio;if(url)void new Audio(url).play().catch(()=>toast('Chưa phát được âm thanh.','error'));
        },{signal});
        bindAudio();
        stage.querySelector('.review-language')!.addEventListener('click',async languageEvent=>{
          const button=(languageEvent.target as HTMLElement).closest<HTMLButtonElement>('[data-language]');
          if(!button||button.getAttribute('aria-pressed')==='true')return;
          const language=button.dataset.language as 'en'|'vi';
          stage.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(item=>item.disabled=true);answer.textContent=language==='vi'?'Đang tải nghĩa tiếng Việt…':'Đang tải nghĩa tiếng Anh…';
          try{if(language==='vi')lookup=await lookupDictionary(word.term,'vi',signal);answer.innerHTML=answerMarkup(lookup,language);bindAudio();stage.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));}
          catch(error){answer.textContent=(error as Error).message;toast((error as Error).message,'error');}
          finally{stage.querySelectorAll<HTMLButtonElement>('[data-language]').forEach(item=>item.disabled=false);}
        },{signal});
        const actions=stage.querySelector<HTMLElement>('.review-rating-actions')!;
        actions.addEventListener('click',event=>{
          const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-rating]');if(!button)return;
          void recordRating(word,Number(button.dataset.rating) as Rating,stage,actions);
        },{signal});
      }catch(error){reveal.disabled=false;reveal.textContent='Thử tải nghĩa lại';toast((error as Error).message,'error');}
    },{signal,once:true});
  }

  void Promise.all([
    api<{collections:CollectionSummary[]}>('/api/collections',{signal}),
    api<{words:SavedWordSummary[]}>(`/api/review/queue?collectionId=${encodeURIComponent(collectionId)}`,{signal}),
  ]).then(([collectionData,queueData])=>{
    if(signal.aborted)return;
    collection=collectionData.collections.find(item=>item.id===collectionId)??null;
    if(!collection){root.innerHTML='<section class="panel v2-access-state"><h1>Không tìm thấy bộ sưu tập</h1><p>Hãy quay lại Kho từ và chọn một bộ đang tồn tại.</p><a href="/vocabulary" data-route class="btn btn-primary">Về Kho từ</a></section>';bindLinks(root,signal);return;}
    queue=queueData.words;
    document.title=`Ôn ${collection.name} — StudyForge`;
    if(!queue.length){root.innerHTML=`<section class="panel v2-access-state"><p class="v2-overline">${e(collection.name)}</p><h1>Chưa có từ để ôn</h1><p>Thêm từ vào bộ này rồi quay lại bắt đầu phiên flashcard.</p><a href="/vocabulary/collections/${e(collectionId)}" data-route class="btn btn-primary">Về bộ sưu tập</a></section>`;bindLinks(root,signal);return;}
    root.innerHTML='<section class="v2-review-stage"></section>';void paint(root.querySelector<HTMLElement>('.v2-review-stage')!);
  }).catch(error=>{if(!signal.aborted){root.innerHTML=`<section class="panel v2-access-state"><h1>Chưa bắt đầu được phiên ôn</h1><p>${e((error as Error).message)}</p><a href="/vocabulary" data-route class="btn btn-primary">Về Kho từ</a></section>`;bindLinks(root,signal);}});
  return root;
}
