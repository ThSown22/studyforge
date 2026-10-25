import { el, bindLinks } from './core/dom.ts';
import { api } from './services/api.ts';
import { renderHeader } from './layouts/header.ts';
import { renderFooter } from './layouts/footer.ts';
import { renderV2HomePage } from './pages/v2-home-page.ts';
import { renderVocabularyPage } from './pages/vocabulary-page.ts';
import { renderDictionaryPage } from './pages/dictionary-page.ts';
import { renderReviewPage } from './pages/review-v2-page.ts';
import { showAuthDialog } from './features/auth/auth-dialog.ts';
import type { User } from '../../packages/contracts/src/index.ts';

const app=document.getElementById('app')!;
let current=new AbortController();
let version=0;
let user:User|null=null;
async function render(scroll=true){
  current.abort();current=new AbortController();const signal=current.signal;const turn=++version;
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog=>dialog.close());
  const shell=el('<div class="app-shell"><main id="page-content" tabindex="-1"><div class="page-loading" role="status">Đang mở StudyForge…</div></main></div>');
  shell.prepend(renderHeader(user,location.pathname,signal));shell.append(renderFooter(signal));app.replaceChildren(shell);
  if(scroll)window.scrollTo({top:0});
  const main=shell.querySelector('main')!;
  try{
    user=(await api<{user:User|null}>('/api/auth/me',{signal})).user;
    if(signal.aborted||turn!==version)return;
    shell.querySelector('header')!.replaceWith(renderHeader(user,location.pathname,signal));
    const path=location.pathname;
    const page=path==='/'?renderV2HomePage(user,signal):path==='/vocabulary'?renderVocabularyPage(user,signal):path==='/vocabulary/review'?renderReviewPage(user,signal):path==='/dictionary'?renderDictionaryPage(user,signal):null;
    if(page){main.replaceChildren(page);document.title=`${page.querySelector('h1')?.textContent?.trim()||'StudyForge'} — StudyForge`;}
    else{const missing=el('<section class="page-container panel v2-not-found"><h1>Trang này chưa có trong StudyForge V2.</h1><p>Quay về Trang chủ, Kho từ hoặc Tra từ.</p><a class="btn btn-primary" href="/" data-route>Về Trang chủ</a></section>');bindLinks(missing,signal);main.replaceChildren(missing);}
  }catch(error){if(signal.aborted)return;const failed=el('<section class="page-container panel v2-not-found"><h1>Chưa kết nối được StudyForge.</h1><p></p><button class="btn btn-primary">Thử lại</button></section>');failed.querySelector('p')!.textContent=(error as Error).message;failed.querySelector('button')!.addEventListener('click',()=>void render(false),{signal});main.replaceChildren(failed);}
}
window.addEventListener('popstate',()=>void render());
window.addEventListener('studyforge:navigate',()=>void render());
window.addEventListener('studyforge:refresh',()=>void render(false));
window.addEventListener('studyforge:auth',event=>showAuthDialog((event as CustomEvent).detail?.mode||'login'));
void render();
