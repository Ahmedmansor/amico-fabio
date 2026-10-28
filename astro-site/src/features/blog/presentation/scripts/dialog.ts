const dialog = document.querySelector<HTMLDialogElement>('.blog-inquiry-dialog');
const bar = document.querySelector<HTMLElement>('.blog-mobile-bar');
let invoker: HTMLElement | null = null;
let overflow = '';

if (dialog) {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-open-lead]') : null;
    if (!target) return;
    event.preventDefault();
    const desktopField = document.querySelector<HTMLInputElement>('#blog-inquiry [name="name"]');
    if (desktopField && matchMedia('(min-width: 1024px)').matches) {
      desktopField.focus();
      desktopField.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      return;
    }
    if (dialog.open) return;
    invoker = target;
    overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    if (bar) bar.hidden = true;
    dialog.showModal();
  });
  dialog.querySelector('[data-blog-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = overflow;
    if (bar) bar.hidden = false;
    invoker?.focus();
  });
}
