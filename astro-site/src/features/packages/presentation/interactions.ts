export {};
try{sessionStorage.setItem('fabio_nav_source','details');}catch{/* Optional return navigation. */}
const modal=document.getElementById('included-trip-modal')!,content=document.getElementById('included-trip-content')!;
let opener:HTMLButtonElement|null=null;
function bindGallery(host:Element,image:HTMLImageElement){
 const thumbs=[...host.querySelectorAll<HTMLButtonElement>('[data-gallery-src]')];
 thumbs.forEach(thumb=>thumb.addEventListener('click',()=>{image.removeAttribute('srcset');image.src=thumb.dataset.gallerySrc!;thumbs.forEach(button=>button.classList.toggle('is-active',button===thumb));}));
}
document.querySelectorAll<HTMLButtonElement>('#included-trips-grid [data-trip-id]').forEach(card=>card.addEventListener('click',()=>{
 opener=card;
 const template=document.getElementById(`included-template-${card.dataset.tripId}`) as HTMLTemplateElement;
 content.replaceChildren(template.content.cloneNode(true));modal.classList.remove('hidden');
 modal.querySelector('.overflow-y-auto')!.scrollTop=0;document.body.style.overflow='hidden';
 bindGallery(content.querySelector('[data-field="included-trip-modal-gallery"]')!,content.querySelector('[data-field="included-trip-modal-hero-img"]')!);
 document.getElementById('included-trip-modal-close')!.focus();
}));
function close(){modal.classList.add('hidden');document.body.style.overflow='';opener?.focus({preventScroll:true});}
document.getElementById('included-trip-modal-close')!.addEventListener('click',close);
modal.addEventListener('click',event=>{if(event.target===modal)close();});
modal.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
