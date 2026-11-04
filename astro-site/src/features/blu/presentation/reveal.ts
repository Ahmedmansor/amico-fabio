import {gsap} from 'gsap';

/** Only attached while the real-world panel is near the viewport. */
export function createScrollReveal(panel:HTMLElement) {
  const photo=panel.querySelector('img');
  const caption=panel.querySelector('.blu-reality-caption');
  let frame=0;
  function render() {
    frame=0;
    const rect=panel.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
    gsap.set(photo,{scale:1.15-progress*.15,yPercent:-4+progress*4});
    gsap.set(caption,{y:30*(1-progress)});
  }
  function schedule() {
    if(!frame)frame=requestAnimationFrame(render);
  }
  if(photo)photo.style.willChange='transform';
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  schedule();
  return {destroy(){
    window.removeEventListener('scroll',schedule);
    window.removeEventListener('resize',schedule);
    cancelAnimationFrame(frame);
    photo?.style.removeProperty('will-change');
    gsap.set([photo,caption],{clearProps:'transform'});
  }};
}
