const index = document.getElementById('indexMenu');
const button = document.getElementById('legal-fab');
const closeButton = index?.querySelector<HTMLButtonElement>('.index-menu-close');
function setIndex(open: boolean) {
  index?.classList.toggle('is-visible', open);
  if (index) index.inert = !open;
  button?.setAttribute('aria-expanded', String(open));
  if (open) closeButton?.focus();
}
button?.addEventListener('click', () => setIndex(true));
closeButton?.addEventListener('click', () => { setIndex(false); button?.focus(); });
index?.addEventListener('click', event => { if (event.target === index) setIndex(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') setIndex(false); });
const links = document.querySelectorAll<HTMLAnchorElement>('#legal-toc a, #legal-toc-top a, #indexMenu a');
links.forEach(link => link.addEventListener('click', () => setIndex(false)));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    }
  }, { rootMargin: '0px 0px -60% 0px', threshold: 0.25 });
  document.querySelectorAll('.legal-section').forEach(section => observer.observe(section));
  const footer = document.getElementById('global-footer');
  if (footer) new IntersectionObserver(entries => {
    for (const entry of entries) document.querySelectorAll('#legal-fab, .gh-fab-label, #whatsapp-wrapper, .floating-whatsapp, .wa-fab-label').forEach(el => el.classList.toggle('fab-hidden', entry.isIntersecting));
  }, { threshold: 0.1 }).observe(footer);
}
export {};
