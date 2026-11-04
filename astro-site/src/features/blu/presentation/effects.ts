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
  const context = gsap.context(() => {
    gsap.to('.blu-rays', {rotation: 5, xPercent: 3, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut'});
    gsap.to('.blu-flower', {y: 25, rotation: 12, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 2});
    root.querySelectorAll<SVGSVGElement>('.blu-medusa').forEach((jelly, index) => {
      const swim = gsap.timeline({repeat: -1, yoyo: true});
      swim.fromTo(jelly, {xPercent: -18, rotation: -12}, {
        xPercent: index === 1 ? -54 : 74, yPercent: -46, rotation: 14,
        duration: 4 + index, ease: 'sine.inOut'
      });
      gsap.to(jelly.querySelector('.blu-bell'), {scaleX: .84, scaleY: 1.12, transformOrigin: '50% 80%', duration: .9 + index * .12, repeat: -1, yoyo: true, ease: 'sine.inOut'});
      gsap.to(jelly.querySelector('.blu-tendrils'), {skewX: 9, scaleY: .87, transformOrigin: '50% 0%', duration: 1.2 + index * .14, repeat: -1, yoyo: true, ease: 'sine.inOut'});
    });
    bubbles.forEach((bubble, index) => {
      // Start at different depths so the water is already alive on the first frame.
      gsap.to(bubble, {y: () => -innerHeight - 100, duration: 5 + index % 7, repeat: -1, ease: 'none'})
        .progress(((index * 17) % 26) / 26);
      gsap.to(bubble, {x: 16 + index % 5 * 6, duration: 1.5 + index % 3, repeat: -1, yoyo: true, ease: 'sine.inOut'});
    });
    gsap.from('.blu-portal-title', {y: 14, rotation: -3, duration: .85, ease: 'back.out(1.2)'});
  }, root);
  const panel = root.querySelector<HTMLElement>('.blu-portal-panel');
  function tilt(event: PointerEvent) {
    if (!panel || event.pointerType !== 'mouse') return;
    const rect = panel.getBoundingClientRect();
    panel.style.setProperty('--tilt-x', `${(0.5 - (event.clientY - rect.top) / rect.height) * 8}deg`);
    panel.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`);
  }
  function resetTilt() {
    panel?.style.removeProperty('--tilt-x');
    panel?.style.removeProperty('--tilt-y');
  }
  panel?.addEventListener('pointermove', tilt, {passive: true});
  panel?.addEventListener('pointerleave', resetTilt);
  const visible=new Set<Element>();
  const cardTweens=new Map<Element,gsap.core.Tween>();
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.isIntersecting){
        visible.add(entry.target);
        if(!cardTweens.has(entry.target))cardTweens.set(entry.target,gsap.fromTo(entry.target,{y:24},{y:0,duration:.65,ease:'power2.out'}));
      } else visible.delete(entry.target);
    }
  },{threshold:.12});
  root.querySelectorAll('[data-experience-card]').forEach(card=>observer.observe(card));
  const pointer=(event:PointerEvent)=>{
    if(event.pointerType!=='mouse')return;
    const card=(event.target as Element).closest<HTMLElement>('[data-experience-card]');
    if(!card||!visible.has(card))return;
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--pointer-x',`${event.clientX-rect.left}px`);
    card.style.setProperty('--pointer-y',`${event.clientY-rect.top}px`);
  };
  root.addEventListener('pointermove',pointer,{passive:true});
  return {destroy(){
    panel?.removeEventListener('pointermove', tilt);panel?.removeEventListener('pointerleave', resetTilt);resetTilt();
    observer.disconnect();root.removeEventListener('pointermove',pointer);
    for(const tween of cardTweens.values()){tween.kill();gsap.set(tween.targets(),{clearProps:'transform'});}
    context.revert();bubbles.forEach(bubble=>bubble.remove());
  }};
}
