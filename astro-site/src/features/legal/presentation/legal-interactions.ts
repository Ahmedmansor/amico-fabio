const mobile=document.querySelector<HTMLDetailsElement>('.legal-mobile-toc');
const links=[...document.querySelectorAll<HTMLAnchorElement>('[data-legal-toc] a')];
for(const link of links)link.addEventListener('click',()=>{
 // Preserve native fragment activation before hiding the touched mobile link.
 if(mobile?.contains(link))setTimeout(()=>{
  mobile.open=false;
  document.getElementById(link.hash.slice(1))?.scrollIntoView({block:'start',behavior:'instant'});
 },0);
});
mobile?.addEventListener('keydown',event=>{if(event.key==='Escape'){mobile.open=false;mobile.querySelector('summary')?.focus();}});
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting)for(const link of links){
   if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  }
 },{rootMargin:'-100px 0px -60% 0px',threshold:0});
 document.querySelectorAll('.legal-section').forEach(section=>observer.observe(section));
 const footer=document.getElementById('global-footer');
 if(footer)new IntersectionObserver(entries=>document.body.classList.toggle('hide-floating-widgets',entries[0].isIntersecting),{threshold:.1}).observe(footer);
}
export {};
