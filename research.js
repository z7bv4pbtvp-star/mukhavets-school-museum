import {locations} from './journey-config.js?v=11';
import {NOTEBOOK_KEY, normalizeNotebook, hasObservation, notebookMarkdown, notebookHtml} from './research-state.js?v=2';
import {createBrowserStore} from './browser-store.js?v=1';

export function mountResearch(host, locationId) {
  const store=createBrowserStore(NOTEBOOK_KEY,normalizeNotebook);
  let notebook=store.value,selected=locationId||'museum',pendingDraft=false;
  const dialog = document.createElement('dialog');
  dialog.className = 'glass-dialog research-dialog';
  dialog.setAttribute('aria-labelledby','research-title');
  dialog.innerHTML = `<div class="dialog-heading"><div><div class="eyebrow">ОТ НАБЛЮДЕНИЯ К ВЫВОДУ</div><h2 id="research-title">Дневник исследователя</h2></div><button class="close-button" aria-label="Закрыть дневник">×</button></div>
    <p class="research-intro">Как три места сохраняют память о Мухавце? Найдите деталь, проверьте её по источнику и запишите свой вывод.</p>
    <div class="research-tabs" role="tablist" aria-label="Место исследования"></div>
    <section class="research-panel" role="tabpanel" id="research-panel" tabindex="0"></section>
    <details class="research-conclusion"><summary>Общий вывод по трём местам</summary><label for="research-conclusion">Что общего у этих мест и чем отличается их способ сохранять память?</label><textarea id="research-conclusion" rows="4" maxlength="5000" placeholder="Сопоставьте свои наблюдения и приведите подтверждающие примеры."></textarea></details>
    <footer class="research-actions"><div><strong data-note-count></strong><span data-note-save role="status"></span></div><div class="notebook-download"><select aria-label="Формат дневника"><option value="html">Для печати (.html)</option><option value="md">Текст Markdown (.md)</option></select><button class="journey-primary" data-note-download>Скачать дневник</button></div></footer><p class="research-export-note">Файл для печати открывается в браузере и сохраняется в PDF через меню «Печать».</p>`;
  host.append(dialog);
  const panel = dialog.querySelector('.research-panel');
  const tabs = dialog.querySelector('.research-tabs');
  for (const place of locations) {
    const button = document.createElement('button');button.type='button';button.role='tab';button.id='research-tab-'+place.id;
    button.setAttribute('aria-controls','research-panel');button.dataset.researchTab=place.id;button.textContent=place.short;
    button.onclick=()=>{selected=place.id;render();};tabs.append(button);
  }
  tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let index=locations.findIndex(p=>p.id===selected);index=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3;selected=locations[index].id;render();tabs.children[index].focus();});
  function status() {
    dialog.querySelector('[data-note-count]').textContent=`${locations.filter(p=>hasObservation(notebook.notes[p.id])).length} из 3 наблюдений с источником`;
    dialog.querySelector('[data-note-save]').textContent=store.mode==='memory'?'Автосохранение недоступно — скачайте дневник перед закрытием.':pendingDraft?'Есть изменение в другой вкладке. Ваш текущий текст сохранится при выходе из поля.':store.mode==='local'?'Записи сохраняются в этом браузере.':'Записи сохраняются до закрытия этой вкладки. Скачайте дневник.';
    document.querySelectorAll('[data-research-count]').forEach(el=>{el.textContent=`${locations.filter(p=>hasObservation(notebook.notes[p.id])).length}/3 наблюдений`;});
  }
  function save() {pendingDraft=false;store.save(notebook);status();}
  function render() {
    const place=locations.find(p=>p.id===selected),research=place.research;
    for(const button of tabs.children){const active=button.dataset.researchTab===selected;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
    panel.setAttribute('aria-labelledby','research-tab-'+selected);
    panel.innerHTML=`<div class="research-task"><span>ЗАДАНИЕ НА МЕСТЕ</span><h3></h3><p></p><button class="research-scene">Проверить в 3D <span aria-hidden="true">↗</span></button></div>
      <details class="research-evidence"><summary>Оригинальный снимок и источники</summary><figure><img loading="lazy" alt=""><figcaption></figcaption></figure><p class="research-source-note"></p><p>3D-реконструкция помогает осмотреть форму и расположение. Надписи и исторические сведения проверяйте по фото, видео и документам.</p></details>
      <div class="research-fields"><label>Моё наблюдение<textarea data-note-field="observation" rows="3" maxlength="3000" placeholder="Что именно вы заметили? Опишите конкретную деталь."></textarea></label>
      <label>Чем подтверждается<textarea data-note-field="source" rows="2" maxlength="3000" placeholder="Название стенда, надпись на фото или время в видеорассказе."></textarea></label>
      <label>Что ещё нужно выяснить <span class="field-optional">необязательно</span><textarea data-note-field="question" rows="2" maxlength="3000" placeholder="Какой вопрос вы задали бы экскурсоводу или проверили в архиве?"></textarea></label></div>`;
    panel.querySelector('h3').textContent=research.question;panel.querySelector('.research-task p').textContent=research.hint;
    const image=panel.querySelector('img');image.src=research.photo;image.alt=research.photoName;panel.querySelector('figcaption').textContent=research.photoName;
    panel.querySelector('.research-source-note').textContent=`Видеорассказ: ${place.videoRange || 'фрагмент о месте'} в исходном фильме «ЮныеЭкскурсоводыСШп.Мухавец1.MOV».`;
    panel.querySelector('.research-scene').onclick=()=>{dialog.close();if(locationId===selected)document.dispatchEvent(new CustomEvent('heritage:guide',{detail:{location:selected,target:research.target}}));else location.href=place.href;};
    for(const field of panel.querySelectorAll('[data-note-field]')){field.value=notebook.notes[selected]?.[field.dataset.noteField]||'';field.addEventListener('input',()=>{notebook.notes[selected]??={};notebook.notes[selected][field.dataset.noteField]=field.value;save();});}
    dialog.querySelector('#research-conclusion').value=notebook.conclusion;status();
  }
  dialog.querySelector('#research-conclusion').addEventListener('input',e=>{notebook.conclusion=e.target.value;save();});
  dialog.querySelector('.close-button').onclick=()=>dialog.close();
  dialog.addEventListener('focusout',e=>{if(pendingDraft&&e.target.tagName==='TEXTAREA')save();});
  dialog.addEventListener('close',()=>{if(pendingDraft)save();});
  window.addEventListener('pagehide',()=>{if(pendingDraft)save();});
  dialog.querySelector('[data-note-download]').onclick=()=>{
    const format=dialog.querySelector('.notebook-download select').value,date=new Date().toLocaleDateString('ru-RU');
    const text=format==='html'?notebookHtml(notebook,locations,date):notebookMarkdown(notebook,locations,date);
    const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:(format==='html'?'text/html':'text/markdown')+';charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='Мухавец — дневник исследования.'+format;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
  function open(id=locationId||'museum'){selected=locations.some(p=>p.id===id)?id:'museum';document.dispatchEvent(new Event('heritage:pause'));render();dialog.showModal();}
  document.querySelectorAll('[data-research-open]').forEach(button=>button.addEventListener('click',()=>open(button.dataset.researchOpen||locationId)));
  document.addEventListener('heritage:research',e=>open(e.detail?.location));
  window.addEventListener('storage',e=>{if(!store.accepts(e))return;
    const active=document.activeElement,editing=dialog.open&&active?.tagName==='TEXTAREA'&&dialog.contains(active),draft=editing?active.value:null;
    try{notebook=normalizeNotebook(JSON.parse(e.newValue));}catch{notebook=normalizeNotebook(null);}
    if(dialog.open){
      if(editing){if(active.id==='research-conclusion'){pendingDraft ||= notebook.conclusion!==draft;notebook.conclusion=draft;}else{notebook.notes[selected]??={};pendingDraft ||= notebook.notes[selected][active.dataset.noteField]!==draft;notebook.notes[selected][active.dataset.noteField]=draft;}}
      for(const field of panel.querySelectorAll('[data-note-field]'))if(field!==active)field.value=notebook.notes[selected]?.[field.dataset.noteField]||'';
      if(active.id!=='research-conclusion')dialog.querySelector('#research-conclusion').value=notebook.conclusion;
    }
    status();
  });
  status();return {open};
}
