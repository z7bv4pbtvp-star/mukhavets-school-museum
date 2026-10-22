// One player per location retains its position while the visitor explores.
export function mountStoryPlayer(host, place, openResearch) {
  const dialog=document.createElement('dialog');
  dialog.className='journey-dialog glass-dialog story-dialog';
  dialog.setAttribute('aria-labelledby','journey-video-title');
  dialog.innerHTML=`<div class="dialog-heading"><div><div class="eyebrow">РАССКАЗ ЮНЫХ ЭКСКУРСОВОДОВ</div><h2 id="journey-video-title"></h2></div><button class="close-button" aria-label="Закрыть видео">×</button></div>
    <div class="story-stage"><video controls playsinline preload="metadata"></video><button type="button" class="story-play-overlay" aria-label="Воспроизвести видео"><span aria-hidden="true">▶</span>Воспроизвести</button></div>
    <div class="story-tools"><div class="story-seek"><button data-seek="-10" aria-label="Назад на 10 секунд" disabled>↶ 10 с</button><button data-seek="10" aria-label="Вперёд на 10 секунд" disabled>10 с ↷</button></div><label>Скорость <select aria-label="Скорость видео"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select></label></div>
    <p class="story-status" role="status">Загружаем видео…</p><div class="story-error" hidden><button type="button" data-video-retry>Повторить загрузку</button><a data-video-fallback target="_blank" rel="noopener">Открыть видео отдельно ↗</a></div><p class="journey-video-caption"></p>
    <details class="story-source"><summary>Об этом фрагменте</summary><p data-video-source></p><p>Разрешение исходной записи — 848 × 464. Лучше смотреть в размере окна: увеличение на весь экран не добавляет снятых деталей.</p><a target="_blank" rel="noopener" data-video-link>Открыть видео отдельным файлом ↗</a></details>
    <button class="story-research" type="button">Что удалось узнать? <span>Записать наблюдение →</span></button>`;
  const q=selector=>dialog.querySelector(selector);
  const player=q('video'),status=q('.story-status'),playButton=q('.story-play-overlay'),errorBox=q('.story-error');
  const seekButtons=dialog.querySelectorAll('[data-seek]');
  const sources=[...new Set([place.video,place.videoFallback].filter(Boolean))];
  const storageKey='mukhavets.video.'+place.id;
  q('h2').textContent=place.title;
  q('.journey-video-caption').textContent=place.videoCaption;
  q('[data-video-source]').textContent=`Фрагмент ${place.videoRange||''} фильма «ЮныеЭкскурсоводыСШп.Мухавец1.MOV». Сохранены исходные рассказ и видеоряд; громкость выровнена.`;
  player.setAttribute('aria-label','Видеоэкскурсия: '+place.title);
  player.poster=place.videoPoster;
  q('[data-video-link]').href=place.video;
  q('[data-video-fallback]').href=place.video;
  host.append(dialog);
  let restore=0,sourceIndex=0,attempt=0,slowTimer=0,wantsPlayback=false,switchingSource=false;
  try {
    restore=Number(sessionStorage.getItem(storageKey)??sessionStorage.getItem('mukhavets.video.'+(place.videoFallback||place.video)))||0;
  } catch {}
  const timeLabel=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  function remember(){
    if(player.readyState===0||!Number.isFinite(player.currentTime))return;
    restore=player.currentTime;
    try{sessionStorage.setItem(storageKey,String(restore));}catch{}
  }
  function clearSlow(){clearTimeout(slowTimer);slowTimer=0;}
  function watchLoading(){
    clearSlow();
    slowTimer=setTimeout(()=>{
      if(!dialog.open||player.readyState>=3)return;
      status.textContent='Видео загружается дольше обычного. Можно повторить загрузку или открыть его отдельно.';
      errorBox.hidden=false;
    },12000);
  }
  function ready(){
    playButton.hidden=!player.paused||Boolean(player.error);
    if(player.error)return;
    if(player.readyState===0){status.textContent='Загружаем видео…';return;}
    status.textContent=player.paused?(player.currentTime>1?`Остановлено на ${timeLabel(player.currentTime)}. Нажмите «Воспроизвести».`:'Нажмите «Воспроизвести», чтобы послушать рассказ.'):'Рассказ воспроизводится';
  }
  function selectSource(index){
    attempt++;sourceIndex=index;switchingSource=true;
    errorBox.hidden=true;playButton.hidden=true;
    seekButtons.forEach(button=>button.disabled=true);
    status.textContent='Загружаем видео…';
    player.src=sources[sourceIndex];player.load();watchLoading();
  }
  function failed(){
    if(!dialog.open||!player.error)return;
    clearSlow();
    if(sourceIndex+1<sources.length){
      const resume=wantsPlayback;remember();selectSource(sourceIndex+1);
      if(resume)beginPlayback();
      return;
    }
    switchingSource=false;playButton.hidden=true;
    status.textContent='Не удалось загрузить видео. Повторите загрузку или откройте его отдельно.';
    errorBox.hidden=false;
  }
  function beginPlayback(){
    wantsPlayback=true;playButton.hidden=true;
    const currentAttempt=++attempt;
    // Keep play() in the visitor's click handler so sound is permitted on phones.
    try {
      const result=player.play();
      if(result?.catch)result.catch(error=>{
        if(!dialog.open||currentAttempt!==attempt||error.name==='AbortError')return;
        if(error.name==='NotAllowedError'){
          wantsPlayback=false;playButton.hidden=false;
          status.textContent='Нажмите «Воспроизвести», чтобы запустить видео со звуком.';
        }else if(player.error){failed();}
        else {
          wantsPlayback=false;playButton.hidden=false;errorBox.hidden=false;
          status.textContent='Нажмите «Воспроизвести» или повторите загрузку видео.';
        }
      });
    }catch{
      wantsPlayback=false;playButton.hidden=false;errorBox.hidden=false;
      status.textContent='Нажмите «Воспроизвести» или откройте видео отдельно.';
    }
  }
  player.addEventListener('loadedmetadata',()=>{
    switchingSource=false;
    if(restore>0&&restore<player.duration-2)player.currentTime=restore;
    seekButtons.forEach(button=>button.disabled=false);ready();
  });
  player.addEventListener('canplay',()=>{clearSlow();errorBox.hidden=true;ready();});
  player.addEventListener('play',()=>{wantsPlayback=true;ready();});
  player.addEventListener('playing',()=>{clearSlow();errorBox.hidden=true;ready();});
  player.addEventListener('pause',()=>{if(!switchingSource)wantsPlayback=false;remember();ready();});
  player.addEventListener('seeked',ready);
  player.addEventListener('waiting',()=>{status.textContent='Подгружаем фрагмент…';watchLoading();});
  player.addEventListener('ended',()=>{clearSlow();playButton.hidden=false;status.textContent='Рассказ завершён. Запишите деталь, которую хотите проверить.';});
  player.addEventListener('error',failed);
  playButton.onclick=()=>{if(player.error)selectSource(0);beginPlayback();};
  q('[data-video-retry]').onclick=()=>{remember();selectSource(0);beginPlayback();};
  seekButtons.forEach(button=>button.onclick=()=>{
    if(Number.isFinite(player.duration))player.currentTime=Math.max(0,Math.min(player.duration,player.currentTime+Number(button.dataset.seek)));
  });
  q('select').onchange=event=>{player.playbackRate=Number(event.target.value);};
  q('.close-button').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{attempt++;wantsPlayback=false;clearSlow();player.pause();remember();});
  q('.story-research').onclick=()=>{dialog.close();openResearch(place.id);};
  return {open(){
    document.dispatchEvent(new Event('heritage:pause'));
    if(!dialog.open)dialog.showModal();
    if(!player.getAttribute('src')||player.error)selectSource(0);
    beginPlayback();
  }};
}
