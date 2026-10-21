// Build the player once per page, so closing a story does not discard its position.
export function mountStoryPlayer(host, place, openResearch) {
  const dialog=document.createElement('dialog');dialog.className='journey-dialog glass-dialog story-dialog';dialog.setAttribute('aria-labelledby','journey-video-title');
  dialog.innerHTML=`<div class="dialog-heading"><div><div class="eyebrow">РАССКАЗ ЮНЫХ ЭКСКУРСОВОДОВ</div><h2 id="journey-video-title"></h2></div><button class="close-button" aria-label="Закрыть видео">×</button></div>
    <div class="story-stage"><video controls playsinline preload="metadata"></video></div>
    <div class="story-tools"><div class="story-seek"><button data-seek="-10" aria-label="Назад на 10 секунд" disabled>↶ 10 с</button><button data-seek="10" aria-label="Вперёд на 10 секунд" disabled>10 с ↷</button></div><label>Скорость <select aria-label="Скорость видео"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select></label></div>
    <p class="story-status" role="status">Загружаем видео…</p><p class="journey-video-caption"></p>
    <details class="story-source"><summary>Об этом фрагменте</summary><p data-video-source></p><p>Разрешение исходной записи — 848 × 464. Лучше смотреть в размере окна: увеличение на весь экран не добавляет снятых деталей.</p><a target="_blank" rel="noopener" data-video-link>Открыть видео отдельным файлом ↗</a></details>
    <button class="story-research" type="button">Что удалось узнать? <span>Записать наблюдение →</span></button>`;
  dialog.querySelector('h2').textContent=place.title;
  dialog.querySelector('.journey-video-caption').textContent=place.videoCaption;
  dialog.querySelector('[data-video-source]').textContent=`Фрагмент ${place.videoRange||''} фильма «ЮныеЭкскурсоводыСШп.Мухавец1.MOV». Сохранены исходные рассказ и видеоряд; громкость выровнена, изображение мягко очищено от шума для просмотра на сайте.`;
  const player=dialog.querySelector('video'),status=dialog.querySelector('.story-status'),storageKey='mukhavets.video.'+place.video;
  player.setAttribute('aria-label','Видеоэкскурсия: '+place.title);player.poster=place.videoPoster;
  dialog.querySelector('[data-video-link]').href=place.video;
  host.append(dialog);
  let restore=0;try{restore=Number(sessionStorage.getItem(storageKey))||0;}catch{}
  const timeLabel=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  function remember(){try{sessionStorage.setItem(storageKey,String(player.currentTime));}catch{}}
  function ready(){if(player.error)return;status.textContent=player.paused?(player.currentTime>1?`Остановлено на ${timeLabel(player.currentTime)}. Можно продолжить.`:'Нажмите ▶, чтобы послушать рассказ.'):'Рассказ воспроизводится';}
  player.addEventListener('loadedmetadata',()=>{if(restore>0&&restore<player.duration-2)player.currentTime=restore;dialog.querySelectorAll('[data-seek]').forEach(b=>b.disabled=false);ready();});
  player.addEventListener('canplay',ready);player.addEventListener('play',ready);player.addEventListener('playing',ready);
  player.addEventListener('pause',()=>{remember();ready();});player.addEventListener('seeked',ready);
  player.addEventListener('waiting',()=>{status.textContent='Подгружаем фрагмент…';});
  player.addEventListener('ended',()=>{status.textContent='Рассказ завершён. Запишите деталь, которую хотите проверить.';});
  player.addEventListener('error',()=>{status.textContent='Видео не загрузилось. Попробуйте открыть файл по ссылке ниже.';});
  dialog.querySelectorAll('[data-seek]').forEach(button=>button.onclick=()=>{if(Number.isFinite(player.duration))player.currentTime=Math.max(0,Math.min(player.duration,player.currentTime+Number(button.dataset.seek)));});
  dialog.querySelector('select').onchange=e=>{player.playbackRate=Number(e.target.value);};
  dialog.querySelector('.close-button').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{player.pause();remember();});
  dialog.querySelector('.story-research').onclick=()=>{dialog.close();openResearch(place.id);};
  return {open(){if(!player.getAttribute('src'))player.src=place.video;document.dispatchEvent(new Event('heritage:pause'));dialog.showModal();ready();}};
}
