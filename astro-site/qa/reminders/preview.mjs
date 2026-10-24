import {parseArgs} from 'node:util';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {supportedLocales} from '../../src/shared/config/languages.ts';
import {favoriteKey} from '../../src/features/wishlist/domain/wishlist.ts';
import {validateEmailCatalog} from '../../src/features/reminders/domain/catalog.ts';
import {prepareWishlistEmail} from '../../src/features/reminders/domain/email.ts';
import {getEmailMessages} from '../../src/features/reminders/data/messages.mjs';
import {renderWishlistEmail,escapeEmailHtml as e} from '../../src/features/reminders/presentation/wishlist-email.ts';
const {values}=parseArgs({options:{manifest:{type:'string'}}});
if(!values.manifest)throw new Error('Pass --manifest pointing to a local test-build tours-manifest.json.');
const path=resolve(values.manifest);
const catalog=validateEmailCatalog(JSON.parse(await readFile(path,'utf8')));
const origin=new URL(catalog.origin);
if(catalog.environment!=='test' || !['localhost','127.0.0.1','[::1]'].includes(origin.hostname))
  throw new Error('Email previews require a test manifest with an explicit loopback origin. Production links are refused.');
const directory=resolve(dirname(path),'email-preview');
await mkdir(directory,{recursive:true});
// Four public catalog examples, not a real user's wishlist. All selected items render.
const examples=['trip','package'].flatMap(kind=>catalog.items.filter(item=>item.kind===kind).slice(0,2));
const ids=examples.map(item=>favoriteKey(item.kind,item.id));
const links=[];
for(const locale of supportedLocales)for(const kind of ['summary','reminder']){
  const prepared=prepareWishlistEmail({catalog,expectedEnvironment:'test',ids,locale,kind,
    unsubscribeUrl:new URL('/email-preview/unsubscribe-preview.html',origin).href});
  if(!prepared.model)throw new Error('Published examples are required for preview.');
  const rendered=renderWishlistEmail(prepared.model,getEmailMessages(locale));
  const stem=`${kind}-${locale}`;
  await writeFile(resolve(directory,`${stem}.html`),rendered.htmlContent);
  await writeFile(resolve(directory,`${stem}.txt`),rendered.textContent);
  links.push(`<li><a href="${stem}.html">${e(rendered.subject)} (${locale}, ${kind})</a> — <a href="${stem}.txt">Plain text</a></li>`);
}
await writeFile(resolve(directory,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fabio Egypt email draft previews</title><body style="font:18px/1.6 Arial;padding:24px"><h1>Fabio Egypt email drafts</h1><p>Local review only. Public catalog examples; no customer data, emails sent or preferences changed.</p><ul>${links.join('')}</ul></body></html>`);
await writeFile(resolve(directory,'unsubscribe-preview.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Unsubscribe preview</title><body><p>${e(getEmailMessages('en').previewOnly)}</p><p lang="it">${e(getEmailMessages('it').previewOnly)}</p></body></html>`);
console.log(`Generated four local IT/EN HTML + text email drafts in ${directory}. No sending API or customer data used.`);
