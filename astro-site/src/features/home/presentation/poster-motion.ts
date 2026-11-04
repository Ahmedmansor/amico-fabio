/** Small pointer/CSS enhancement. No sensors, scroll loop or mobile library. */
export function mountPosterMotion(poster:HTMLElement){
 let visible=false,frame=0;
 const reset=()=>{cancelAnimationFrame(frame);frame=0;for(const key of ['--wf-rx','--wf-ry','--wf-shift-x','--wf-shift-y'])poster.style.removeProperty(key);};
 const synchronize=()=>{poster.dataset.posterVisible=String(visible&&!document.hidden);if(!visible||document.hidden)reset();};
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;synchronize();},{threshold:.15});observer.observe(poster);
 const move=(event:PointerEvent)=>{
  // Touch keeps the gentle CSS drift; pressing/scrolling must not replace it
  // with the stronger desktop perspective and foreground displacement.
  if(event.pointerType!=='mouse'||!matchMedia('(hover:hover) and (pointer:fine)').matches||!visible||document.hidden)return;
  const rect=poster.getBoundingClientRect();
  const x=Math.max(-.5,Math.min(.5,(event.clientX-rect.left)/rect.width-.5));
  const y=Math.max(-.5,Math.min(.5,(event.clientY-rect.top)/rect.height-.5));
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{frame=0;poster.style.setProperty('--wf-rx',`${-y*16}deg`);poster.style.setProperty('--wf-ry',`${x*20}deg`);poster.style.setProperty('--wf-shift-x',`${x*20}px`);poster.style.setProperty('--wf-shift-y',`${y*16}px`);});
 };
 poster.addEventListener('pointermove',move,{passive:true});
 for(const event of ['pointerleave','pointerup','pointercancel'])poster.addEventListener(event,reset);
 document.addEventListener('visibilitychange',synchronize);
 return ()=>{observer.disconnect();document.removeEventListener('visibilitychange',synchronize);poster.removeEventListener('pointermove',move);for(const event of ['pointerleave','pointerup','pointercancel'])poster.removeEventListener(event,reset);reset();delete poster.dataset.posterVisible;};
}
