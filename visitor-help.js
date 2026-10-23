export function mountVisitorHelp(host) {
  const dialog=document.createElement('dialog');dialog.className='glass-dialog visitor-help';dialog.setAttribute('aria-labelledby','visitor-help-title');
  dialog.innerHTML=`<div class="dialog-heading"><div><div class="eyebrow">БЫСТРАЯ ПОМОЩЬ</div><h2 id="visitor-help-title">Осмотритесь. Всё просто.</h2></div><button class="close-button" aria-label="Закрыть помощь">×</button></div>
    <div class="help-controls"><section><span class="help-symbol" aria-hidden="true">⌨</span><h3>На компьютере</h3><p><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> или стрелки — идти. Потяните сцену мышью, чтобы повернуться. Нажмите на стенд или метку, чтобы рассмотреть.</p></section><section><span class="help-symbol" aria-hidden="true">↔</span><h3>На телефоне</h3><p>Левым пальцем ведите джойстик, правым — поворачивайте вид по свободной части экрана. Можно делать это одновременно.</p></section></div>
    <section class="help-route"><h3>День и ночь</h3><p>У обоих памятников под названием места нажмите <strong>«День»</strong> или <strong>«Ночь»</strong>. Ночью включается подсветка скульптуры и свет из встроенных в плитку светильников. Ракурс сохраняется; выбор запоминается для обоих памятников в этом браузере. В школьном музее остаётся внутреннее освещение.</p></section>
    <section class="help-route"><h3>Как пройти этап</h3><ol><li>Нажмите <strong>«К точке»</strong> — окажетесь рядом с нужным объектом.</li><li>Откройте его: в музее — <strong>«Фотографии»</strong>, у памятника — метку или <strong>«Надпись»</strong>.</li><li>После просмотра появится галочка. Выполните остальные задания и нажмите <strong>«Далее»</strong>.</li></ol><p>Видео и дневник дополняют исследование. Этап засчитывается за просмотр отмеченных объектов.</p></section>
    <label class="help-quality">Качество прогулки<select data-walk-quality aria-label="Качество прогулки"><option value="auto">Авто · полная детализация</option><option value="economy">Экономное · для слабого устройства</option></select><span>Если движение замедляется, экономный режим снизит разрешение и отключит тени. Фотографии и видео сохранят качество.</span></label>
    <div class="help-footer"><a href="guide.html?v=20261023#lighting" target="_blank" rel="noopener">Полная инструкция для ученика и учителя ↗</a><button class="journey-primary" data-help-close>Вернуться к прогулке</button></div>`;
  host.append(dialog);
  let mode='auto';try{mode=localStorage.getItem('mukhavets.quality')==='economy'?'economy':'auto';}catch{}
  const select=dialog.querySelector('select');select.value=mode;
  select.onchange=()=>{mode=select.value;try{localStorage.setItem('mukhavets.quality',mode);}catch{}document.dispatchEvent(new CustomEvent('heritage:quality',{detail:{mode}}));};
  for(const button of dialog.querySelectorAll('.close-button,[data-help-close]'))button.onclick=()=>dialog.close();
  document.querySelectorAll('[data-help-open]').forEach(button=>button.addEventListener('click',()=>{document.dispatchEvent(new Event('heritage:pause'));dialog.showModal();}));
  // Existing information and photo dialogs must stop a held movement key too.
  const observe=new MutationObserver(records=>{if(records.some(r=>r.target.tagName==='DIALOG'&&r.target.open))document.dispatchEvent(new Event('heritage:pause'));});
  observe.observe(host,{subtree:true,attributes:true,attributeFilter:['open']});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
}
