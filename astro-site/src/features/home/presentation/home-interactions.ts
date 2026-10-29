import './who-fabio.js';

const track=document.getElementById('reviewsTrack');
const pause=document.querySelector<HTMLButtonElement>('[data-review-pause]');
if(track&&pause){
  const stop=()=>{
    pause.dataset.paused='true';pause.setAttribute('aria-pressed','true');
    pause.querySelector('span')!.textContent=pause.dataset.resumeLabel!;
    track.dispatchEvent(new Event('home:reviews-state'));
  };
  const move=(direction:number)=>{
    stop();
    const card=track.querySelector<HTMLElement>('.review-card')!;
    const gap=Number.parseFloat(getComputedStyle(track).columnGap)||20;
    track.scrollBy({left:direction*(card.offsetWidth+gap),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  };
  document.querySelector('[data-review-prev]')?.addEventListener('click',()=>move(-1));
  document.querySelector('[data-review-next]')?.addEventListener('click',()=>move(1));
  track.addEventListener('pointerdown',stop,{passive:true});
  track.addEventListener('keydown',stop);
  pause.addEventListener('click',()=>{
    const paused=pause.dataset.paused!=='true';pause.dataset.paused=String(paused);
    pause.setAttribute('aria-pressed',String(paused));
    pause.querySelector('span')!.textContent=paused?pause.dataset.resumeLabel!:pause.dataset.pauseLabel!;
    track.dispatchEvent(new Event('home:reviews-state'));
  });
}

// The desktop/iPad enhancement is a separate chunk, never fetched on mobile.
const motion=matchMedia('(min-width:768px) and (prefers-reduced-motion:no-preference)');
let cleanup:(()=>void)|undefined;
async function synchronizeMotion(){
  if(!motion.matches){cleanup?.();cleanup=undefined;return;}
  const {mountHomeMotion}=await import('./home-motion');
  if(motion.matches&&!cleanup)cleanup=mountHomeMotion();
}
void synchronizeMotion();
motion.addEventListener('change',()=>void synchronizeMotion());

const footer=document.getElementById('global-footer');
if(footer)new IntersectionObserver(entries=>document.body.classList.toggle('hide-floating-widgets',entries[0].isIntersecting),{threshold:.1}).observe(footer);
document.querySelector('[data-dismiss-promo]')?.addEventListener('click',()=>{
  const promo=document.getElementById('promo-banner-container');if(promo)promo.hidden=true;
});
