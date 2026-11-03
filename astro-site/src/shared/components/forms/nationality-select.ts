document.querySelectorAll<HTMLElement>('[data-nationality-select]').forEach(root => {
  const select=root.querySelector('select')!;
  const trigger=root.querySelector<HTMLButtonElement>('[data-nationality-trigger]')!;
  const list=root.querySelector<HTMLElement>('[data-nationality-options]')!;
  if (!('showPopover' in list)) return;
  const options=[...list.querySelectorAll<HTMLButtonElement>('[data-nationality-value]')];
  const selected=trigger.querySelector<HTMLElement>('[data-nationality-selected]')!;
  const placeholder=selected.textContent!;
  let search='',lastKey=0,anchorTop=0;
  function render() {
    const choice=options.find(option=>option.dataset.nationalityValue===select.value);
    if(choice)selected.replaceChildren(...[...choice.childNodes].map(node=>node.cloneNode(true)));
    else selected.textContent=placeholder;
    options.forEach(option=>option.setAttribute('aria-selected',String(option===choice)));
    if(select.hasAttribute('aria-invalid'))trigger.setAttribute('aria-invalid',select.getAttribute('aria-invalid')!);
    else trigger.removeAttribute('aria-invalid');
  }
  function close(focus=false){list.hidePopover();if(focus)trigger.focus({preventScroll:true});}
  function open(last=false){
    search='';lastKey=0;
    list.showPopover();
    const rect=trigger.getBoundingClientRect(),height=Math.min(280,Math.max(120,innerHeight-24));anchorTop=rect.top;
    list.style.width=`${Math.min(rect.width,innerWidth-24)}px`;
    list.style.left=`${Math.max(12,Math.min(rect.left,innerWidth-list.offsetWidth-12))}px`;
    list.style.maxHeight=`${height}px`;
    list.style.top=`${rect.bottom+height+8<=innerHeight?rect.bottom+6:Math.max(12,rect.top-height-6)}px`;
    (options.find(option=>option.dataset.nationalityValue===select.value)??options[last?options.length-1:0]).focus({preventScroll:true});
    document.activeElement?.scrollIntoView({block:'nearest'});
  }
  function navigate(event:KeyboardEvent){
    const index=options.indexOf(document.activeElement as HTMLButtonElement);
    let next=-1;
    if(event.key==='ArrowDown')next=(index+1)%options.length;
    if(event.key==='ArrowUp')next=(index-1+options.length)%options.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=options.length-1;
    if(event.key==='Escape'){event.preventDefault();close(true);return;}
    if(event.key==='Tab'){close();trigger.focus({preventScroll:true});return;}
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&event.key!==' '){
      search=Date.now()-lastKey>700?event.key:search+event.key;lastKey=Date.now();
      next=options.findIndex(option=>option.textContent!.trim().toLocaleLowerCase().startsWith(search.toLocaleLowerCase()));
    }
    if(next>=0){event.preventDefault();options[next].focus({preventScroll:true});options[next].scrollIntoView({block:'nearest'});}
  }
  trigger.addEventListener('click',()=>list.matches(':popover-open')?close():open());
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open(event.key==='ArrowUp');}});
  list.addEventListener('keydown',navigate);
  list.addEventListener('toggle',()=>trigger.setAttribute('aria-expanded',String(list.matches(':popover-open'))));
  options.forEach(option=>option.addEventListener('click',()=>{
    select.value=option.dataset.nationalityValue!;render();close(true);
    select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));
  }));
  select.addEventListener('change',render);
  select.addEventListener('nationality-sync',render);
  select.addEventListener('focus',()=>trigger.focus());
  new MutationObserver(render).observe(select,{attributes:true,attributeFilter:['aria-invalid']});
  window.addEventListener('resize',()=>close());
  // Avoid leaving a detached popover over a scrolling sidebar or document.
  document.addEventListener('scroll',()=>{if(list.matches(':popover-open')&&Math.abs(trigger.getBoundingClientRect().top-anchorTop)>1)close();},true);
  select.tabIndex=-1;select.setAttribute('aria-hidden','true');root.classList.add('is-enhanced');trigger.hidden=false;render();
});
export {};
