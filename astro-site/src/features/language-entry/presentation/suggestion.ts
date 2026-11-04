import {languageSuggestion} from '../domain/preference';
import {readLanguageChoice,saveLanguageChoice} from '../data/preference';
import {defaultLocale} from '../../../shared/config/languages';

const root=document.querySelector<HTMLElement>('[data-language-entry]');
if(root&&location.pathname==='/'){
  const decision=languageSuggestion(readLanguageChoice(),navigator.languages?.length?navigator.languages:[navigator.language]);
  const offer=decision&&root.querySelector<HTMLElement>(`[data-language-offer="${decision.locale}"]`);
  if(decision&&offer){
    const accept=offer.querySelector<HTMLAnchorElement>('[data-language-accept]')!;
    if(decision.kind==='return'){
      offer.querySelector<HTMLElement>('[data-language-question]')!.hidden=true;
      accept.textContent=accept.dataset.languageReturn!;
      offer.querySelector<HTMLButtonElement>('[data-language-dismiss]')!.hidden=true;
    }
    // Never cover consent/auth dialogs or steal focus from the visitor.
    const reveal=()=>{offer.hidden=!!document.querySelector('dialog[open],html.show--consent,html.show--preferences');};
    const observer=new MutationObserver(reveal);
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
    reveal();
    accept.addEventListener('click',()=>saveLanguageChoice(decision.locale));
    offer.querySelector<HTMLButtonElement>('[data-language-dismiss]')!.addEventListener('click',()=>{
      saveLanguageChoice(defaultLocale);offer.hidden=true;observer.disconnect();
    });
  }
}
