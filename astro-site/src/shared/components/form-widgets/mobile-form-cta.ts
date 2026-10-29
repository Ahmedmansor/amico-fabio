for(const bar of document.querySelectorAll<HTMLElement>('[data-form-mobile-bar]')){
 const target=document.getElementById(bar.dataset.formTarget!);if(!target)continue;
 let formVisible=false,footerVisible=false;
 const update=()=>{bar.hidden=formVisible||footerVisible;bar.inert=bar.hidden;};
 new IntersectionObserver(entries=>{formVisible=entries[0].isIntersecting;update();}).observe(target);
 const footer=document.getElementById('global-footer');if(footer)new IntersectionObserver(entries=>{footerVisible=entries[0].isIntersecting;update();}).observe(footer);
 bar.querySelector('a')?.addEventListener('click',event=>{event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});});
}
export {};
