import './product-section-nav';
const root=document.querySelector<HTMLElement>('.product-detail');
if(root){
 const dialog=document.querySelector<HTMLDialogElement>('[data-product-gallery-dialog]')!;
 const choices=[...dialog.querySelectorAll<HTMLButtonElement>('[data-gallery-select]')];
 const image=dialog.querySelector<HTMLImageElement>('[data-lightbox-image]')!,caption=dialog.querySelector<HTMLElement>('[data-gallery-caption]')!;
 let opener:HTMLElement|null=null,current=0;
 function show(next:number){
  current=(next+choices.length)%choices.length;
  const selected=choices[current];image.loading='eager';image.src=selected.dataset.fullSrc!;image.alt=selected.dataset.imageAlt!;caption.textContent=selected.dataset.caption!;
  choices.forEach((choice,index)=>choice.setAttribute('aria-pressed',String(index===current)));
  selected.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 root.querySelectorAll<HTMLButtonElement>('[data-gallery-open]').forEach(button=>button.addEventListener('click',()=>{opener=button;dialog.showModal();show(Number(button.dataset.galleryOpen));dialog.querySelector<HTMLButtonElement>('[data-gallery-close]')?.focus({preventScroll:true});}));
 choices.forEach((choice,index)=>choice.addEventListener('click',()=>show(index)));
 dialog.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>show(current-1));
 dialog.querySelector('[data-gallery-next]')?.addEventListener('click',()=>show(current+1));
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}});
 dialog.querySelector('[data-gallery-close]')?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
}
export {};
