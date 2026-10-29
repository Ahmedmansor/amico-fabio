// Biography is a native modal; no sensor permissions or animation loop.
const openButton=document.querySelector('.wf-bio-btn');
const dialog=document.querySelector('.wf-overlay-bio');
if(openButton&&dialog){
 openButton.addEventListener('click',()=>dialog.showModal());
 dialog.querySelector('.wf-overlay-close')?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>openButton.focus());
}
export {};
