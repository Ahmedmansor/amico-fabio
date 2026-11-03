import {buildBluMessage,buildBluWhatsApp,canEnhanceMotion,passphrase,smoothFrameSample,type MotionPreference} from '../domain/campaign';
import type {BluCopy} from '../data/campaign';
import {trackBluInquiry} from '../../../shared/analytics/lead';

interface BrowserConfig {locale:string;number:string;copy:BluCopy;experiences:{id:string;title:string}[]}
const root=document.querySelector<HTMLElement>('body[data-campaign="blu"]');
const node=document.getElementById('blu-config');
if(root&&node)initialize(root,JSON.parse(node.textContent||'{}') as BrowserConfig);

function initialize(root:HTMLElement,config:BrowserConfig) {
  const {copy}=config;
  const range=root.querySelector<HTMLInputElement>('#blu-portal-range');
  const overlay=root.querySelector<HTMLElement>('[data-cartoon-overlay]');
  const divider=root.querySelector<HTMLElement>('[data-portal-divider]');
  root.querySelectorAll<HTMLElement>('[data-pose-controls],[data-portal-hint],[data-copy],[data-motion-control]').forEach(element=>element.hidden=false);
  if(range){range.hidden=false;range.addEventListener('input',()=>{
    const value=Math.max(0,Math.min(100,Number(range.value)));
    if(overlay)overlay.style.clipPath=`polygon(0 0,${value}% 0,${value}% 100%,0 100%)`;
    if(divider)divider.style.left=`${value}%`;
  });}
  root.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(button=>button.addEventListener('click',()=>{
    const pose=button.dataset.pose;
    root.querySelectorAll<HTMLButtonElement>('[data-pose]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    for(const n of [1,2,3])root.querySelector(`#fabio-pose-${n}`)?.classList.toggle('hidden',String(n)!==pose);
  }));
  root.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click',async()=>{
    const status=root.querySelector<HTMLElement>('[data-copy-status]');
    try{await navigator.clipboard.writeText(passphrase);if(status)status.textContent=copy.copySuccess;}
    catch{if(status)status.textContent=copy.copyError;}
  });
  root.addEventListener('click',event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[data-experience],a[data-blu-whatsapp]');
    if(!link)return;
    const experience=config.experiences.find(item=>item.id===link.dataset.experience);
    const relatedTitle=link.dataset.relatedTrip?link.querySelector('h3')?.textContent?.trim():undefined;
    const selectedTitle=experience?.title||relatedTitle;
    if(selectedTitle){
      const href=buildBluWhatsApp(config.number,buildBluMessage(copy.waDefaultMsg,copy.selectedLabel,selectedTitle));
      root.querySelectorAll<HTMLAnchorElement>('[data-blu-whatsapp]:not([data-related-trip])').forEach(anchor=>anchor.href=href);
      const status=root.querySelector<HTMLElement>('[data-selection-status]');
      if(status)status.textContent=copy.selectionStatus.replace('{experience}',selectedTitle);
    }
    trackBluInquiry(config.locale);
  });

  const select=root.querySelector<HTMLSelectElement>('#blu-effects');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const device=navigator as Navigator & {deviceMemory?:number;connection?:EventTarget & {saveData?:boolean}};
  let preference:MotionPreference='auto';
  try{const saved=localStorage.getItem('fabio:blu:motion');if(saved==='auto'||saved==='lite'||saved==='full')preference=saved;}catch{/* Optional preference storage. */}
  if(select)select.value=preference;
  let generation=0;
  let effects:ReturnType<typeof import('./effects')['createBluEffects']>|undefined;
  let frame=0;
  let frameCancel:(()=>void)|undefined;
  let downgrade:PerformanceObserver|undefined;
  let degraded=false;
  let disposed=false;
  const blocked=()=>document.hidden||document.documentElement.matches('.show--consent,.show--preferences');
  const signals=()=>({reducedMotion:reduced.matches,saveData:device.connection?.saveData===true,cores:device.hardwareConcurrency||undefined,memory:device.deviceMemory});
  function stop(){
    generation++;cancelAnimationFrame(frame);frameCancel?.();frameCancel=undefined;
    effects?.destroy();effects=undefined;downgrade?.disconnect();downgrade=undefined;
    root.dataset.effects='lite';
    const status=root.querySelector<HTMLElement>('[data-motion-status]');if(status)status.textContent=copy.motionStatusLite;
  }
  function sample(token:number,count:number):Promise<boolean>{
    return new Promise(resolve=>{
      let previous=0;const intervals:number[]=[];
      const finish=(value:boolean)=>{frameCancel=undefined;resolve(value);};
      frameCancel=()=>finish(false);
      const tick=(now:number)=>{
        if(token!==generation||blocked()||disposed){finish(false);return;}
        if(previous)intervals.push(now-previous);previous=now;
        if(intervals.length>=count){finish(smoothFrameSample(intervals));return;}
        frame=requestAnimationFrame(tick);
      };
      frame=requestAnimationFrame(tick);
    });
  }
  async function refresh(){
    stop();
    if(disposed||degraded||blocked()||!canEnhanceMotion(preference,signals()))return;
    const token=generation;
    if(!await sample(token,30)||token!==generation)return;
    try{
      const {createBluEffects}=await import('./effects');
      if(token!==generation||blocked()||!canEnhanceMotion(preference,signals()))return;
      effects=createBluEffects(root);root.dataset.effects='full';
      const status=root.querySelector<HTMLElement>('[data-motion-status]');if(status)status.textContent=copy.motionStatusFull;
      // Check actual animation cost once; no permanent FPS or timer loop.
      if(!await sample(token,90)&&token===generation){degraded=true;stop();return;}
      if(token!==generation)return;
      if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('longtask')){
        let recent:number[]=[];
        downgrade=new PerformanceObserver(list=>{
          const now=performance.now();recent=recent.filter(time=>now-time<5000);
          recent.push(...list.getEntries().filter(entry=>entry.duration>80).map(entry=>entry.startTime));
          if(recent.length>=3){degraded=true;stop();}
        });
        downgrade.observe({type:'longtask'});
      }
    }catch{stop();}
  }
  const change=()=>{preference=select?.value as MotionPreference||'auto';degraded=false;try{localStorage.setItem('fabio:blu:motion',preference);}catch{}void refresh();};
  select?.addEventListener('change',change);
  const onVisibility=()=>{void refresh();};
  document.addEventListener('visibilitychange',onVisibility);
  reduced.addEventListener('change',onVisibility);
  device.connection?.addEventListener('change',onVisibility);
  const consent=new MutationObserver(onVisibility);
  consent.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pagehide',()=>{disposed=true;stop();consent.disconnect();document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',onVisibility);device.connection?.removeEventListener('change',onVisibility);});
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
  void refresh();
}
