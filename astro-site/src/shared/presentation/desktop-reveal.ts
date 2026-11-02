// 21st Scroll Reveal pattern, implemented locally with native browser APIs.
// Content is always visible without JS; no above-fold hero or layout animation.
export function mountDesktopReveal(){
 const animations=new Set<Animation>();
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   observer.unobserve(entry.target);
   const element=entry.target as HTMLElement;
   const siblings=[...element.parentElement!.children];
   const animation=element.animate([{opacity:.35,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{
    duration:460,delay:(siblings.indexOf(element)%3)*65,easing:'cubic-bezier(.2,.7,.2,1)'
   });
   animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>{});
  }
 },{threshold:.12});
 document.querySelectorAll('[data-desktop-reveal]').forEach(element=>observer.observe(element));
 return ()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());animations.clear();};
}
