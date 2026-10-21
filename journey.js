import {mountResearch} from './research.js?v=2';
import {mountStoryPlayer} from './story-player.js?v=2';
import {locations} from './journey-config.js?v=7';
import {STORAGE_KEY,freshState,normalizeState,isComplete,unlocked,currentLocation,recordVisit} from './journey-state.js?v=5';
let state=freshState(),storageAvailable=true;
try{state=normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{storageAvailable=false;}
const id=document.body.dataset.location,place=locations.find(p=>p.id===id);
const q=s=>document.querySelector(s);
const icon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v6H6v6h12"/><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
const dialog=document.createElement('dialog');dialog.className='journey-dialog glass-dialog';dialog.setAttribute('aria-labelledby','journey-title');
dialog.innerHTML=`<div class="dialog-heading"><div><div class="eyebrow">МУХАВЕЦ · ТРИ ЛОКАЦИИ</div><h2 id="journey-title">Маршрут памяти</h2></div><button class="close-button" aria-label="Закрыть маршрут">×</button></div><p class="journey-intro">Исследуйте места по порядку. Рассмотрите отмеченные объекты — откроется следующий этап.</p><ol class="journey-stages"></ol><p class="journey-save"></p><div class="journey-dialog-actions"><button class="journey-primary" data-journey-start></button><button class="journey-secondary" data-journey-restart>Начать заново</button></div>`;
(q('#school-museum')||document.body).append(dialog);
dialog.querySelector('.close-button').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageAvailable=false;}render();}
function openRoute(){render();document.dispatchEvent(new Event('heritage:pause'));dialog.showModal();}
const hud=document.createElement('section');hud.className='journey-hud glass';hud.setAttribute('aria-label','Прогресс маршрута');
if(place){hud.innerHTML=`<button class="journey-summary" aria-label="Открыть маршрут">${icon}<span><small data-stage-label></small><strong data-stage-title></strong></span><span class="journey-dots" aria-hidden="true"></span></button><div class="journey-current" aria-live="polite"></div><div class="journey-hud-actions"><button data-journey-guide>К точке</button><button data-journey-video aria-label="Смотреть видео">Видео</button><button class="journey-notebook-link" data-research-open aria-label="Дневник исследователя" title="Дневник исследователя"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/></svg></button></div>`;(q('#school-museum')||document.body).append(hud);hud.querySelector('.journey-summary').onclick=openRoute;}
const portalButtons=[...document.querySelectorAll('[data-route-open]')];portalButtons.forEach(b=>b.onclick=openRoute);
function render(){
  const completed=locations.filter(p=>isComplete(state,p.id)).length,current=currentLocation(state);
  dialog.querySelector('.journey-stages').innerHTML=locations.map((p,i)=>`<li class="${isComplete(state,p.id)?'is-complete':unlocked(state,p.id)?'is-current':'is-locked'}"><span class="journey-number">${isComplete(state,p.id)?'✓':i+1}</span><div><strong>${p.title}</strong><small>${isComplete(state,p.id)?'Этап пройден':unlocked(state,p.id)?p.subtitle:'Откроется после предыдущего этапа'}</small><ul>${p.points.map(point=>`<li class="${state.seen[p.id]?.includes(point.id)?'checked':''}">${state.seen[p.id]?.includes(point.id)?'✓':'○'} ${point.label}</li>`).join('')}</ul></div>${unlocked(state,p.id)?`<a href="${p.href}" aria-label="Открыть: ${p.title}">↗</a>`:'<span aria-label="Этап закрыт">—</span>'}</li>`).join('');
  dialog.querySelector('.journey-save').textContent=storageAvailable?'Прогресс сохраняется в этом браузере. Между локациями — переход к следующей прогулке.':'Прогресс сохраняется только до закрытия страницы: хранилище браузера недоступно.';
  dialog.querySelector('[data-journey-start]').textContent=completed===3?'Все три этапа пройдены':state.active?'Продолжить маршрут':'Начать с музея';
  dialog.querySelector('[data-journey-start]').disabled=completed===3;
  dialog.querySelector('[data-journey-restart]').hidden=!state.active;
  document.querySelectorAll('[data-route-status]').forEach(el=>el.textContent=state.active?`${completed} из 3 этапов пройдено`:'3 места · ваш маршрут');
  document.querySelectorAll('[data-route-button-text]').forEach(el=>el.textContent=completed===3?'Посмотреть маршрут':state.active?'Продолжить маршрут':'Начать с музея');
  document.querySelectorAll('[data-route-stop]').forEach(el=>{
    const p=locations.find(p=>p.id===el.dataset.routeStop);if(!p)return;
    const done=isComplete(state,p.id),available=unlocked(state,p.id);
    el.classList.toggle('is-complete',done);el.classList.toggle('is-current',!done&&available);el.classList.toggle('is-upcoming',!available);
    el.querySelector('[data-stop-number]').textContent=done?'✓':locations.findIndex(v=>v.id===p.id)+1;
    el.querySelector('[data-stop-status]').textContent=done?'Пройдено':available?state.active?'Вы здесь':'Начало маршрута':p.id==='bogdanchuk'?'После музея':'После Богданчука';
    el.querySelector('[data-stop-action]').textContent=done?'Вернуться в прогулку':available?'Исследовать место':'Свободный осмотр';
  });
  document.querySelectorAll('[data-route-leg]').forEach(el=>el.classList.toggle('is-complete',completed>=Number(el.dataset.routeLeg)));
  if(!place)return;
  const done=isComplete(state,id),available=unlocked(state,id),next=place.points.find(p=>!state.seen[id]?.includes(p.id));
  hud.querySelector('[data-stage-label]').textContent=state.active?`ЭТАП ${locations.indexOf(place)+1} ИЗ 3`:'МАРШРУТ ПАМЯТИ';
  hud.querySelector('[data-stage-title]').textContent=state.active?done?'Этап пройден':place.short:'Начните с музея';
  hud.querySelector('.journey-dots').innerHTML=locations.map(p=>`<i class="${isComplete(state,p.id)?'done':p.id===id?'here':''}"></i>`).join('');
  const text=hud.querySelector('.journey-current');
  if(!state.active)text.textContent='Три места. Одна история.';
  else if(!available)text.innerHTML=`Свободная прогулка. <a href="${current.href}">Вернуться к этапу ${locations.findIndex(p=>p.id===current.id)+1} →</a>`;
  else if(done){const nextPlace=locations[locations.indexOf(place)+1];text.innerHTML=nextPlace?`<a class="journey-next" href="${nextPlace.href}">Далее: ${nextPlace.short} →</a>`:'Все три места исследованы. Маршрут завершён.';}
  else text.textContent=`${(state.seen[id]||[]).length}/${place.points.length} · ${next.label}`;
  const guide=hud.querySelector('[data-journey-guide]');const ready=(document.body.dataset.ready==='true'||q('#school-museum')?.dataset.ready==='true');guide.disabled=state.active&&!ready;guide.hidden=state.active&&(!available||done);guide.textContent=state.active?'К точке':'Маршрут';guide.setAttribute('aria-label',state.active?'Подойти к следующей точке':'Начать маршрут');
}
document.querySelectorAll('[data-route-continue]').forEach(button=>button.onclick=()=>{if(locations.every(p=>isComplete(state,p.id)))return openRoute();state.active=true;save();location.href=currentLocation(state).href;});
document.querySelectorAll('[data-route-stop="museum"] a').forEach(link=>link.addEventListener('click',()=>{state.active=true;save();}));
dialog.querySelector('[data-journey-start]').onclick=()=>{state.active=true;save();location.href=currentLocation(state).href;};
dialog.querySelector('[data-journey-restart]').onclick=()=>{state=freshState();state.active=true;save();location.href=locations[0].href;};
const notebook=mountResearch(q('#school-museum')||document.body,id);
if(place){
  new MutationObserver(render).observe(q('#school-museum')||document.body,{attributes:true,attributeFilter:['data-ready']});
  hud.querySelector('[data-journey-guide]').onclick=()=>{if(!state.active)return openRoute();const point=place.points.find(p=>!state.seen[id]?.includes(p.id));if(point)document.dispatchEvent(new CustomEvent('heritage:guide',{detail:{location:id,target:point.target}}));};
  const stories=mountStoryPlayer(q('#school-museum')||document.body,place,id=>notebook.open(id));
  hud.querySelector('[data-journey-video]').onclick=()=>stories.open();
}
document.addEventListener('heritage:inspect',e=>{const next=recordVisit(state,e.detail?.location,e.detail?.point);if(next!==state){state=next;save();}});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){try{state=normalizeState(JSON.parse(e.newValue));}catch{state=freshState();}render();}});
render();
