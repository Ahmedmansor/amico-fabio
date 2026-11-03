// Native disclosures keep navigation usable without JavaScript.
const header=document.getElementById('global-header');
const disclosures=[...(header?.querySelectorAll<HTMLDetailsElement>('[data-header-disclosure]')??[])];
function close(except?:HTMLDetailsElement){for(const item of disclosures)if(item!==except)item.open=false;}
for(const item of disclosures){
 item.addEventListener('toggle',()=>{if(item.open)close(item);});
 item.addEventListener('keydown',event=>{if(event.key==='Escape'&&item.open){item.open=false;item.querySelector('summary')?.focus();event.stopPropagation();}});
 item.addEventListener('focusout',event=>{if(!item.contains(event.relatedTarget as Node|null))item.open=false;});
}
document.addEventListener('click',event=>{const target=event.target as Element;if(!target.closest('[data-header-disclosure]')||target.closest('a'))close();});
header?.querySelectorAll<HTMLAnchorElement>('[data-lang]').forEach(link=>link.addEventListener('click',()=>{const locale=link.dataset.lang;if(locale)try{localStorage.setItem('fabio_lang',locale);localStorage.setItem('preferredLanguage',locale);}catch{/* Navigation works without storage. */}}));
window.matchMedia('(min-width:1200px)').addEventListener('change',()=>close());
export {};
