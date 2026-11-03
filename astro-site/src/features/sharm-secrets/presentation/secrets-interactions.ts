import {gallerySelection} from '../domain/secrets';
import {mountAutoAdvance,advanceTrack} from '../../../shared/presentation/auto-advance';
const index=document.getElementById('indexMenu') as HTMLDialogElement;
const toggle=document.getElementById('secrets-index-toggle')!;
function scrollToSection(id:string){const target=document.getElementById(id);target?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
toggle.addEventListener('click',()=>{index.showModal();toggle.setAttribute('aria-expanded','true');});
index.querySelector('.index-menu-close')?.addEventListener('click',()=>index.close());
index.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});});
index.querySelectorAll<HTMLAnchorElement>('.index-link').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();index.close();scrollToSection(link.hash.slice(1));}));
if(location.hash)requestAnimationFrame(()=>scrollToSection(location.hash.slice(1)));
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)index.querySelectorAll<HTMLAnchorElement>('.index-link').forEach(link=>{if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -60% 0px'});
document.querySelectorAll('.sharm-app>.section').forEach(section=>observer.observe(section));
const modal=document.getElementById('adventuresModal') as HTMLDialogElement;
const modalImage=document.getElementById('adventuresModalImage') as HTMLImageElement;
const modalCaption=document.getElementById('adventuresModalCaption')!;
const track=document.getElementById('adventuresGrid')!;
const buttons=[...track.querySelectorAll<HTMLButtonElement>('.adventure-card')];
const gallery=buttons.map(button=>({cap:button.querySelector('.adventure-caption')!.textContent!,img:button.dataset.gallerySrc!}));
let opener:HTMLButtonElement|undefined;
buttons.forEach(button=>button.addEventListener('click',()=>{opener=button;const item=gallerySelection(gallery,Number(button.dataset.index));modalImage.src=item.img;modalImage.alt=item.cap;modalCaption.textContent=item.cap;modal.showModal();}));
modal.querySelector('.adventures-modal-close')?.addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>opener?.focus({preventScroll:true}));
for(const dialog of [index,modal]){
 let outsideStart=false;const outside=(e:MouseEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{outsideStart=e.target===dialog&&outside(e);});
 dialog.addEventListener('click',e=>{if(outsideStart&&e.target===dialog&&outside(e))dialog.close();outsideStart=false;});
 dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...dialog.querySelectorAll<HTMLElement>('button,a[href]')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
}
const media=matchMedia('(prefers-reduced-motion:no-preference)');let cleanup:(()=>void)|undefined;
function synchronize(){cleanup?.();cleanup=undefined;if(media.matches)cleanup=mountAutoAdvance(track,{interval:7000,button:document.querySelector<HTMLButtonElement>('[data-auto-pause-for="adventuresGrid"]')??undefined,advance:()=>advanceTrack(track,'.adventure-slide')});}
synchronize();media.addEventListener('change',synchronize);
const floating=document.getElementById('gh-fab-wrapper')!;const visibility=()=>floating.dataset.contactMotion=String(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);
const footer=document.getElementById('global-footer');if(footer)new IntersectionObserver(entries=>document.body.classList.toggle('hide-floating-widgets',entries[0].isIntersecting),{threshold:.1}).observe(footer);
