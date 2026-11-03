import {acceptedCategory,showPreferences} from 'vanilla-cookieconsent';
const track=document.getElementById('osh-videos-track')!;
const modal=document.getElementById('osh-video-modal')!;
const body=document.getElementById('osh-video-modal-body')!;
let timer:number|undefined,opened=false;
function start(){clearInterval(timer);timer=window.setInterval(()=>{if(opened)return;const max=track.scrollWidth-track.clientWidth;const card=track.querySelector<HTMLElement>('.osh-video-card');const step=card?card.clientWidth+20:320;track.scrollTo({left:track.scrollLeft>=max-10?0:track.scrollLeft+step,behavior:'smooth'});},3500);}
function close(fromPopState=false){if(!opened)return;opened=false;modal.classList.remove('is-active');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';body.replaceChildren();if(!fromPopState&&history.state?.videoModalOpen){history.back();}start();}
function open(card:HTMLElement){
 if(!acceptedCategory('external')){showPreferences();return;}
 const id=card.dataset.videoId!;if(!/^\d+$/.test(id))throw new Error('[sharm-offer] Invalid Vimeo ID.');
 clearInterval(timer);opened=true;
 const frame=document.createElement('iframe');frame.src=`https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;frame.className='osh-video-modal-iframe';frame.title=card.querySelector('h3')!.textContent!;frame.setAttribute('frameborder','0');frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;body.replaceChildren(frame);
 modal.classList.add('is-active');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';try{history.pushState({videoModalOpen:true},'');}catch{}
}
track.querySelectorAll<HTMLElement>('.osh-video-card').forEach(card=>{card.addEventListener('click',()=>open(card));card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(card);}});});
document.getElementById('osh-video-modal-close')!.addEventListener('click',()=>close());document.getElementById('osh-video-modal-backdrop')!.addEventListener('click',()=>close());
document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});window.addEventListener('popstate',()=>close(true));start();
