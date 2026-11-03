import {advanceTrack,mountAutoAdvance} from '../../../shared/presentation/auto-advance';

export function mountHomeMotion(){
 const cleanups:(()=>void)[]=[];
 const hero=document.querySelector<HTMLElement>('.hero-slider-bg');
 const control=(id:string)=>document.querySelector<HTMLButtonElement>(`[data-auto-pause-for="${id}"]`)??undefined;
 if(hero)cleanups.push(mountAutoAdvance(hero,{interval:5000,button:control(hero.id),advance:async active=>{
  hero.querySelectorAll<HTMLTemplateElement>('template[data-hero-slide]').forEach(template=>template.replaceWith(template.content));
  const slides=[...hero.querySelectorAll<HTMLImageElement>('.hero-slide')];
  if(matchMedia('(max-width:767px)').matches){
   const next=Math.min(slides.length-1,(Math.round(hero.scrollLeft/hero.clientWidth)+1)%slides.length);
   await slides[next]?.decode().catch(()=>{});if(active())advanceTrack(hero,'.hero-slide-slot');
  }else{
   const current=Math.max(0,slides.findIndex(slide=>slide.classList.contains('active-slide'))),next=(current+1)%slides.length;
   await slides[next]?.decode().catch(()=>{});if(active())slides.forEach((slide,index)=>slide.classList.toggle('active-slide',index===next));
  }
 }}));
 const reviews=document.getElementById('reviewsTrack');
 if(reviews)cleanups.push(mountAutoAdvance(reviews,{interval:6000,button:document.querySelector<HTMLButtonElement>('[data-review-pause]')??undefined,stateEvent:'home:reviews-state',advance:()=>advanceTrack(reviews,'.review-card')}));
 const videos=document.getElementById('home-video-track');
 if(videos)cleanups.push(mountAutoAdvance(videos,{interval:7000,button:control(videos.id),enabled:()=>matchMedia('(max-width:767px)').matches,advance:()=>advanceTrack(videos,'.home-video-card')}));
 return ()=>cleanups.forEach(cleanup=>cleanup());
}
