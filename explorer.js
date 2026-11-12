import {places,facts} from './guide-knowledge.js';
import {answerQuestion,suggestions} from './guide-engine.js';
const root=document.querySelector('[data-guide-home]');
const current=places[document.body.dataset.location]?document.body.dataset.location:'museum';
const histories=new Map(Object.keys(places).map(k=>[k,[]]));
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const time=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const videoDialog=el('dialog','ex-dialog');videoDialog.setAttribute('aria-label','Видеорассказ о месте');
const videoTitle=el('h2'),closeVideo=el('button','ex-close','×');closeVideo.setAttribute('aria-label','Закрыть видео');
const video=el('video');video.controls=true;video.playsInline=true;video.preload='metadata';
const caption=el('p','ex-caption');videoDialog.append(closeVideo,videoTitle,video,caption);document.body.append(videoDialog);
let opener=null;
closeVideo.onclick=()=>videoDialog.close();videoDialog.addEventListener('close',()=>{video.pause();opener?.focus();});
videoDialog.addEventListener('click',e=>{if(e.target===videoDialog){const r=videoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)videoDialog.close();}});
function play(place,start=0,end=null){
 const p=places[place];if(!p)return;opener=document.activeElement;
 videoTitle.textContent=p.title;caption.textContent=end!==null?`Источник ответа: видеорассказ, ${time(start)}–${time(end)}. Можно просмотреть весь ролик.`:'Оригинальный рассказ юных экскурсоводов. Видео можно поставить на паузу и перемотать.';
 const seek=()=>{video.currentTime=start;};
 if(video.dataset.place!==place){video.src=p.video;video.poster=p.poster;video.dataset.place=place;video.onloadedmetadata=seek;}else seek();
 if(!videoDialog.open)videoDialog.showModal();
}
video.addEventListener('error',()=>{caption.textContent='Не удалось загрузить видео. Откройте его отдельно по ссылке ниже.';const a=el('a','','Открыть оригинальный ролик');a.href=places[video.dataset.place].video;a.target='_blank';a.rel='noopener';caption.append(document.createElement('br'),a);});
function mountChat(host,initial){
 const section=el('section','ex-chat');
 const header=el('div','ex-chat-header'),avatar=el('span','ex-guide-avatar');
 avatar.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 8 9-5 9 5H3Zm2 2v9m5-9v9m4-9v9m5-9v9M3 21h18M3 19h18"/></svg>';
 const identity=el('div','ex-guide-identity'),placeName=el('span','',places[initial].title);identity.append(el('strong','','Экскурсовод'),placeName);
 const label=el('label','','Место');const select=el('select');select.setAttribute('aria-label','Место для вопроса');
 Object.entries(places).forEach(([id,p])=>{const option=el('option','',id==='museum'?'Музей':id==='bogdanchuk'?'Богданчук':'Землякам');option.value=id;select.append(option);});select.value=initial;label.append(select);
 const chips=el('div','ex-chips');chips.setAttribute('aria-label','Примеры вопросов');
 const log=el('div','ex-log');log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-label','Диалог с экскурсоводом');
 const form=el('form','ex-question');const input=el('input');input.type='text';input.placeholder='Ваш вопрос о месте';input.setAttribute('aria-label','Ваш вопрос о месте');input.required=true;input.maxLength=500;input.autocomplete='off';
 input.placeholder='Напишите вопрос…';
 const submit=el('button','ex-button primary ex-send');submit.type='submit';submit.setAttribute('aria-label','Отправить вопрос');submit.title='Отправить вопрос';
 submit.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';form.append(input,submit);
 const status=el('p','ex-chat-status','Вопросы остаются в этой вкладке.');
 const clear=el('button','ex-clear','Очистить диалог');clear.type='button';
 header.append(avatar,identity,label);
 const intro=el('div','ex-chat-intro');intro.innerHTML='<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M36 20a15 15 0 0 1-16 14l-10 4 2-9a15 15 0 1 1 24-9Z"/><circle cx="14" cy="20" r="1"/><circle cx="22" cy="20" r="1"/><circle cx="30" cy="20" r="1"/></svg>';
 intro.append(el('p','','Спросите об истории этого места. Ответ можно проверить по видео.'));
 const compose=el('div','ex-compose');compose.append(form,status,clear);
 section.append(header,intro,log,chips,compose);host.append(section);
 function render(){const history=histories.get(select.value);section.classList.toggle('has-messages',history.length>0);intro.hidden=history.length>0;clear.hidden=history.length===0;placeName.textContent=places[select.value].title;log.replaceChildren();for(const m of history){
  const msg=el('div','ex-message '+m.role);msg.append(el('small','',m.role==='user'?'ВЫ':'ЭКСКУРСОВОД'),document.createTextNode(m.text));
  for(const f of m.facts||[]){const source=el('button','ex-source',`Смотреть источник · ${time(f.start)}–${time(f.end)}`);source.type='button';source.onclick=()=>play(f.place,f.start,f.end);msg.append(source);}log.append(msg);
 }log.scrollTop=log.scrollHeight;}
 function prompts(){chips.replaceChildren();(select.value==='museum'?['Когда открылся музей?','Какие экспонаты здесь есть?','Что рассказывают о войне?']:suggestions(select.value).slice(0,3)).forEach(q=>{const b=el('button','',q);b.type='button';const icon=el('span');icon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';b.append(icon);b.onclick=()=>ask(q);chips.append(b);});}
 function ask(question){const q=question.trim();if(!q)return;const id=select.value,history=histories.get(id);const previous=history.flatMap(h=>(h.facts||[]).map(f=>f.id));const answer=answerQuestion(id,q,previous);
  history.push({role:'user',text:q.slice(0,500)});
  const text=answer.kind==='answer'&&answer.facts.length?answer.facts.map(f=>f.text).join('\n\n'):answer.kind==='greeting'?`Здравствуйте! Я помогу разобраться в видеорассказе «${places[id].title}». Выберите пример вопроса или напишите свой.`:'В проверенных фрагментах этого видеорассказа не нашёл достаточно точных сведений для ответа. Попробуйте один из вопросов выше или посмотрите ролик. Непроверенные даты, имена и размеры я не подставляю.';
  history.push({role:'assistant',text,facts:answer.facts});if(history.length>20)history.splice(0,history.length-20);
  input.value='';render();
 }
 form.onsubmit=e=>{e.preventDefault();ask(input.value);};select.onchange=()=>{prompts();render();};clear.onclick=()=>{histories.set(select.value,[]);render();input.focus();};prompts();render();
 return {setPlace(id){if(places[id]){select.value=id;prompts();render();}},focus(){input.focus();}};
}
const homeChat=root?mountChat(root,current):null;
const chatDialog=el('dialog','ex-dialog ex-chat-dialog');chatDialog.setAttribute('aria-label','Экскурсовод по видеорассказу');
const chatClose=el('button','ex-close','×');chatClose.setAttribute('aria-label','Закрыть экскурсовода');chatClose.onclick=()=>chatDialog.close();chatDialog.append(chatClose,el('h2','','Спросите экскурсовода'));document.body.append(chatDialog);
const modalChat=mountChat(chatDialog,current);
function openChat(id){if(homeChat){homeChat.setPlace(id);root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});homeChat.focus();}else{modalChat.setPlace(id);chatDialog.showModal();modalChat.focus();}}
for(const button of document.querySelectorAll('[data-place-video]'))button.onclick=()=>play(button.dataset.placeVideo);
for(const button of document.querySelectorAll('[data-place-chat]'))button.onclick=()=>openChat(button.dataset.placeChat);
if(document.body.dataset.location){const b=el('button','ex-float','Спросить экскурсовода');b.onclick=()=>openChat(current);document.body.append(b);}
const list=el('dialog','ex-dialog');list.setAttribute('aria-label','Все видеорассказы');const closeList=el('button','ex-close','×');closeList.setAttribute('aria-label','Закрыть список видео');closeList.onclick=()=>list.close();list.append(closeList,el('h2','','Рассказы юных экскурсоводов'));
const grid=el('div','ex-video-grid');Object.entries(places).forEach(([id,p])=>{const b=el('button');const img=el('img');img.src=p.poster;img.alt='';b.append(img,document.createTextNode(p.title));b.onclick=()=>{list.close();play(id);};grid.append(b);});list.append(grid);document.body.append(list);
for(const a of document.querySelectorAll('[data-all-videos]'))a.onclick=e=>{e.preventDefault();list.showModal();};
// Opening a source from a chat dialog must not stop or close that conversation.

const menu=document.querySelector('.ex-menu'),siteHeader=document.querySelector('.ex-header');
if(menu&&siteHeader){
 const closeMenu=()=>{siteHeader.classList.remove('is-menu-open');menu.setAttribute('aria-expanded','false');};
 menu.addEventListener('click',()=>{const open=siteHeader.classList.toggle('is-menu-open');menu.setAttribute('aria-expanded',String(open));});
 siteHeader.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
}
