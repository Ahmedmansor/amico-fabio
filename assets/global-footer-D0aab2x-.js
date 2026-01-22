const i={init:()=>{const e=document.getElementById("global-footer");if(!e)return;const t=$=>{if(!window.ImagePaths)return"";const I=$.split(".");let a=window.ImagePaths;for(const L of I)a=a&&a[L];return typeof a=="string"?a:""},n=/\/sharm-secrets\//i.test(window.location.pathname),l=n?"../":"",c=(typeof window<"u"&&window.location&&window.location.pathname?window.location.pathname.split("/"):[]).filter(Boolean)[0]||"",f=c?`/${c}/`:"/",s=typeof window<"u"&&window.FABIO_BASE_URL||f,r=localStorage.getItem("fabio_lang")||localStorage.getItem("preferredLanguage")||document.documentElement.lang||"it",o=r==="en"?window.i18nEn||{}:window.i18nIt||{},d=new Date().getFullYear(),g=o.footer&&o.footer.about_bio?o.footer.about_bio:"",b=o.footer&&o.footer.links_legal?o.footer.links_legal:"",h=o.footer&&o.footer.links_why?o.footer.links_why:o.global&&o.global.why_fabio?o.global.why_fabio:"",m=o.footer&&o.footer.join_community?o.footer.join_community:"",w=o.footer&&o.footer.heritage?o.footer.heritage:"",_=o.global&&o.global.brand_subtitle?o.global.brand_subtitle:r==="en"?"Official Tour Guide":"Guida Turistica Ufficiale",u=t("ui.headerLogo")||`${s}assets/images/logo/fabio-header-logo.webp`,p=t("ui.crossRootsLogo")||`${s}assets/images/logo/cross-roots-logo.webp`,v=t("icons.social.facebook")||`${s}assets/images/icons/social/facebook.svg`,y=t("icons.social.instagram")||`${s}assets/images/icons/social/instagram.svg`,k=`
      <footer class="af-footer">
        <div class="af-footer-inner">
          <div class="af-grid">
            <div class="af-col af-about">
              <div class="af-logo-wrap">
                <img src="${u}" alt="FABIO" class="af-logo" width="84" height="81" loading="lazy">
                <div class="af-brand">
                  <div class="af-brand-title">FABIO</div>
                  <div class="af-brand-subtitle" data-i18n="global.brand_subtitle">${_}</div>
                </div>
              </div>
              <p class="af-bio" data-i18n="footer.about_bio">${g}</p>
              <p class="af-copy">&copy; 2025 - ${d}</p>
            </div>
            <div class="af-col af-links">
              <h4 class="af-heading">Links</h4>
              <nav class="af-links-nav">
                <a href="${l}legal.html" class="af-link" data-i18n="footer.links_legal">${b}</a>
                <a href="${n?"index.html#page6":l+"sharm-secrets/index.html#page6"}" class="af-link" data-i18n="global.why_fabio">${h}</a>
              </nav>
            </div>
            <div class="af-col af-community">
              <h4 class="af-heading" data-i18n="footer.join_community">${m}</h4>
              <div class="af-social">
                <a href="https://www.facebook.com/groups/762287932356507" target="_blank" rel="noopener" aria-label="Facebook" class="af-social-btn">
                  <img src="${v}" class="af-social-icon" width="24" height="24" alt="Facebook">
                </a>
                <a href="https://www.instagram.com/fabio_sharm_el_sheikh_/" target="_blank" rel="noopener" aria-label="Instagram" class="af-social-btn">
                  <img src="${y}" class="af-social-icon" width="24" height="24" alt="Instagram">
                </a>
              </div>
            </div>
          </div>
          <div class="af-legacy">
            <img src="${p}" alt="Cross Roots Logo" class="af-legacy-logo" width="75" height="50" loading="lazy">
            <span class="af-legacy-text" data-i18n="footer.heritage">${w}</span>
          </div>
        </div>
      </footer>
    `;e.innerHTML=k.trim()}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i.init):i.init();window.GlobalFooter=i;
