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
  const ambient = new Map<Element,gsap.core.Animation[]>();
  const context = gsap.context(() => {
    gsap.to('.blu-rays', {rotation: 5, xPercent: 3, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut'});
    gsap.to('.blu-flower', {y: 25, rotation: 12, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 2});
    root.querySelectorAll<SVGSVGElement>('.blu-medusa').forEach((jelly, index) => {
      const swim = gsap.timeline({repeat: -1, yoyo: true, paused:true});
      swim.fromTo(jelly, {xPercent: -18, rotation: -12}, {
        xPercent: index === 1 ? -54 : 74, yPercent: -46, rotation: 14,
        duration: 4 + index, ease: 'sine.inOut'
      });
      const bell=gsap.to(jelly.querySelector('.blu-bell'), {scaleX: .84, scaleY: 1.12, transformOrigin: '50% 80%', paused:true, duration: .9 + index * .12, repeat: -1, yoyo: true, ease: 'sine.inOut'});
      const tendrils=gsap.to(jelly.querySelector('.blu-tendrils'), {skewX: 9, scaleY: .87, transformOrigin: '50% 0%', paused:true, duration: 1.2 + index * .14, repeat: -1, yoyo: true, ease: 'sine.inOut'});
      ambient.set(jelly,[swim,bell,tendrils]);
    });
    bubbles.forEach((bubble, index) => {
      // Start at different depths so the water is already alive on the first frame.
      gsap.to(bubble, {y: () => -innerHeight - 100, duration: 5 + index % 7, repeat: -1, ease: 'none'})
        .progress(((index * 17) % 26) / 26);
      gsap.to(bubble, {x: 16 + index % 5 * 6, duration: 1.5 + index % 3, repeat: -1, yoyo: true, ease: 'sine.inOut'});
    });

  }, root);
  const ambientObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)ambient.get(entry.target)?.forEach(animation=>entry.isIntersecting?animation.resume():animation.pause());
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
    context.revert();bubbles.forEach(bubble=>bubble.remove());
  }};
}
