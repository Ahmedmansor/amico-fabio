const HeroSlider = {
    init: () => {
        const section = document.getElementById('hero-slider-section');
        if (!section) return;
        const slides = section.querySelectorAll('.hero-slide');
        if (!slides || slides.length === 0) return;
        HeroSlider.start(slides);
    },
    start: (slides) => {
        let idx = 0;
        const setActive = (i) => {
            slides.forEach(s => s.classList.remove('active-slide'));
            slides[i].classList.add('active-slide');
        };
        const run = () => {
            idx = (idx + 1) % slides.length;
            setActive(idx);
        };
        setActive(0);
        setInterval(run, 3000);
    }
};

if (document.readyState === 'loading') {
    window.addEventListener('load', HeroSlider.init);
} else {
    HeroSlider.init();
}

window.HeroSlider = HeroSlider;
