(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const nodes=[...document.querySelectorAll('[data-reveal]')];
  if(!reduced.matches&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.08});
    nodes.forEach(node=>{node.classList.add('will-reveal');observer.observe(node);});
  }
  // Micro-motion runs only in response to a fine pointer, never in a frame loop.
  if(fine.matches&&!reduced.matches){
    document.querySelectorAll('[data-magnetic]').forEach(button=>{
      let frame=0,dx=0,dy=0;
      button.addEventListener('pointermove',e=>{const r=button.getBoundingClientRect();dx=(e.clientX-r.left-r.width/2)*.055;dy=(e.clientY-r.top-r.height/2)*.075;if(!frame)frame=requestAnimationFrame(()=>{frame=0;button.style.translate=`${dx}px ${dy}px`;});});
      const reset=()=>{cancelAnimationFrame(frame);frame=0;button.style.translate='';};
      button.addEventListener('pointerleave',reset);button.addEventListener('blur',reset);button.addEventListener('click',reset);
    });
  }
  const chapters=[...document.querySelectorAll('.hero-chapters>a[href^="#"]')].filter(a=>document.querySelector(a.getAttribute('href'))?.matches('[data-route-stop]'));
  if(chapters.length&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)for(const a of chapters)a.setAttribute('aria-current',a.hash==='#'+entry.target.id?'location':'false');},{rootMargin:'-20% 0px -45% 0px',threshold:0});
    chapters.forEach(a=>observer.observe(document.querySelector(a.hash)));
  }
})();
