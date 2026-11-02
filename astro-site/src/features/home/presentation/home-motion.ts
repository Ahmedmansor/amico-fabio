// 21st-inspired layered tilt and an accessible review rotator, adapted to Vanilla JS.
// Loaded only for >=768px with no reduced-motion preference; no device sensors.
function mountReviews(){
  const track=document.getElementById('reviewsTrack'),pause=document.querySelector<HTMLButtonElement>('[data-review-pause]');
  if(!track||!pause)return ()=>{};
  let visible=false,hovered=false,timer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{clearInterval(timer);timer=undefined;};
  const synchronize=()=>{
    stop();
    if(!visible||hovered||document.hidden||track.contains(document.activeElement)||pause.dataset.paused==='true')return;
    timer=setInterval(()=>{
      const max=track.scrollWidth-track.clientWidth;
      const card=track.querySelector<HTMLElement>('.review-card')!;
      const gap=Number.parseFloat(getComputedStyle(track).columnGap)||20;
      const wrap=track.scrollLeft>=max-4;
      track.scrollTo({left:wrap?0:Math.min(max,track.scrollLeft+card.offsetWidth+gap),behavior:wrap?'instant':'smooth'});
    },6000);
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;synchronize();},{threshold:.25});
  observer.observe(track);
  const enter=()=>{hovered=true;synchronize();},leave=()=>{hovered=false;synchronize();};
  const blur=()=>queueMicrotask(synchronize);
  track.addEventListener('pointerenter',enter);track.addEventListener('pointerleave',leave);
  track.addEventListener('focusin',stop);track.addEventListener('focusout',blur);
  track.addEventListener('home:reviews-state',synchronize);document.addEventListener('visibilitychange',synchronize);
  return ()=>{stop();observer.disconnect();track.removeEventListener('pointerenter',enter);track.removeEventListener('pointerleave',leave);track.removeEventListener('focusin',stop);track.removeEventListener('focusout',blur);track.removeEventListener('home:reviews-state',synchronize);document.removeEventListener('visibilitychange',synchronize);};
}

function mountHero(){
  const host=document.getElementById('hero-slider-section');
  if(!host)return ()=>{};
  const slides=[...host.querySelectorAll('.hero-slide')];
  let visible=false,index=0,timer:ReturnType<typeof setInterval>|undefined;
  const synchronize=()=>{
    clearInterval(timer);timer=undefined;
    if(!visible||document.hidden||slides.length<2)return;
    timer=setInterval(()=>{slides[index].classList.remove('active-slide');index=(index+1)%slides.length;slides[index].classList.add('active-slide');},5000);
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;synchronize();});observer.observe(host);
  document.addEventListener('visibilitychange',synchronize);
  return ()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',synchronize);slides.forEach((slide,index)=>slide.classList.toggle('active-slide',index===0));};
}

export function mountHomeMotion(){
  const cleanups=[mountReviews(),mountHero()];
  return ()=>cleanups.forEach(cleanup=>cleanup());
}
