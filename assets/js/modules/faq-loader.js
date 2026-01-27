export function initFaqSection(containerId = 'faq-section-container') {
    const getLang = () => localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
    const getDataset = (lang) => (lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {}));
    const getValueByPath = (root, path) => {
        if (!root || !path) return null;
        const segments = path.split('.');
        let value = root;
        for (let i = 0; i < segments.length; i += 1) {
            const key = segments[i];
            if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                value = value[key];
            } else {
                return null;
            }
        }
        return value;
    };
    const applyFaqTranslations = () => {
        const host = document.getElementById(containerId);
        if (!host) return;
        const lang = getLang();
        const dataset = getDataset(lang);
        host.querySelectorAll('[data-i18n]').forEach((el) => {
            const keyPath = el.getAttribute('data-i18n');
            const value = getValueByPath(dataset, keyPath);
            if (typeof value === 'string') {
                el.textContent = value;
            }
        });
    };
    const setupFaqAccordion = () => {
        if (window.DetailsRenderer && typeof window.DetailsRenderer.setupFaqAccordion === 'function') {
            window.DetailsRenderer.setupFaqAccordion();
            return;
        }
        const items = document.querySelectorAll('.faq-item');
        if (!items.length) return;
        items.forEach((item) => {
            const btn = item.querySelector('.faq-toggle');
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('.faq-icon');
            if (!btn || !answer) return;
            if (btn.dataset.bound === 'true') return;
            btn.dataset.bound = 'true';
            btn.setAttribute('aria-expanded', 'false');
            answer.style.maxHeight = '0px';
            item.classList.remove('is-open');
            btn.addEventListener('click', () => {
                const isOpen = btn.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    btn.setAttribute('aria-expanded', 'false');
                    answer.style.maxHeight = '0px';
                    item.classList.remove('is-open');
                    if (icon) icon.classList.remove('rotate-45');
                    return;
                }
                btn.setAttribute('aria-expanded', 'true');
                item.classList.add('is-open');
                answer.style.maxHeight = `${answer.scrollHeight}px`;
                if (icon) icon.classList.add('rotate-45');
            });
        });
    };
    const loadFaqSection = () => {
        const host = document.getElementById(containerId);
        if (!host || host.dataset.loaded === 'true') return;
        const parts = (typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.split('/') : []);
        const repo = parts.filter(Boolean)[0] || '';
        const fallbackBase = repo ? `/${repo}/` : '/';
        const base = (typeof window !== 'undefined' && window.FABIO_BASE_URL) || fallbackBase;
        fetch(`${base}assets/partials/faq-section.html`).then((res) => {
            if (!res.ok) return '';
            return res.text();
        }).then((html) => {
            if (!html) return;
            host.innerHTML = html;
            host.dataset.loaded = 'true';
            applyFaqTranslations();
            setupFaqAccordion();
        }).catch(() => { });
    };
    const ensureLoaded = () => {
        loadFaqSection();
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureLoaded);
    } else {
        ensureLoaded();
    }
    window.addEventListener('langChanged', applyFaqTranslations);
}
