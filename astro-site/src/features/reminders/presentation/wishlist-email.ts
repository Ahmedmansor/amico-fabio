import type {WishlistEmailModel,EmailCopy} from '../domain/email.ts';
import {emailStyles as s} from './email-styles.ts';
export function escapeEmailHtml(value:string):string {
  return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
}

/** Local, provider-independent template. No API calls, tracking pixels or external styles. */
export function renderWishlistEmail(model:WishlistEmailModel,m:EmailCopy):{subject:string;htmlContent:string;textContent:string}{
  const e=escapeEmailHtml;
  const subject=model.kind==='summary'?m.summarySubject:m.reminderSubject;
  if(/[\r\n]/.test(subject))throw new Error('[wishlist-email] Invalid subject.');
  const title=model.kind==='summary'?m.summaryTitle:m.reminderTitle;
  const intro=model.kind==='summary'?m.summaryIntro:m.reminderIntro;
  const reason=model.kind==='summary'?m.summaryReason:m.reminderReason;
  const more=m.moreItems.replace('{count}',String(model.remainingCount));
  const groups=(['trip','package'] as const).flatMap(kind=>{
    const items=model.items.filter(item=>item.kind===kind);
    return items.length?[{title:kind==='trip'?m.tours:m.packages,items}]:[];
  });
  const cards=groups.map(group=>`<h2 style="${s.section}">${e(group.title)}</h2>${group.items.map(item=>`
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${s.card}"><tr><td>
<a href="${e(item.url)}"><img src="${e(item.image.url)}" width="${Math.min(552,item.image.width)}" height="${Math.round(Math.min(552,item.image.width)*item.image.height/item.image.width)}" alt="${e(item.title)}" style="${s.image}"></a>
</td></tr><tr><td style="${s.cardContent}"><h3 style="${s.cardTitle}">${e(item.title)}</h3>
<p style="${s.price}">${e(m.priceFrom)} <strong>€${item.price}</strong></p>
<a href="${e(item.url)}" style="${s.link}">${e(m.discover)}</a></td></tr></table>`).join('')}`).join('');
  const htmlContent=`<!doctype html><html lang="${model.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(subject)}</title></head>
<body style="${s.body}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${s.shell}"><tr><td style="${s.brand}">FABIO EGYPT</td></tr>
<tr><td style="${s.content}"><h1 style="${s.title}">${e(title)}</h1><p style="${s.paragraph}">${e(intro)}</p>${cards}
${model.remainingCount?`<p style="${s.paragraph}">${e(more)}</p>`:''}
<p style="${s.paragraph}"><a href="${e(model.wishlistUrl)}" style="${s.button}">${e(m.viewFavorites)}</a></p>
<p style="${s.small}">${e(m.catalogNote)}</p></td></tr>
<tr><td style="${s.footer}"><p style="${s.small}">${e(reason)}</p>
${model.unsubscribeUrl?`<p style="${s.small}"><a href="${e(model.unsubscribeUrl)}" style="${s.link}">${e(m.unsubscribe)}</a></p>`:''}
<a href="${e(model.privacyUrl)}" style="${s.link}">${e(m.privacy)}</a></td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
  const textContent=[title,intro,...groups.flatMap(group=>[group.title,...group.items.map(item=>`${item.title}\n${m.priceFrom} €${item.price}\n${item.url}`)]),
    ...(model.remainingCount?[more]:[]),`${m.viewFavorites}: ${model.wishlistUrl}`,m.catalogNote,reason,
    ...(model.unsubscribeUrl?[`${m.unsubscribe}: ${model.unsubscribeUrl}`]:[]),`${m.privacy}: ${model.privacyUrl}`,
  ].join('\n\n');
  return {subject,htmlContent,textContent};
}
