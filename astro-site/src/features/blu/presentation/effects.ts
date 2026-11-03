import {gsap} from 'gsap';

/** Loaded only after preference, hardware hints and a bounded frame sample pass. */
export function createBluEffects(root: HTMLElement) {
  const bubbleLayer=root.querySelector<HTMLElement>('[data-blu-bubbles]');
  const bubbles=Array.from({length:10},(_,index)=>{
    const bubble=document.createElement('span');bubble.className='blu-bubble';
    bubble.style.setProperty('--bubble-left',`${(index*13+7)%100}%`);
    bubble.style.setProperty('--bubble-size',`${8+index%4*5}px`);
    bubbleLayer?.append(bubble);return bubble;
  });
  const context=gsap.context(()=>{
    gsap.to('.blu-flower',{y:25,rotation:12,duration:14,repeat:-1,yoyo:true,ease:'sine.inOut',stagger:2});
    gsap.to('.blu-jellyfish',{y:-35,x:15,duration:7,repeat:-1,yoyo:true,ease:'sine.inOut'});
    for(const [index,bubble]of bubbles.entries())gsap.to(bubble,{y:()=>-innerHeight-60,duration:12+index,delay:index*.7,repeat:-1,ease:'none'});
  },root);
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
    observer.disconnect();root.removeEventListener('pointermove',pointer);
    for(const tween of cardTweens.values()){tween.kill();gsap.set(tween.targets(),{clearProps:'transform'});}
    context.revert();bubbles.forEach(bubble=>bubble.remove());
  }};
}
