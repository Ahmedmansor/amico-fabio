import {buildBluMessage,buildBluWhatsApp} from '../domain/campaign';
import type {BluCopy} from '../data/campaign';

export function initializeJourney(root:HTMLElement, copy:BluCopy, number:string) {
  const choices=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-adventure]'));
  const programs=Array.from(root.querySelectorAll<HTMLElement>('[data-program-preview]'));
  const selectors=Array.from(root.querySelectorAll<HTMLButtonElement>('[data-select-program]'));
  const reset=root.querySelector<HTMLButtonElement>('[data-adventure-reset]');
  const status=root.querySelector<HTMLElement>('[data-adventure-status]');
  const onward=root.querySelector<HTMLElement>('[data-adventure-continue]');
  let adventure='';
  let program='';
  function message() {
    let text=buildBluMessage(copy.waDefaultMsg,copy.journeySelectedLabel,adventure);
    text=buildBluMessage(text,copy.programSelectedLabel,program);
    const href=buildBluWhatsApp(number,text);
    root.querySelectorAll<HTMLAnchorElement>('[data-program]').forEach(link=>{
      link.href=buildBluWhatsApp(number,buildBluMessage(buildBluMessage(copy.waDefaultMsg,copy.journeySelectedLabel,adventure),copy.programSelectedLabel,link.dataset.programTitle));
    });
    root.querySelectorAll<HTMLAnchorElement>('[data-blu-whatsapp]:not([data-program]):not([data-related-trip])').forEach(link=>link.href=href);
    const selected=root.querySelector<HTMLElement>('[data-selection-status]');
    if(selected) selected.textContent=[adventure,program].filter(Boolean).join(' · ');
    if(onward) onward.hidden=!adventure&&!program;
  }
  function clearProgram() {
    program='';
    selectors.forEach(button=>button.setAttribute('aria-pressed','false'));
    programs.forEach(card=>card.removeAttribute('data-selected'));
  }
  choices.forEach(button=>{
    button.disabled=false;
    button.addEventListener('click',()=>{
      adventure=button.dataset.title||'';
      clearProgram();
      choices.forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
      programs.forEach(card=>card.hidden=!card.dataset.adventures?.split(' ').includes(button.dataset.adventure||''));
      const count=programs.filter(card=>!card.hidden).length;
      if(status)status.textContent=count ? copy.journeyStatus.replace('{count}',String(count)).replace('{choice}',adventure) : copy.journeyEmpty;
      if(reset)reset.hidden=false;
      message();
    });
  });
  selectors.forEach(button=>{
    button.hidden=false;
    button.addEventListener('click',()=>{
      clearProgram();
      program=button.dataset.title||'';
      button.setAttribute('aria-pressed','true');
      button.closest<HTMLElement>('[data-program-preview]')?.setAttribute('data-selected','true');
      message();

    });
  });
  root.addEventListener('click',event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[data-program]');
    if(!link)return;
    clearProgram();
    program=link.dataset.programTitle||'';
    selectors.find(button=>button.dataset.selectProgram===link.dataset.program)?.setAttribute('aria-pressed','true');
    link.closest<HTMLElement>('[data-program-preview]')?.setAttribute('data-selected','true');
    message();
  });
  reset?.addEventListener('click',()=>{
    adventure='';clearProgram();
    choices.forEach(button=>button.setAttribute('aria-pressed','false'));
    programs.forEach(card=>card.hidden=false);
    reset.hidden=true;
    if(status)status.textContent=copy.choiceAll;
    message();
  });
}
