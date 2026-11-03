/** Visible-only native carousel scheduling. No frame loop or background polling. */
export function mountAutoAdvance(host:HTMLElement,options:{interval:number;enabled?:()=>boolean;advance:(active:()=>boolean)=>void|Promise<void>;button?:HTMLButtonElement;stateEvent?:string}){
 let visible=false,touching=false,hovered=false,disposed=false,pending=false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 const button=options.button;
 const overlayVisible=()=>document.documentElement.classList.contains('show--consent')||document.documentElement.classList.contains('show--preferences')||
  [...document.querySelectorAll<HTMLElement>('dialog[open],[role="dialog"]')].some(n=>!n.closest('#cc-main')&&n.getClientRects().length>0&&getComputedStyle(n).visibility!=='hidden');
 let blocked=overlayVisible();
 const active=()=>!disposed&&visible&&!document.hidden&&!blocked&&!touching&&!hovered&&!host.contains(document.activeElement)&&button?.getAttribute('aria-pressed')!=='true'&&(options.enabled?.()??true);
 const stop=()=>{clearTimeout(timer);timer=undefined;host.dataset.autoRunning='false';};
 const synchronize=()=>{
  stop();if(!active()||pending)return;
  host.dataset.autoRunning='true';
  timer=setTimeout(async()=>{timer=undefined;if(!active())return;pending=true;
   try{await options.advance(active);}finally{pending=false;synchronize();}
  },options.interval);
 };
 const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;synchronize();},{threshold:.35});intersection.observe(host);
 const mutation=new MutationObserver(()=>{const next=overlayVisible();if(next!==blocked){blocked=next;synchronize();}});
 mutation.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open','class','hidden']});
 const down=()=>{touching=true;synchronize();},up=()=>{touching=false;synchronize();};
 const enter=(event:PointerEvent)=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches){hovered=true;synchronize();}};
 const leave=()=>{hovered=false;touching=false;synchronize();};
 const blur=()=>queueMicrotask(synchronize);
 const toggle=()=>{
  const paused=button!.getAttribute('aria-pressed')!=='true';button!.setAttribute('aria-pressed',String(paused));
  if(button!.dataset.paused!==undefined)button!.dataset.paused=String(paused);
  const label=paused?button!.dataset.resumeLabel:button!.dataset.pauseLabel;
  const text=button!.querySelector('span');if(text&&label)text.textContent=label;
  const aria=paused?button!.dataset.resumeAria:button!.dataset.pauseAria;if(aria)button!.setAttribute('aria-label',aria);
  synchronize();
 };
 host.addEventListener('pointerdown',down,{passive:true});host.addEventListener('pointerenter',enter);host.addEventListener('pointerleave',leave);
 host.addEventListener('focusin',synchronize);host.addEventListener('focusout',blur);host.addEventListener('wheel',synchronize,{passive:true});
 window.addEventListener('pointerup',up,{passive:true});window.addEventListener('pointercancel',up,{passive:true});
 window.addEventListener('resize',synchronize);document.addEventListener('visibilitychange',synchronize);
 if(options.stateEvent)host.addEventListener(options.stateEvent,synchronize);
 button?.addEventListener('click',toggle);
 return ()=>{disposed=true;stop();intersection.disconnect();mutation.disconnect();
  host.removeEventListener('pointerdown',down);host.removeEventListener('pointerenter',enter);host.removeEventListener('pointerleave',leave);host.removeEventListener('focusin',synchronize);host.removeEventListener('focusout',blur);host.removeEventListener('wheel',synchronize);
  window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('resize',synchronize);document.removeEventListener('visibilitychange',synchronize);
  if(options.stateEvent)host.removeEventListener(options.stateEvent,synchronize);button?.removeEventListener('click',toggle);
 };
}

export function advanceTrack(host:HTMLElement,selector:string){
 const max=host.scrollWidth-host.clientWidth;if(max<2)return;
 const current=host.scrollLeft;
 const left=host.getBoundingClientRect().left;
 const next=[...host.querySelectorAll<HTMLElement>(selector)].map(n=>n.getBoundingClientRect().left-left+current).find(x=>x>current+8);
 host.scrollTo({left:current>=max-4?0:Math.min(max,next??max),behavior:'smooth'});
}
