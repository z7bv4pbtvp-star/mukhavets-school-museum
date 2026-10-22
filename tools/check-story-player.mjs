import assert from 'node:assert/strict';
import {mountStoryPlayer} from '../story-player.js';

class Element extends EventTarget {
  attrs=new Map();hidden=false;disabled=false;textContent='';open=false;
  setAttribute(k,v){this.attrs.set(k,String(v));}
  getAttribute(k){return this.attrs.get(k)||null;}
  append(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.dispatchEvent(new Event('close'));}
}
class Video extends Element {
  readyState=0;currentTime=0;duration=100;paused=true;error=null;plans=[];playCalls=0;
  set src(value){this.attrs.set('src',value);}
  get src(){return this.getAttribute('src');}
  load(){this.readyState=0;this.error=null;this.currentTime=0;}
  play(){
    this.playCalls++;
    const plan=this.plans.shift();
    if(plan==='blocked')return Promise.reject(Object.assign(new Error('gesture required'),{name:'NotAllowedError'}));
    if(plan==='pending')return new Promise(()=>{});
    this.readyState=4;this.paused=false;
    for(const type of ['loadedmetadata','play','canplay','playing'])this.dispatchEvent(new Event(type));
    return Promise.resolve();
  }
  pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
}
let lastDialog;
const storage=new Map(),timers=new Map();let timerId=0;
const realTimeout=globalThis.setTimeout,realClear=globalThis.clearTimeout;
globalThis.setTimeout=fn=>{timers.set(++timerId,fn);return timerId;};
globalThis.clearTimeout=id=>timers.delete(id);
globalThis.sessionStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
globalThis.document={dispatchEvent(){},createElement(){
  const dialog=new Element(),nodes=new Map();
  const video=new Video(),seeks=[new Element(),new Element()];seeks[0].dataset={seek:'-10'};seeks[1].dataset={seek:'10'};
  for(const key of ['h2','.story-status','.story-play-overlay','.story-error','.journey-video-caption','[data-video-source]','[data-video-link]','[data-video-fallback]','[data-video-retry]','select','.close-button','.story-research'])nodes.set(key,new Element());
  nodes.set('video',video);dialog.querySelector=key=>nodes.get(key);dialog.querySelectorAll=()=>seeks;
  lastDialog=dialog;return dialog;
}};
function fixture(plans=[]){
  const player=mountStoryPlayer(new Element(),{id:'test',title:'Тест',video:'local.mp4',videoFallback:'backup.mp4',videoPoster:'poster.jpg',videoCaption:'Рассказ'},()=>{});
  const dialog=lastDialog,video=dialog.querySelector('video');video.plans=plans;
  return {player,dialog,video,q:selector=>dialog.querySelector(selector)};
}
try{
  let f=fixture();f.player.open();
  assert.equal(f.video.playCalls,1);assert.equal(f.video.paused,false);assert.equal(f.video.src,'local.mp4');
  f.video.currentTime=23;f.dialog.close();f.player.open();assert.equal(f.video.currentTime,23);
  f.dialog.close();
  storage.clear();f=fixture(['blocked']);f.player.open();await Promise.resolve();await Promise.resolve();
  assert.equal(f.q('.story-play-overlay').hidden,false);assert.match(f.q('.story-status').textContent,/Нажмите/);
  f.q('.story-play-overlay').onclick();assert.equal(f.video.paused,false);f.dialog.close();
  f=fixture();f.player.open();f.video.currentTime=31;f.video.error={code:2};f.video.dispatchEvent(new Event('error'));
  assert.equal(f.video.src,'backup.mp4');assert.equal(f.video.paused,false);assert.equal(f.video.currentTime,31);
  f.video.error={code:2};f.video.dispatchEvent(new Event('error'));assert.equal(f.q('.story-error').hidden,false);
  f.q('[data-video-retry]').onclick();assert.equal(f.video.src,'local.mp4');assert.equal(f.video.paused,false);f.dialog.close();
  f=fixture(['pending']);f.player.open();assert.ok(timers.size>0);
  for(const callback of [...timers.values()])callback();assert.equal(f.q('.story-error').hidden,false);
  f.dialog.close();assert.equal(timers.size,0);f.video.error={code:2};f.video.dispatchEvent(new Event('error'));assert.equal(f.video.src,'local.mp4');
  console.log('PASS: click-to-play, blocked autoplay recovery, position retention, source fallback, retry and slow/closed player states.');
}finally{globalThis.setTimeout=realTimeout;globalThis.clearTimeout=realClear;}
