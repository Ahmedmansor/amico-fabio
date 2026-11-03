/** One accessible autofill/paste-friendly field, displayed as separate cells. */
export function bindEmailCodeInput(input:HTMLInputElement,length:number){
  const widget=input.closest<HTMLElement>('[data-code-widget]')!;
  const cells=[...widget.querySelectorAll<HTMLElement>('[data-code-cell]')];
  function refresh(){
    const active=document.activeElement===input&&!input.disabled;
    const position=Math.min(input.selectionStart??input.value.length,length-1);
    cells.forEach((cell,index)=>{
      cell.textContent=input.value[index]??'';
      cell.classList.toggle('is-active',active&&index===position);
    });
    widget.classList.toggle('is-invalid',input.getAttribute('aria-invalid')==='true');
    widget.classList.toggle('is-disabled',input.disabled);
  }
  input.addEventListener('input',()=>{input.value=input.value.replace(/\D/g,'').slice(0,length);refresh();});
  input.addEventListener('paste',event=>{
    const text=event.clipboardData?.getData('text');if(text===undefined)return;
    event.preventDefault();
    const digits=text.replace(/\D/g,'').slice(0,length);
    if(!digits)return;
    input.setRangeText(digits,input.selectionStart??0,input.selectionEnd??input.value.length,'end');
    input.value=input.value.slice(0,length);
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  widget.addEventListener('pointerdown',event=>{
    if(input.disabled)return;event.preventDefault();
    const rect=widget.getBoundingClientRect();
    const index=Math.min(input.value.length,Math.max(0,Math.floor((event.clientX-rect.left)/rect.width*length)));
    input.focus();input.setSelectionRange(index,index);refresh();
  });
  for(const event of ['focus','blur','select','keyup','click'])input.addEventListener(event,refresh);
  refresh();return {refresh};
}
