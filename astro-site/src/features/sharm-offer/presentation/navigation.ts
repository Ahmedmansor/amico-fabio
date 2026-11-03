const menu=document.getElementById('osh-mobile-menu')!;
const overlay=document.getElementById('osh-menu-overlay')!;
const hamburger=document.getElementById('osh-hamburger-btn')!;
function close(){menu.classList.remove('is-open');overlay.classList.remove('is-visible');document.body.style.overflow='';hamburger.setAttribute('aria-expanded','false');}
hamburger.setAttribute('aria-expanded','false');
hamburger.addEventListener('click',()=>{menu.classList.add('is-open');overlay.classList.add('is-visible');document.body.style.overflow='hidden';hamburger.setAttribute('aria-expanded','true');});
overlay.addEventListener('click',close);document.getElementById('osh-menu-close')!.addEventListener('click',close);
menu.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{close();const target=document.querySelector(link.hash);if(target){event.preventDefault();setTimeout(()=>target.scrollIntoView({behavior:'smooth'}),300);}}));
for(const id of ['hero-book-btn','programs-cta-btn'])document.getElementById(id)!.addEventListener('click',event=>{event.preventDefault();document.getElementById('booking-section')!.scrollIntoView({behavior:'smooth'});});
const progress=document.getElementById('osh-scroll-progress')!;
function update(){const max=document.documentElement.scrollHeight-document.documentElement.clientHeight;progress.style.width=`${max>0?Math.min(100,Math.max(0,scrollY/max*100)):0}%`;}
window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);update();
const items=Array.from(document.querySelectorAll<HTMLElement>('.osh-faq-item'));
items.forEach(item=>item.querySelector('button')!.addEventListener('click',()=>{const open=item.classList.contains('is-open');for(const other of items){other.classList.remove('is-open');other.querySelector('button')!.setAttribute('aria-expanded','false');}if(!open){item.classList.add('is-open');item.querySelector('button')!.setAttribute('aria-expanded','true');}}));
