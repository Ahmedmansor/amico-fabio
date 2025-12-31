class WhoFabioParallax {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.bg = this.container.querySelector('.wf-bg');
    this.fig = this.container.querySelector('.wf-figure');
    this.bioBtn = this.container.querySelector('.wf-bio-btn');
    this.overlay = document.querySelector('.wf-overlay-bio');
    this.overlayContent = this.overlay ? this.overlay.querySelector('.wf-overlay-content') : null;
    this.isBioActive = false;
    this.active = false;
    this.rafId = null;

    this.tx = 0;
    this.ty = 0;
    this.cx = 0;
    this.cy = 0;

    this.intensityBg = 0.15;
    this.intensityFg = 0.4;
    this.amplitude = 50;
    this.iosPermissionRequested = false;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onOrientation = this.onOrientation.bind(this);
    this.onResize = this.onResize.bind(this);
    this.tick = this.tick.bind(this);
    this.requestOrientationPermission = this.requestOrientationPermission.bind(this);

    this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
      root: null,
      threshold: 0.6
    });
    this.observer.observe(this.container);
    this.onResize();
    window.addEventListener('resize', this.onResize, { passive: true });

    this.attachPermissionTriggers();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.attachBioInteractions());
    } else {
      this.attachBioInteractions();
    }
  }

  onResize() {
    const rect = this.container.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2;
    this.cy = rect.top + rect.height / 2;
    this.amplitude = (window.innerWidth || 0) > 1440 ? 15 : 50;
  }

  onIntersect(entries) {
    const entry = entries && entries[0];
    if (!entry) return;
    if (entry.isIntersecting) {
      this.activate();
    } else {
      this.deactivate();
    }
  }

  activate() {
    if (this.active) return;
    this.active = true;

    window.addEventListener('mousemove', this.onMouseMove, { passive: true });

    if (typeof window.DeviceOrientationEvent !== 'undefined') {
      if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      } else {
        window.addEventListener('deviceorientation', this.onOrientation, { passive: true });
      }
    }

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('deviceorientation', this.onOrientation);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resetTransforms();
  }

  dispose() {
    this.deactivate();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    window.removeEventListener('resize', this.onResize);
  }

  onMouseMove(e) {
    const x = e.clientX - this.cx;
    const y = e.clientY - this.cy;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const nx = (x / (vw / 2));
    const ny = (y / (vh / 2));
    this.tx = Math.max(-1, Math.min(1, nx));
    this.ty = Math.max(-1, Math.min(1, ny));
  }

  onOrientation(e) {
    const beta = typeof e.beta === 'number' ? e.beta : 0;
    const gamma = typeof e.gamma === 'number' ? e.gamma : 0;
    const nb = Math.max(-1, Math.min(1, beta / 45));
    const ng = Math.max(-1, Math.min(1, gamma / 45));
    this.tx = ng;
    this.ty = nb;
  }

  async requestOrientationPermission() {
    try {
      if (this.iosPermissionRequested) return;
      if (typeof window.DeviceOrientationEvent === 'undefined') return;
      if (typeof window.DeviceOrientationEvent.requestPermission !== 'function') return;
      const res = await window.DeviceOrientationEvent.requestPermission();
      this.iosPermissionRequested = true;
      if (String(res).toLowerCase() === 'granted') {
        window.addEventListener('deviceorientation', this.onOrientation, { passive: true });
      }
    } catch (err) {
    }
  }

  attachPermissionTriggers() {
    const delegate = (e) => {
      const trg = e.target;
      if (!trg) return;
      const vip = trg.closest('.hero-btn');
      const langBtn = trg.closest('#gh-lang-btn');
      const langItem = trg.closest('.gh-lang-item');
      if (vip || langBtn || langItem) {
        this.requestOrientationPermission();
      }
    };
    document.addEventListener('click', delegate);
  }

  attachBioInteractions() {
    if (this.bioBtn) {
      this.bioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.active) return;
        console.log('WhoFabio: bio button clicked');
        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
        const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const intro = dict && dict.secrets && dict.secrets.page6 && dict.secrets.page6.intro;
        console.log('Target Text:', intro);
        setTimeout(() => this.setBioText(), 10);
        this.isBioActive = true;
        if (this.overlay) this.overlay.classList.add('is-visible');
      });
    }
    if (this.overlay) {
      const closeBtn = this.overlay.querySelector('.wf-overlay-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          console.log('WhoFabio: bio overlay closed');
          this.isBioActive = false;
          this.overlay.classList.remove('is-visible');
        });
      }
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          console.log('WhoFabio: bio overlay click-outside');
          this.isBioActive = false;
          this.overlay.classList.remove('is-visible');
        }
      });
    }
  }

  setBioText() {
    const el = this.overlay ? this.overlay.querySelector('.wf-overlay-text') : null;
    if (!el) return;
    const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const intro = dict && dict.secrets && dict.secrets.page6 && dict.secrets.page6.intro;
    if (typeof intro === 'string') {
      el.innerText = intro;
    }
  }
  tick() {
    if (!this._cx) this._cx = 0;
    if (!this._cy) this._cy = 0;
    const ease = 0.12;
    this._cx += (this.tx - this._cx) * ease;
    this._cy += (this.ty - this._cy) * ease;

    this.applyTransforms(this._cx, this._cy);
    this.rafId = requestAnimationFrame(this.tick);
  }

  applyTransforms(nx, ny) {
    const factor = this.isBioActive ? 0.25 : 1;
    if (this.bg) {
      const dxBg = -nx * (this.amplitude * factor) * this.intensityBg;
      const dyBg = -ny * (this.amplitude * factor) * this.intensityBg;
      this.bg.style.transform = `translate3d(${dxBg}px, ${dyBg}px, 0) scale(1.1)`;
    }
    if (this.fig) {
      const dxFg = nx * (this.amplitude * factor) * this.intensityFg;
      const dyFg = ny * (this.amplitude * factor) * this.intensityFg;
      this.fig.style.transform = `translate3d(${dxFg}px, ${dyFg}px, 0)`;
    }
  }

  resetTransforms() {
    if (this.bg) this.bg.style.transform = 'translate3d(0,0,0) scale(1.1)';
    if (this.fig) this.fig.style.transform = 'translate3d(0,0,0)';
    this.tx = 0;
    this.ty = 0;
    this._cx = 0;
    this._cy = 0;
  }
}

window.WhoFabioParallax = WhoFabioParallax;

(function () {
  const el = document.getElementById('who-fabio');
  if (!el) return;
  window.WFParallax = new WhoFabioParallax(el);
})();
