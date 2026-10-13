import {gallerySelection} from '../domain/secrets';
const index=document.getElementById('indexMenu')!;
const toggle=document.getElementById('secrets-index-toggle')!;
function closeIndex(){index.classList.remove('is-visible');index.inert=true;toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{index.inert=false;index.classList.add('is-visible');toggle.setAttribute('aria-expanded','true');});
index.querySelector('.index-menu-close')?.addEventListener('click',closeIndex);
index.addEventListener('click',event=>{if(event.target===index)closeIndex();});
function scrollToSection(id:string) {
  const target=document.getElementById(id);
  if(target)window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-80,behavior:'smooth'});
}
index.querySelectorAll<HTMLAnchorElement>('.index-link').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();closeIndex();scrollToSection(link.hash.slice(1));}));
if(location.hash)requestAnimationFrame(()=>scrollToSection(location.hash.slice(1)));
const modal=document.getElementById('adventuresModal')!;
const modalImage=document.getElementById('adventuresModalImage') as HTMLImageElement;
const modalCaption=document.getElementById('adventuresModalCaption')!;
const track=document.getElementById('adventuresGrid')!;
const buttons=Array.from(track.querySelectorAll<HTMLButtonElement>('.adventure-card'));
const gallery=buttons.map(button=>({cap:button.querySelector('.adventure-caption')!.textContent!,img:button.dataset.gallerySrc!}));
buttons.forEach(button=>button.addEventListener('click',()=>{const item=gallerySelection(gallery,Number(button.dataset.index));modalImage.src=item.img;modalCaption.textContent=item.cap;modal.inert=false;modal.classList.add('is-visible');}));
function closeGallery(){modal.classList.remove('is-visible');modal.inert=true;}
modal.querySelector('.adventures-modal-close')?.addEventListener('click',closeGallery);
modal.addEventListener('click',event=>{if(event.target===modal)closeGallery();});
let timer:number|undefined;
let resume:number|undefined;
function nextSlide(){
  const slide=track.querySelector<HTMLElement>('.adventure-slide');if(!slide)return;
  const styles=getComputedStyle(track);const step=slide.getBoundingClientRect().width+parseFloat(styles.gap||styles.columnGap||'0');
  const max=track.scrollWidth-track.clientWidth;if(max<=0)return;
  const next=track.scrollLeft+step;track.scrollTo({left:next>=max-2?0:next,behavior:'smooth'});
}
function start(){window.clearInterval(timer);timer=window.setInterval(nextSlide,2000);}
function pause(){window.clearInterval(timer);window.clearTimeout(resume);resume=window.setTimeout(start,2500);}
for(const event of ['pointerdown','wheel','touchstart','scroll'])track.addEventListener(event,pause,{passive:true});
start();
const footer=document.getElementById('global-footer');
if(footer)new IntersectionObserver(entries=>document.body.classList.toggle('hide-floating-widgets',entries[0].isIntersecting),{threshold:0.1}).observe(footer);
