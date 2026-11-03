document.querySelectorAll<HTMLElement>('.faq-item').forEach(item=>{
 const button=item.querySelector<HTMLButtonElement>('.faq-toggle')!,answer=item.querySelector<HTMLElement>('.faq-answer')!,icon=item.querySelector<HTMLElement>('.faq-icon');button.setAttribute('aria-expanded','false');answer.style.maxHeight='0px';
 button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));answer.style.maxHeight=open?`${answer.scrollHeight}px`:'0px';item.classList.toggle('is-open',open);icon?.classList.toggle('rotate-45',open);});
});
