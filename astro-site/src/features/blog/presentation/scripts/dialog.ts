const dialog = document.querySelector<HTMLDialogElement>('.blog-inquiry-dialog');
let invoker: HTMLElement | null = null;
let overflow = '';

if (dialog) {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-open-lead]') : null;
    if (!target) return;
    event.preventDefault();
    const inlineField = document.querySelector<HTMLInputElement>('#blog-inquiry [name="name"]');
    if (inlineField && inlineField.getClientRects().length>0) {
      inlineField.focus();
      inlineField.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (dialog.open) return;
    invoker = target;
    overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
  });
  dialog.querySelector('[data-blog-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = overflow;
    invoker?.focus();
  });
}
export {};
