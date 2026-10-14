export {};
sessionStorage.setItem('fabio_nav_source','details');
document.getElementById('hero-back-btn')!.addEventListener('click',()=>{if(document.referrer)history.back();else location.href=`/${document.documentElement.lang}/explore/`;});
const booking=document.getElementById('booking-card-container')!;
document.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{if(button.closest('#sticky-mobile-book')||button.querySelector('[data-i18n="global.book_now"]')&&!button.closest('#booking-card-container'))button.addEventListener('click',()=>booking.scrollIntoView({behavior:'smooth'}));});
const image=document.getElementById('hero-bg-img') as HTMLImageElement;
const track=document.getElementById('gallery-grid')!;
const buttons=Array.from(track.querySelectorAll<HTMLElement>('[data-gallery-src]'));let index=0,timer:number;
function show(next:number){index=next;image.classList.remove('hero-img-animate');image.removeAttribute('srcset');image.src=buttons[index].dataset.gallerySrc!;void image.offsetWidth;image.classList.add('hero-img-animate');buttons.forEach((button,i)=>button.classList.toggle('is-active',i===index));const selected=buttons[index];track.scrollTo({left:Math.max(0,selected.offsetLeft-(track.clientWidth-selected.offsetWidth)/2),behavior:'smooth'});}
function start(){clearInterval(timer);if(buttons.length>1)timer=window.setInterval(()=>show((index+1)%buttons.length),2000);}
buttons.forEach((button,i)=>button.addEventListener('click',()=>{show(i);start();}));start();
const sticky=document.getElementById('sticky-mobile-book')!;setTimeout(()=>sticky.classList.remove('translate-y-32'),200);
new IntersectionObserver(entries=>{const hide=entries[0].isIntersecting&&entries[0].intersectionRatio>0.2;sticky.classList.toggle('opacity-0',hide);sticky.classList.toggle('pointer-events-none',hide);sticky.classList.toggle('opacity-100',!hide);},{threshold:[0,0.2,0.5,1]}).observe(booking);
const label=sticky.querySelector<HTMLElement>('[data-i18n]');setInterval(()=>{label?.classList.add('animate-wiggle');setTimeout(()=>label?.classList.remove('animate-wiggle'),1200);},8000);
