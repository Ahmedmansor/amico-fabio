export {};
sessionStorage.setItem('fabio_nav_source','details');
const booking=document.getElementById('booking-card-container')!,sticky=document.getElementById('sticky-mobile-book')!;
sticky.querySelector('button')!.addEventListener('click',()=>booking.scrollIntoView({behavior:'smooth'}));
setTimeout(()=>sticky.classList.remove('translate-y-32'),200);
new IntersectionObserver(entries=>{const hide=entries[0].isIntersecting&&entries[0].intersectionRatio>0.1;sticky.classList.toggle('opacity-0',hide);sticky.classList.toggle('pointer-events-none',hide);sticky.classList.toggle('opacity-100',!hide);},{threshold:[0,0.1,1]}).observe(booking);
setInterval(()=>{const labels=[sticky.querySelector('span'),document.querySelector('#btn-submit-booking span')];labels.forEach(el=>el?.classList.add('animate-wiggle'));setTimeout(()=>labels.forEach(el=>el?.classList.remove('animate-wiggle')),1200);},8000);
const modal=document.getElementById('included-trip-modal')!,content=document.getElementById('included-trip-content')!;
let modalTimer:number|undefined;
function apply(image:HTMLImageElement,src:string){image.classList.remove('hero-img-animate');void image.offsetWidth;image.removeAttribute('srcset');image.src=src;image.classList.add('hero-img-animate');}
function bindGallery(host:Element,image:HTMLImageElement,auto=false){const thumbs=Array.from(host.querySelectorAll<HTMLElement>('[data-gallery-src]'));let index=0;const start=()=>{clearInterval(modalTimer);if(auto&&thumbs.length>1)modalTimer=window.setInterval(()=>{index=(index+1)%thumbs.length;apply(image,thumbs[index].dataset.gallerySrc!);},2000);};thumbs.forEach((thumb,i)=>thumb.addEventListener('click',()=>{index=i;apply(image,thumb.dataset.gallerySrc!);start();}));start();}
bindGallery(document.getElementById('gallery-grid')!,document.getElementById('hero-bg-img') as HTMLImageElement);
document.querySelectorAll<HTMLButtonElement>('#included-trips-grid [data-trip-id]').forEach(card=>{
 const slides=JSON.parse(card.dataset.slides!) as string[],image=card.querySelector('img')!;let index=0;
 if(slides.length>1)setInterval(()=>{image.style.opacity='0';setTimeout(()=>{index=(index+1)%slides.length;image.removeAttribute('srcset');image.src=slides[index];image.style.opacity='1';},200);},3000);
 card.addEventListener('click',()=>{const template=document.getElementById(`included-template-${card.dataset.tripId}`) as HTMLTemplateElement;content.replaceChildren(template.content.cloneNode(true));modal.classList.remove('hidden');modal.querySelector('.overflow-y-auto')!.scrollTop=0;document.body.style.overflow='hidden';bindGallery(content.querySelector('[data-field="included-trip-modal-gallery"]')!,content.querySelector('[data-field="included-trip-modal-hero-img"]')!,true);});
});
function close(){modal.classList.add('hidden');document.body.style.overflow='';clearInterval(modalTimer);}
document.getElementById('included-trip-modal-close')!.addEventListener('click',close);
modal.addEventListener('click',event=>{if(event.target===modal)close();});
