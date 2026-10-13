const left = document.querySelector<HTMLElement>('#global-header .gh-left');
const right = document.querySelector<HTMLElement>('#global-header .gh-right');
const menuButton = document.getElementById('gh-menu-btn');
const languageButton = document.getElementById('gh-lang-btn');
function updateButtons() {
  menuButton?.setAttribute('aria-expanded', String(left?.classList.contains('open') ?? false));
  languageButton?.setAttribute('aria-expanded', String(right?.classList.contains('open') ?? false));
}
menuButton?.addEventListener('click', event => {
  event.stopPropagation(); left?.classList.toggle('open'); right?.classList.remove('open'); updateButtons();
});
languageButton?.addEventListener('click', event => {
  event.stopPropagation(); right?.classList.toggle('open'); left?.classList.remove('open'); updateButtons();
});
document.addEventListener('click', () => { left?.classList.remove('open'); right?.classList.remove('open'); updateButtons(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { left?.classList.remove('open'); right?.classList.remove('open'); updateButtons(); }
});
document.querySelectorAll<HTMLAnchorElement>('[data-lang]').forEach(link => link.addEventListener('click', () => {
  const locale = link.dataset.lang;
  if (locale) try { localStorage.setItem('fabio_lang', locale); localStorage.setItem('preferredLanguage', locale); } catch { /* Navigation works without storage. */ }
}));
const progress = document.getElementById('scroll-progress');
function updateProgress() {
  if (!progress) return;
  const max = document.body.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
}
updateProgress();
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
export {};
