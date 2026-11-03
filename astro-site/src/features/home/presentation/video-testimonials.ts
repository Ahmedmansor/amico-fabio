import {acceptedCategory, showPreferences} from 'vanilla-cookieconsent';

const dialog=document.querySelector<HTMLDialogElement>('.home-video-dialog');
if(dialog){
  const player=dialog.querySelector<HTMLElement>('[data-home-video-player]')!;
  const title=dialog.querySelector<HTMLElement>('#home-video-title')!;
  let opener:HTMLAnchorElement|null=null;
  document.querySelectorAll<HTMLAnchorElement>('[data-home-video]').forEach(card=>{
    card.addEventListener('click',event=>{
      event.preventDefault();
      if(!acceptedCategory('external')){showPreferences();return;}
      const id=card.dataset.homeVideo!;
      if(!/^\d+$/.test(id))return;
      opener=card;
      dialog.querySelector<HTMLAnchorElement>('[data-home-video-fallback]')!.href=card.href;
      title.textContent=card.querySelector('h3')!.textContent;
      const frame=document.createElement('iframe');
      frame.src=`https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
      frame.title=title.textContent!;
      frame.allow='autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen=true;
      player.replaceChildren(frame);
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-close-home-video]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{player.replaceChildren();opener?.focus({preventScroll:true});});
  window.addEventListener('cc:onChange',()=>{if(!acceptedCategory('external')&&dialog.open)dialog.close();});
  document.querySelector('[data-home-video-preferences]')?.addEventListener('click',()=>showPreferences());
}
