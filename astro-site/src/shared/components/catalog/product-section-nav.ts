const nav = document.querySelector<HTMLElement>('.product-section-nav');
if (nav) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const targets = links.map(link => document.getElementById(link.hash.slice(1))!);
  const booking = targets.at(-1)!;
  let bookingSelected = false;
  let scheduled = false;
  function activate(index: number) {
    links.forEach((link, position) => {
      if (position === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const link = links[index];
    if (link.offsetLeft < nav!.scrollLeft || link.offsetLeft + link.offsetWidth > nav!.scrollLeft + nav!.clientWidth) {
      nav!.scrollLeft = link.offsetLeft - nav!.clientWidth / 2 + link.offsetWidth / 2;
    }
  }
  function update() {
    scheduled = false;
    const marker = parseFloat(getComputedStyle(nav!).top) + nav!.offsetHeight + 24;
    const sidebar = matchMedia('(min-width: 1024px)').matches;
    let active = 0;
    targets.forEach((target, index) => {
      // The desktop form stays visible beside the reading sections.
      if (target === booking && sidebar) return;
      if (target.getBoundingClientRect().top <= marker) active = index;
    });
    activate(bookingSelected ? links.length - 1 : active);
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }
  links.forEach((link, index) => link.addEventListener('click', () => {
    bookingSelected = targets[index] === booking;
    activate(index);
    schedule();
  }));
  booking.addEventListener('focusin', () => { bookingSelected = true; schedule(); });
  // Wheel/touch on the document resumes reading; scrolling inside the form does not.
  for (const event of ['wheel', 'touchstart', 'pointerdown'] as const) {
    document.addEventListener(event, e => {
      if (!(e.target instanceof Node) || booking.contains(e.target) || nav!.contains(e.target)) return;
      bookingSelected = false;
      schedule();
    }, {passive: true});
  }
  document.addEventListener('keydown', event => {
    if (['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key) && !booking.contains(document.activeElement)) {
      bookingSelected = false; schedule();
    }
  });
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', () => { bookingSelected = location.hash === '#booking-card-container'; schedule(); });
  bookingSelected = location.hash === '#booking-card-container';
  update();
}
export {};
