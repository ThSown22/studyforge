import type { User, CollectionSummary, SavedWordSummary, VocabularyStats, DictionaryResult, LearningStatus } from '../../../packages/contracts/src/index.ts';
import { el, escapeHtml as e, bindLinks, openAuth, toast } from '../core/dom.ts';
import { api } from '../services/api.ts';
import { renderDictionaryResult } from '../components/dictionary-result.ts';

const statusLabel: Record<LearningStatus,string>={new:'Chưa học',learning:'Đang học',known:'Đã nhớ'};
export function renderVocabularyPage(user: User | null, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page"><div class="v2-page-head"><div><p class="v2-overline">THƯ VIỆN CỦA RIÊNG BẠN</p><h1>Kho từ vựng của tôi</h1><p>Những từ bạn gặp, chọn lưu và học theo nhịp riêng.</p></div><a class="btn btn-primary" data-route href="/dictionary">＋ Thêm từ mới</a></div>
    <div class="v2-stats"></div><section class="panel v2-vault"><div class="v2-vault-head"><div><h2>Thư viện của bạn</h2><p class="muted">Tìm, sắp xếp và tự đánh dấu mức độ ghi nhớ.</p></div><div class="v2-vault-actions"><button type="button" class="btn btn-outline" data-add-word>＋ Lưu từ thủ công</button><a href="/vocabulary/review" data-route class="btn btn-outline">Ôn tập từ hôm nay →</a></div></div>
    <div class="v2-tabs" role="group" aria-label="Lọc từ"><button type="button" data-status="all">Tất cả</button><button type="button" data-status="new">Chưa học</button><button type="button" data-status="learning">Đang học</button><button type="button" data-status="known">Đã nhớ</button></div>
    <div class="v2-toolbar"><label><span>Tìm từ</span><input type="search" name="q" placeholder="Tìm từ đã lưu…"></label><label><span>Bộ sưu tập</span><select name="collection"><option value="">Tất cả bộ sưu tập</option></select></label></div>
    <div class="v2-collection-section"><div class="v2-collection-bar"><div><h3>Bộ sưu tập</h3><p>Nhóm từ theo chủ đề bạn muốn học.</p></div><button type="button" class="btn btn-soft" data-create>＋ Tạo bộ</button></div><div class="v2-collections"></div></div>
    <div class="v2-vault-grid"><div class="v2-word-list" role="status">Đang tải Kho từ…</div><aside class="v2-word-detail"><div class="v2-detail-empty"><span aria-hidden="true">Aa</span><h3>Chọn một từ</h3><p>Nhấp vào một từ trong danh sách để xem nghĩa và cập nhật trạng thái.</p></div></aside></div></section></div>`);
  bindLinks(root,signal);
  const listSlot=root.querySelector<HTMLElement>('.v2-word-list')!;
  const detailSlot=root.querySelector<HTMLElement>('.v2-word-detail')!;
  const statsSlot=root.querySelector<HTMLElement>('.v2-stats')!;
  const collectionSlot=root.querySelector<HTMLElement>('.v2-collections')!;
  const collectionSelect=root.querySelector<HTMLSelectElement>('select[name=collection]')!;
  const search=root.querySelector<HTMLInputElement>('input[name=q]')!;
  let collections:CollectionSummary[]=[];let words:SavedWordSummary[]=[];let status:'all'|LearningStatus='all';let selected:string|null=null;
  if(!user){listSlot.innerHTML='<div class="v2-empty-state"><span aria-hidden="true">Aa</span><h3>Kho từ của bạn đang chờ</h3><p>Đăng nhập để tạo bộ sưu tập, lưu từ và đồng bộ tiến độ học.</p><button class="btn btn-primary" type="button">Đăng nhập</button></div>';listSlot.querySelector('button')!.addEventListener('click',()=>openAuth(),{signal});return root;}
  const userId=user.id;
  async function load(){
    try{
      const [collectionData,wordData,statsData]=await Promise.all([
        api<{collections:CollectionSummary[]}>('/api/collections',{signal}),
        api<{words:SavedWordSummary[]}>('/api/words',{signal}),
        api<{stats:VocabularyStats}>('/api/words/stats',{signal})]);
      if(signal.aborted)return;
      collections=collectionData.collections;words=wordData.words;
      const stats=statsData.stats;
      statsSlot.innerHTML=[['Tổng từ đã lưu',stats.total],['Chưa học',stats.new],['Đang học',stats.learning],['Đã nhớ',stats.known]].map(([label,value])=>`<div class="panel v2-stat"><span>${e(label)}</span><strong>${e(value)}</strong></div>`).join('');
      collectionSelect.innerHTML='<option value="">Tất cả bộ sưu tập</option>'+collections.map(item=>`<option value="${e(item.id)}">${e(item.name)}</option>`).join('');
      collectionSlot.innerHTML=collections.length?collections.map(item=>`<article class="v2-collection-tile"><div class="v2-collection-heading"><strong>${e(item.name)}</strong><small>${item.wordCount} từ</small></div>${item.description?`<p>${e(item.description)}</p>`:'<p class="v2-collection-no-description">Chưa có mô tả</p>'}<details class="v2-collection-menu"><summary aria-label="Thao tác với bộ ${e(item.name)}" title="Thao tác">⋯</summary><div class="v2-collection-menu-popover" role="menu"><button type="button" role="menuitem" data-rename="${e(item.id)}">Đổi tên</button><button type="button" role="menuitem" class="danger" data-delete="${e(item.id)}">Xóa bộ</button></div></details></article>`).join(''):'<div class="v2-collection-empty"><p>Chưa có bộ sưu tập.</p><span>Tạo bộ đầu tiên để bắt đầu lưu từ.</span></div>';
      paintList();
    }catch(error){if(!signal.aborted)listSlot.textContent=(error as Error).message;}
  }
  function paintList(){
    const q=search.value.trim().toLocaleLowerCase('en');
    const visible=words.filter(word=>(status==='all'||word.status===status)&&(!collectionSelect.value||word.collectionId===collectionSelect.value)&&(!q||word.term.toLocaleLowerCase('en').includes(q)));
    root.querySelectorAll<HTMLButtonElement>('[data-status]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.status===status)));
    listSlot.innerHTML=visible.length?visible.map(word=>`<button class="v2-word-row" type="button" data-word="${e(word.id)}" aria-current="${word.id===selected}"><span><strong>${e(word.term)}</strong><small>${e(word.collectionName)}</small></span><em class="v2-status">${statusLabel[word.status]}</em></button>`).join(''):`<div class="v2-empty-state"><span aria-hidden="true">Aa</span><h3>${words.length?'Không tìm thấy từ phù hợp':'Kho từ đang trống'}</h3><p>${words.length?'Thử đổi từ khóa, trạng thái hoặc bộ sưu tập.':'Tra một từ mới rồi lưu vào bộ sưu tập bạn muốn học.'}</p><a class="btn btn-primary" href="/dictionary" data-route>Tra từ mới →</a></div>`;
    if(selected&&!visible.some(word=>word.id===selected)){selected=null;detailSlot.innerHTML='<div class="v2-detail-empty"><span aria-hidden="true">Aa</span><h3>Chọn một từ</h3><p>Nhấp vào một từ trong danh sách để xem nghĩa và cập nhật trạng thái.</p></div>';}
  }
  async function showWord(word:SavedWordSummary){
    selected=word.id;paintList();
    detailSlot.innerHTML=`<div class="v2-detail-header"><p class="v2-overline">CHI TIẾT TỪ VỰNG</p><span class="v2-status">${statusLabel[word.status]}</span></div><h2>${e(word.term)}</h2>
      <div class="v2-detail-controls"><label>Trạng thái<select name="status">${Object.entries(statusLabel).map(([value,label])=>`<option value="${value}" ${word.status===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Bộ sưu tập<select name="move">${collections.map(item=>`<option value="${e(item.id)}" ${word.collectionId===item.id?'selected':''}>${e(item.name)}</option>`).join('')}</select></label></div><div class="v2-detail-definition" role="status">Đang tải nghĩa của từ…</div>`;
    const statusInput=detailSlot.querySelector<HTMLSelectElement>('select[name=status]')!;
    const moveInput=detailSlot.querySelector<HTMLSelectElement>('select[name=move]')!;
    statusInput.addEventListener('change',async()=>{
      try{
        const {word:updated}=await api<{word:SavedWordSummary}>(`/api/words/${word.id}/status`,{method:'PATCH',body:JSON.stringify({status:statusInput.value})});
        word.status=updated.status;
        detailSlot.querySelector<HTMLElement>('.v2-detail-header .v2-status')!.textContent=statusLabel[updated.status];
        toast('Đã cập nhật trạng thái.');await load();
      }
      catch(error){toast((error as Error).message,'error');statusInput.value=word.status;}
    },{signal});
    moveInput.addEventListener('change',async()=>{
      try{
        const {word:updated}=await api<{word:SavedWordSummary}>(`/api/words/${word.id}/collection`,{method:'PATCH',body:JSON.stringify({collectionId:moveInput.value})});
        word.collectionId=updated.collectionId;word.collectionName=updated.collectionName;
        toast('Đã chuyển bộ sưu tập.');await load();
      }
      catch(error){toast((error as Error).message,'error');moveInput.value=word.collectionId;}
    },{signal});
    try{
      const result=await api<DictionaryResult>(`/api/dictionary/${encodeURIComponent(word.term)}`,{signal});
      if(signal.aborted||selected!==word.id)return;
      const slot=detailSlot.querySelector<HTMLElement>('.v2-detail-definition')!;
      slot.replaceChildren(renderDictionaryResult(result,term=>{history.pushState({},'',`/dictionary?q=${encodeURIComponent(term)}`);window.dispatchEvent(new Event('studyforge:navigate'));}));
    }catch(error){if(!signal.aborted&&selected===word.id)detailSlot.querySelector<HTMLElement>('.v2-detail-definition')!.textContent=`Chưa tải được nghĩa: ${(error as Error).message}`;}
  }
  root.querySelector('.v2-tabs')!.addEventListener('click',event=>{const value=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-status]')?.dataset.status;if(value&&['all','new','learning','known'].includes(value)){status=value as typeof status;paintList();}},{signal});
  listSlot.addEventListener('click',event=>{const id=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-word]')?.dataset.word;const word=words.find(item=>item.id===id);if(word)void showWord(word);},{signal});
  collectionSelect.addEventListener('change',paintList,{signal});search.addEventListener('input',paintList,{signal});
  root.querySelector('[data-add-word]')!.addEventListener('click',()=>{
    if(!collections.length){toast('Hãy tạo một bộ sưu tập trước.','error');return;}
    root.querySelector('.v2-manual-save')?.remove();
    const form=el(`<form class="v2-inline-form v2-manual-save"><label>Từ cần lưu<input name="term" required maxlength="255" placeholder="Từ hoặc cụm từ tiếng Anh"></label><label>Bộ sưu tập<select name="collectionId" required>${collections.map(item=>`<option value="${e(item.id)}">${e(item.name)}</option>`).join('')}</select></label><div class="v2-form-actions"><button class="btn btn-primary" type="submit">Lưu từ</button><button class="btn btn-ghost" type="button" data-cancel>Hủy</button></div></form>`);
    root.querySelector('.v2-vault-head')!.after(form);
    form.querySelector('[data-cancel]')!.addEventListener('click',()=>form.remove());
    form.addEventListener('submit',async event=>{
      event.preventDefault();const values=Object.fromEntries(new FormData(form as HTMLFormElement));
      try{const result=await api<{created:boolean}>('/api/words',{method:'POST',body:JSON.stringify(values)});toast(result.created?'Đã lưu từ vào Kho từ.':'Từ này đã có trong Kho từ.');form.remove();await load();}
      catch(error){toast((error as Error).message,'error');}
    });
    form.querySelector('input')?.focus();
  },{signal});  root.querySelector('[data-create]')!.addEventListener('click',()=>{
    const panel=el('<form class="v2-inline-form v2-collection-form"><label>Tên bộ sưu tập<input name="name" required maxlength="100" placeholder="Ví dụ: IT & DevOps"></label><label>Mô tả (không bắt buộc)<input name="description" maxlength="1000" placeholder="Ghi chú ngắn về bộ từ"></label><div class="v2-form-actions"><button class="btn btn-primary" type="submit">Tạo bộ</button><button class="btn btn-ghost" type="button" data-cancel>Hủy</button></div></form>');
    root.querySelector('.v2-collection-bar')!.after(panel);panel.querySelector('[data-cancel]')!.addEventListener('click',()=>panel.remove());
    panel.addEventListener('submit',async event=>{event.preventDefault();const form=panel as HTMLFormElement;const values=Object.fromEntries(new FormData(form));try{await api('/api/collections',{method:'POST',body:JSON.stringify(values)});panel.remove();toast('Đã tạo bộ sưu tập.');await load();}catch(error){toast((error as Error).message,'error');}});
    panel.querySelector('input')?.focus();
  },{signal});
  collectionSlot.addEventListener('click',async event=>{
    const target=event.target as HTMLElement;
    const rename=target.closest<HTMLButtonElement>('[data-rename]')?.dataset.rename;
    const remove=target.closest<HTMLButtonElement>('[data-delete]')?.dataset.delete;
    const item=collections.find(collection=>collection.id===(rename||remove));if(!item)return;
    if(rename){
      const name=window.prompt('Tên mới cho bộ sưu tập',item.name);if(name===null||name.trim()===item.name)return;
      try{await api(`/api/collections/${item.id}`,{method:'PATCH',body:JSON.stringify({name,description:item.description})});toast('Đã đổi tên bộ.');await load();}catch(error){toast((error as Error).message,'error');}
    } else if(remove){
      if(!window.confirm(`Xóa bộ “${item.name}”? Bộ có từ sẽ không thể xóa.`))return;
      try{await api(`/api/collections/${item.id}`,{method:'DELETE'});toast('Đã xóa bộ.');await load();}catch(error){toast((error as Error).message,'error');}
    }
  },{signal});
  void load();
  return root;
}
