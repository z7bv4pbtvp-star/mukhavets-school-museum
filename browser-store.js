// Keep a visit usable when persistent storage is restricted by the browser.
export function createBrowserStore(key, normalize) {
  let value=normalize(null), mode='memory', storage=null;
  let order=['localStorage','sessionStorage'];
  try{if(window.sessionStorage.getItem(key+'.backend')==='session')order.reverse();}catch{}
  for(const name of order) {
    try {
      const candidate=window[name],raw=candidate.getItem(key);
      if(raw!==null) {try{value=normalize(JSON.parse(raw));}catch{value=normalize(null);}}
      candidate.setItem(key+'.probe','1');candidate.removeItem(key+'.probe');
      if(name==='sessionStorage')candidate.setItem(key+'.backend','session');
      storage=candidate;mode=name==='localStorage'?'local':'session';break;
    } catch {}
  }
  return {
    get value(){return value;}, get mode(){return mode;},
    save(next) {
      value=next;
      try{if(storage){storage.setItem(key,JSON.stringify(next));return;}}catch{}
      if(mode==='local')try{window.sessionStorage.setItem(key+'.backend','session');window.sessionStorage.setItem(key,JSON.stringify(next));storage=window.sessionStorage;mode='session';return;}catch{}
      storage=null;mode='memory';
    },
    accepts(event){return event.key===key&&event.storageArea===storage;}
  };
}
