// Native disclosures keep navigation usable without JavaScript.
const header=document.getElementById('global-header');
const disclosures=[...(header?.querySelectorAll<HTMLDetailsElement>('[data-header-disclosure]')??[])];
function close(except?:HTMLDetailsElement){for(const item of disclosures)if(item!==except)item.open=false;}
for(const item of disclosures){
 item.addEventListener('toggle',()=>{if(item.open)close(item);});
 item.addEventListener('keydown',event=>{if(event.key==='Escape'&&item.open){item.open=false;item.querySelector('summary')?.focus();event.stopPropagation();}});
}
// Safari can blur a summary without focusing the tapped link. Closing on that
// focusout, or hiding the link during its click, cancels native navigation.
document.addEventListener('focusin',event=>{
 const target=event.target as Element;
 close(target.closest<HTMLDetailsElement>('[data-header-disclosure]')??undefined);
});
document.addEventListener('click',event=>{
 const target=event.target as Element;
 if(!target.closest('[data-header-disclosure]')){close();return;}
 const link=target.closest<HTMLAnchorElement>('a[href]');
 if(!link)return;
 const destination=new URL(link.href,location.href);
 // Full-page links leave naturally. Same-page anchors close after their native
 // default action, keeping the tapped link rendered throughout activation.
 if(destination.origin===location.origin&&destination.pathname===location.pathname&&destination.search===location.search&&destination.hash)setTimeout(()=>close(),0);
});
header?.querySelectorAll<HTMLAnchorElement>('[data-lang]').forEach(link=>link.addEventListener('click',()=>{const locale=link.dataset.lang;if(locale)try{localStorage.setItem('fabio_lang',locale);localStorage.setItem('preferredLanguage',locale);}catch{/* Navigation works without storage. */}}));
window.matchMedia('(min-width:1200px)').addEventListener('change',()=>close());
export {};
