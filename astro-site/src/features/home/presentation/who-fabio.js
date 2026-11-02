// Biography is a native modal; no sensor permissions or animation loop.
const openButton=document.querySelector('.wf-bio-btn');
const dialog=document.querySelector('.wf-overlay-bio');
if(openButton&&dialog){
 openButton.addEventListener('click',()=>{dialog.showModal();dialog.querySelector('.wf-bio-scroll').scrollTop=0;dialog.querySelector('#fabio-biography-title').focus({preventScroll:true});});
 dialog.querySelectorAll('[data-close-fabio]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href],[tabindex="0"]')].filter(element=>element.getClientRects().length);
  const first=controls[0],last=controls.at(-1),active=document.activeElement;
  if(event.shiftKey&&(active===first||active===dialog.querySelector('#fabio-biography-title'))){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&active===last){event.preventDefault();first?.focus({preventScroll:true});}
 });
 dialog.addEventListener('close',()=>openButton.focus({preventScroll:true}));
}
export {};
