export function trackOfferLead() {
  const gtag=(window as unknown as {gtag?:(...args:unknown[])=>void}).gtag;
  if(typeof gtag==='function')gtag('event','generate_lead',{currency:'EUR',value:1,event_category:'Booking',event_label:'WhatsApp_Sharm_Offer'});
}
export function trackCatalogLead() {
  const gtag=(window as unknown as {gtag?:(...args:unknown[])=>void}).gtag;
  if(typeof gtag==='function')gtag('event','generate_lead',{event_category:'Catalog',event_label:'Welcome'});
}
