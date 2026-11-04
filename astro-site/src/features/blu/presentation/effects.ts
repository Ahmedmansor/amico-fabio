import {gsap} from 'gsap';

/** Loaded only after preference, hardware hints and a bounded frame sample pass. */
export function createBluEffects(root: HTMLElement) {
  const bubbleLayer=root.querySelector<HTMLElement>('[data-blu-bubbles]');
  const bubbles = Array.from({length: 26}, (_, index) => {
    const bubble = document.createElement('span');
    bubble.className = 'blu-bubble';
    bubble.style.setProperty('--bubble-left', `${(index * 37 + 2) % 100}%`);
    bubble.style.setProperty('--bubble-size', `${8 + (index * 7) % 30}px`);
    bubbleLayer?.append(bubble);
    return bubble;
  });
  const animations:Animation[]=[];
  const ambient=new Map<Element,Animation>();
  function animate(element:Element,keyframes:Keyframe[],options:KeyframeAnimationOptions) {
    const animation=element.animate(keyframes,options);
    animations.push(animation);
    return animation;
  }
  const rays=root.querySelector('.blu-rays');
  if(rays)animate(rays,[{transform:'translate3d(0,0,0) rotate(0deg)'},{transform:'translate3d(2%,0,0) rotate(4deg)'}],{duration:9000,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
  root.querySelectorAll('.blu-flower').forEach((flower,index)=>{
    const animation=animate(flower,[{transform:'translate3d(0,0,0) rotate(0deg)'},{transform:'translate3d(0,25px,0) rotate(12deg)'}],{duration:14000,delay:index*500,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
    animation.pause();ambient.set(flower,animation);
  });
  root.querySelectorAll('.blu-medusa').forEach((jelly,index)=>{
    const direction=index===1?-45:55;
    const animation=animate(jelly,[
      {transform:'translate3d(-12%,0,0) rotate(-8deg) scale(1,1)'},
      {transform:`translate3d(${direction/2}%,-20%,0) rotate(0deg) scale(.93,1.04)`},
      {transform:`translate3d(${direction}%,-40%,0) rotate(10deg) scale(1,1)`}
    ],{duration:5000+index*800,iterations:Infinity,direction:'alternate',easing:'ease-in-out'});
    animation.pause();ambient.set(jelly,animation);
  });
  const rise=innerHeight+100;
  bubbles.forEach((bubble,index)=>{
    const duration=(7+index%7)*1000;
    const sway=16+index%5*6;
    const animation=animate(bubble,[
      {transform:'translate3d(0,0,0)'},
      {transform:`translate3d(${sway}px,${-rise/2}px,0)`},
      {transform:`translate3d(0,${-rise}px,0)`}
    ],{duration,iterations:Infinity,easing:'linear'});
    animation.currentTime=duration*((index*17)%26)/26;
  });
  const ambientObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const animation=ambient.get(entry.target);
      if(entry.isIntersecting)animation?.play();else animation?.pause();
    }
  });
  ambient.forEach((_,element)=>ambientObserver.observe(element));
  let disposed=false;
  let revealVisible=false;
  let revealGeneration=0;
  let reveal:ReturnType<typeof import('./reveal')['createScrollReveal']>|undefined;
  const reality=root.querySelector<HTMLElement>('.blu-reality');
  const revealObserver=new IntersectionObserver(entries=>{
    for(const entry of entries) {
      revealVisible=entry.isIntersecting;
      const token=++revealGeneration;
      reveal?.destroy();reveal=undefined;
      if(!revealVisible||!reality)continue;
      void import('./reveal').then(({createScrollReveal})=>{
        if(!disposed&&revealVisible&&token===revealGeneration)reveal=createScrollReveal(reality);
      }).catch(()=>{/* The static photo remains fully visible if enhancement loading fails. */});
    }
  });
  if(reality)revealObserver.observe(reality);
  let pointerFrame=0;
  let pointerX=0;
  let pointerY=0;
  const panel = root.querySelector<HTMLElement>('.blu-portal-panel');
  function tilt(event: PointerEvent) {
    if (!panel || event.pointerType !== 'mouse') return;
    pointerX=event.clientX;pointerY=event.clientY;
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;
      const rect=panel.getBoundingClientRect();
      panel.style.setProperty('--tilt-x',`${(0.5-(pointerY-rect.top)/rect.height)*8}deg`);
      panel.style.setProperty('--tilt-y',`${((pointerX-rect.left)/rect.width-0.5)*10}deg`);
    });
  }
  function resetTilt() {
    cancelAnimationFrame(pointerFrame);pointerFrame=0;
    panel?.style.removeProperty('--tilt-x');
    panel?.style.removeProperty('--tilt-y');
  }
  panel?.addEventListener('pointermove', tilt, {passive: true});
  panel?.addEventListener('pointerleave', resetTilt);
  const cardTweens=new Map<Element,gsap.core.Tween>();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.isIntersecting){
        cardTweens.get(entry.target)?.resume();
        if(!cardTweens.has(entry.target))cardTweens.set(entry.target,gsap.fromTo(entry.target,{y:24},{y:0,duration:.65,ease:'power2.out'}));
      } else {cardTweens.get(entry.target)?.pause();}
    }
  },{threshold:.12});
  root.querySelectorAll('[data-experience-card]').forEach(card=>observer.observe(card));
  return {destroy(){
    panel?.removeEventListener('pointermove', tilt);panel?.removeEventListener('pointerleave', resetTilt);resetTilt();
    disposed=true;revealGeneration++;revealObserver.disconnect();reveal?.destroy();ambientObserver.disconnect();
    observer.disconnect();
    for(const tween of cardTweens.values()){tween.kill();gsap.set(tween.targets(),{clearProps:'transform'});}
    animations.forEach(animation=>animation.cancel());bubbles.forEach(bubble=>bubble.remove());
  }};
}
