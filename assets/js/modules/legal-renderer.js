(function () {
    // Helper function to create elements
    function createEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    }

    function getDataset(lang) {
        return lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    }

    function renderLegal(lang) {
        const container = document.getElementById('legal-content');
        const toc = document.getElementById('legal-toc');
        const tocTop = document.getElementById('legal-toc-top');
        const indexNav = document.querySelector('#indexMenu .index-menu-nav');
        
        if (!container || !toc) return;

        const activeLang = lang || localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
        const dict = getDataset(activeLang);
        const lp = dict.legal_page || {};

        // Clear existing content
        toc.innerHTML = '';
        if (tocTop) tocTop.innerHTML = '';
        if (indexNav) indexNav.innerHTML = '';

        const tocItems = Array.isArray(lp.toc) ? lp.toc : [];
        const summaryItems = Array.isArray(lp.summary_items) ? lp.summary_items : tocItems;

        // Render TOC
        tocItems.forEach(item => {
            const a = createEl('a', 'legal-link', item.label || '');
            a.href = '#' + item.id;
            toc.appendChild(a);
            
            if (indexNav) {
                const link = createEl('a', 'index-link', item.label || '');
                link.href = '#' + item.id;
                indexNav.appendChild(link);
            }
        });

        // Render Top TOC
        if (tocTop) {
            summaryItems.forEach(item => {
                const s = createEl('a', 'legal-link', item.label || '');
                s.href = '#' + item.id;
                tocTop.appendChild(s);
            });
        }

        container.innerHTML = '';
        const sections = Array.isArray(lp.sections) ? lp.sections : [];

        sections.forEach(sec => {
            const div = createEl('div', 'legal-section');
            div.id = sec.id;

            const row = createEl('div', 'heading-row');
            
            // Icon handling using window.ImagePaths
            const iconPath = (window.ImagePaths && window.ImagePaths.icons && window.ImagePaths.icons.legal && window.ImagePaths.icons.legal[sec.id]) 
                ? window.ImagePaths.icons.legal[sec.id] 
                : (window.ImagePaths && window.ImagePaths.icons && window.ImagePaths.icons.legal ? window.ImagePaths.icons.legal.default : '');
            
            if (iconPath) {
                const img = createEl('img', 'heading-icon');
                img.src = iconPath;
                img.alt = sec.heading || '';
                // Ensure SVG is treated properly if needed, but img tag works for .svg files
                row.appendChild(img);
            }

            const h3 = createEl('h3', 'legal-subtitle text-xl', sec.heading || '');
            row.appendChild(h3);
            div.appendChild(row);

            const paras = Array.isArray(sec.paragraphs) ? sec.paragraphs : [];
            let listEl = null;

            paras.forEach(p => {
                const isBullet = typeof p === 'string' && p.trim().startsWith('•');
                if (isBullet) {
                    if (!listEl) {
                        listEl = createEl('ul', 'gold-list');
                        div.appendChild(listEl);
                    }
                    const li = createEl('li', '', p.replace(/^•\s*/, ''));
                    listEl.appendChild(li);
                } else {
                    listEl = null;
                    const para = createEl('p', 'text-sm leading-relaxed text-gray-300 mb-3', p);
                    div.appendChild(para);
                }
            });

            // Data types chips special handling
            if (sec.id === 'data_types') {
                const chips = [];
                for (let i = 0; i < paras.length; i++) {
                    const txt = String(paras[i] || '');
                    const m = txt.match(/:\s*([^\.]+)\.?/);
                    if (m && m[1]) {
                        const raw = m[1];
                        raw.split(',').forEach(item => {
                            let t = item.trim();
                            t = t.replace(/^(and|e)\s+/i, '').trim();
                            if (t) chips.push(t);
                        });
                        break;
                    }
                }
                if (chips.length) {
                    const wrap = createEl('div', 'chip-list');
                    chips.forEach(c => {
                        const chip = createEl('span', 'chip', c);
                        wrap.appendChild(chip);
                    });
                    div.insertBefore(wrap, div.querySelector('p'));
                }
            }

            container.appendChild(div);
        });

        // Scroll and interaction logic
        function smoothScrollTo(hash) {
            const target = document.querySelector(hash);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function bindClicks(nav) {
            if (!nav) return;
            nav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    smoothScrollTo(e.currentTarget.getAttribute('href'));
                    const menu = document.getElementById('indexMenu');
                    if (menu) {
                        menu.classList.remove('is-visible');
                    }
                });
            });
        }

        bindClicks(toc);
        bindClicks(tocTop);
        bindClicks(indexNav);

        // ScrollSpy logic
        const linkMap = {};
        toc.querySelectorAll('a').forEach(a => { linkMap[a.getAttribute('href')] = [a]; });
        if (tocTop) {
            tocTop.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href');
                if (linkMap[href]) linkMap[href].push(a); else linkMap[href] = [a];
            });
        }
        if (indexNav) {
            indexNav.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href');
                if (linkMap[href]) linkMap[href].push(a); else linkMap[href] = [a];
            });
        }

        function setActive(id) {
            Object.values(linkMap).forEach(arr => arr.forEach(el => el.classList.remove('active')));
            const key = '#' + id;
            const arr = linkMap[key] || [];
            arr.forEach(el => el.classList.add('active'));
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '0px 0px -60% 0px', threshold: 0.25 });

        sections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) observer.observe(el);
        });
    }

    // Expose globally
    window.renderLegal = renderLegal;

    // Initialization
    document.addEventListener('DOMContentLoaded', function () {
        const lang = localStorage.getItem('fabio_lang') || 'it';
        renderLegal(lang);
        
        if (typeof applyTranslations === 'function') {
            applyTranslations(lang);
        }

        // FAB and Menu Logic
        const fabBtn = document.getElementById('legal-fab');
        const indexMenu = document.getElementById('indexMenu');
        const closeBtn = indexMenu ? indexMenu.querySelector('.index-menu-close') : null;

        if (fabBtn && indexMenu) {
            const dict = getDataset(lang);
            const labelEl = document.querySelector('.gh-fab-label');
            const labelText = dict && dict.fab && typeof dict.fab.indice === 'string' ? dict.fab.indice : (lang === 'en' ? 'Index' : 'Indice');
            
            fabBtn.setAttribute('aria-label', labelText);
            if (labelEl) labelEl.textContent = labelText;

            fabBtn.addEventListener('click', () => {
                indexMenu.classList.add('is-visible');
            });
        }

        if (closeBtn && indexMenu) {
            closeBtn.addEventListener('click', () => {
                indexMenu.classList.remove('is-visible');
            });
        }

        if (indexMenu) {
            indexMenu.addEventListener('click', (e) => {
                if (e.target === indexMenu) {
                    indexMenu.classList.remove('is-visible');
                }
            });
        }
    });

})();
