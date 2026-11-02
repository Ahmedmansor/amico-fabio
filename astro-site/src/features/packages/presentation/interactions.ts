export {};
try{sessionStorage.setItem('fabio_nav_source','details');}catch{/* Optional return navigation. */}
const modal=document.getElementById('included-trip-modal') as HTMLDialogElement;
const content=document.getElementById('included-trip-content')!;
const scroll=modal.querySelector<HTMLElement>('.included-trip-scroll')!;
const closeButton=document.getElementById('included-trip-modal-close')!;
let opener:HTMLButtonElement|null=null;
function bindGallery(host:Element,image:HTMLImageElement){
 const thumbs=[...host.querySelectorAll<HTMLButtonElement>('[data-gallery-src]')];
 thumbs.forEach(thumb=>thumb.addEventListener('click',()=>{
  image.removeAttribute('srcset');image.src=thumb.dataset.gallerySrc!;
  thumbs.forEach(button=>button.setAttribute('aria-pressed',String(button===thumb)));
 }));
}
document.querySelectorAll<HTMLButtonElement>('#included-trips-grid [data-trip-id]').forEach(card=>card.addEventListener('click',()=>{
 opener=card;
 const template=document.getElementById(`included-template-${card.dataset.tripId}`) as HTMLTemplateElement;
 content.replaceChildren(template.content.cloneNode(true));
 bindGallery(content.querySelector('[data-field="included-trip-modal-gallery"]')!,content.querySelector('[data-field="included-trip-modal-hero-img"]')!);
 modal.showModal();scroll.scrollTop=0;closeButton.focus({preventScroll:true});
}));
closeButton.addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>opener?.focus({preventScroll:true}));
let backdropStart=false;
const outside=(event:PointerEvent|MouseEvent)=>{
 const r=modal.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;
};
modal.addEventListener('pointerdown',event=>{backdropStart=event.target===modal&&outside(event);});
modal.addEventListener('click',event=>{if(backdropStart&&event.target===modal&&outside(event))modal.close();backdropStart=false;});
modal.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const focusable=[...modal.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')].filter(n=>n.getClientRects().length);
 const first=focusable[0],last=focusable.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
});
