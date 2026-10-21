document.querySelector('[data-guide-print]').addEventListener('click',()=>{
  const opened=[...document.querySelectorAll('details')].map(d=>[d,d.open]);
  for(const [detail] of opened)detail.open=true;
  window.addEventListener('afterprint',()=>{for(const [detail,open] of opened)detail.open=open;},{once:true});
  window.print();
});
