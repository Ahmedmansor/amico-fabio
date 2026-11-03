import {run,acceptedCategory} from 'vanilla-cookieconsent';
import {isLocale,defaultLocale} from '../config/languages';
const config=JSON.parse(document.getElementById('cookie-consent-config')!.textContent!);
const locale=isLocale(document.documentElement.lang)?document.documentElement.lang:defaultLocale;
const m=config.messages;
let analyticsLoaded=false;
const globals=window as unknown as Record<string,any>;
function synchronize(){
  const analytics=acceptedCategory('analytics');
  globals[`ga-disable-${config.measurementId}`]=!analytics;
  // Unload an already-running Google script after consent has been withdrawn.
  if(!analytics&&analyticsLoaded){window.location.reload();return;}
  if(analytics&&!analyticsLoaded){
    analyticsLoaded=true;
    globals.dataLayer=globals.dataLayer||[];
    globals.gtag=function(){globals.dataLayer.push(arguments);};
    globals.gtag('js',new Date());globals.gtag('config',config.measurementId);
    const script=document.createElement('script');script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.measurementId)}`;
    document.head.append(script);
  }
  if(!acceptedCategory('external'))document.querySelectorAll('iframe[src^="https://player.vimeo.com/"]').forEach(frame=>frame.remove());
}
void run({
  mode:'opt-in',revision:1,hideFromBots:false,lazyHtmlGeneration:false,
  cookie:{name:'fabio_consent',expiresAfterDays:182,path:'/'},
  onConsent:synchronize,onChange:synchronize,
  categories:{
    necessary:{enabled:true,readOnly:true},
    analytics:{autoClear:{cookies:[{name:/^_ga/},{name:/^_gid$/},{name:/^_gat/}]}},
    external:{},
  },
  language:{default:locale,translations:{[locale]:{
    consentModal:{title:m.title,description:m.description,acceptAllBtn:m.accept,acceptNecessaryBtn:m.reject,showPreferencesBtn:m.customize,footer:`<a href="/${locale}/legal/">${m.policy}</a>`},
    preferencesModal:{title:m.manage,acceptAllBtn:m.accept,acceptNecessaryBtn:m.reject,savePreferencesBtn:m.save,closeIconLabel:m.close,
      sections:[{title:m.necessaryTitle,description:m.necessaryDescription,linkedCategory:'necessary'},
        {title:m.analyticsTitle,description:m.analyticsDescription,linkedCategory:'analytics'},
        {title:m.externalTitle,description:m.externalDescription,linkedCategory:'external'}]},
  }}},
}).catch(error=>console.error('[consent] Initialization failed',error));
