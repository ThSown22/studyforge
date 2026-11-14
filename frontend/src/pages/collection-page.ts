import type { CollectionSummary, LearningStatus, SavedWordSummary, User } from '../../../packages/contracts/src/index.ts';
import { bindLinks, el, escapeHtml as e, openAuth } from '../core/dom.ts';
import { api } from '../services/api.ts';

const statusLabel: Record<LearningStatus, string> = { new: 'Chưa học', learning: 'Đang học', known: 'Đã nhớ' };

export function renderCollectionPage(user: User | null, collectionId: string, signal: AbortSignal): HTMLElement {
  const root=el(`<div class="page-container v2-page v2-collection-page"><div class="v2-collection-loading panel" role="status">Đang mở bộ sưu tập…</div></div>`);
  if(!user){
    root.innerHTML='<section class="panel v2-access-state"><p class="v2-overline">BỘ SƯU TẬP CÁ NHÂN</p><h1>Đăng nhập để mở bộ từ</h1><p>Danh sách từ và lịch sử ôn tập được lưu riêng cho tài khoản của bạn.</p><button type="button" class="btn btn-primary">Đăng nhập</button><a href="/vocabulary" data-route class="btn btn-outline">← Kho từ</a></section>';
    root.querySelector('button')!.addEventListener('click',()=>openAuth(),{signal});bindLinks(root,signal);return root;
  }
  void Promise.all([
    api<{collections:CollectionSummary[]}>('/api/collections',{signal}),
    api<{words:SavedWordSummary[]}>(`/api/words?collectionId=${encodeURIComponent(collectionId)}`,{signal}),
  ]).then(([collectionData,wordData])=>{
    if(signal.aborted)return;
    const collection=collectionData.collections.find(item=>item.id===collectionId);
    if(!collection){
      root.innerHTML='<section class="panel v2-access-state"><p class="v2-overline">KHÔNG TÌM THẤY</p><h1>Bộ sưu tập không còn tồn tại</h1><p>Bộ này có thể đã bị xóa hoặc không thuộc tài khoản hiện tại.</p><a href="/vocabulary" data-route class="btn btn-primary">Về Kho từ</a></section>';bindLinks(root,signal);return;
    }
    const words=wordData.words;
    const counts:Record<LearningStatus,number>={new:0,learning:0,known:0};
    for(const word of words)counts[word.status]++;
    root.innerHTML=`<div class="v2-page-head v2-collection-page-head"><div><a class="v2-back-link" href="/vocabulary" data-route>← Kho từ</a><p class="v2-overline">BỘ SƯU TẬP CỦA BẠN</p><h1>${e(collection.name)}</h1><p>${collection.description?e(collection.description):'Bộ từ cá nhân để bạn học và ôn theo đúng chủ đề.'}</p></div><div class="v2-collection-page-actions">${words.length?`<a href="/vocabulary/collections/${e(collection.id)}/review" data-route class="btn btn-primary">Ôn tập bộ này →</a>`:'<button class="btn btn-primary" type="button" disabled>Chưa có từ để ôn</button>'}<a href="/dictionary" data-route class="btn btn-outline">＋ Thêm từ</a></div></div>
      <section class="v2-collection-overview"><div class="panel"><span>Tổng số từ</span><strong>${words.length}</strong></div><div class="panel"><span>Chưa học</span><strong>${counts.new}</strong></div><div class="panel"><span>Đang học</span><strong>${counts.learning}</strong></div><div class="panel"><span>Đã nhớ</span><strong>${counts.known}</strong></div></section>
      <section class="panel v2-collection-words"><div class="v2-collection-words-head"><div><h2>Từ trong bộ</h2><p>Mở một từ để tra đầy đủ nghĩa, phiên âm và ví dụ.</p></div><span>${words.length} từ</span></div><div class="v2-collection-word-list">${words.length?words.map((word,index)=>`<a class="v2-collection-word" href="/dictionary?q=${encodeURIComponent(word.term)}" data-route><span class="v2-word-index">${String(index+1).padStart(2,'0')}</span><span><strong>${e(word.term)}</strong><small>Lưu ${new Date(word.savedAt).toLocaleDateString('vi-VN')}</small></span><em class="v2-status">${statusLabel[word.status]}</em><b aria-hidden="true">→</b></a>`).join(''):'<div class="v2-empty-state"><span aria-hidden="true">Aa</span><h3>Bộ sưu tập này chưa có từ</h3><p>Tra hoặc lưu một từ mới vào bộ này trước khi bắt đầu ôn.</p><a class="btn btn-primary" href="/dictionary" data-route>Tra từ mới →</a></div>'}</div></section>`;
    document.title=`${collection.name} — StudyForge`;
    bindLinks(root,signal);
  }).catch(error=>{if(!signal.aborted)root.innerHTML=`<section class="panel v2-access-state"><h1>Chưa mở được bộ sưu tập</h1><p>${e((error as Error).message)}</p><a href="/vocabulary" data-route class="btn btn-primary">Về Kho từ</a></section>`;bindLinks(root,signal);});
  return root;
}
