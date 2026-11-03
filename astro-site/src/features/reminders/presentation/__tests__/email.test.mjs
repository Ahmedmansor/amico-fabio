import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildEmailCatalog} from '../../domain/catalog.ts';
import {prepareWishlistEmail} from '../../domain/email.ts';
import {renderWishlistEmail} from '../wishlist-email.ts';
import {getEmailMessages} from '../../data/messages.mjs';
import {siteConfig} from '../../../../shared/config/site.ts';
import {prepareReminderMessage} from '../prepare-reminder-message.ts';
const origin='https://preview.example.test';
test('dispatch preparation uses one resolved language for fallback subject, content and management link',()=>{
  const catalog=buildEmailCatalog([{kind:'trip',id:'same',slug:'same',adult_price:25,
    localized:{it:{title:'Titolo italiano',url:`${origin}/it/tours/same/`},en:{title:'English title',url:`${origin}/en/tours/same/`}},
    image:{url:`${origin}/image.jpg`,width:640,height:400}}],origin,'2026-10-25T00:00:00Z','test');
  for(const [storedLocale,locale]of [[null,'it'],['de','it'],['en','en'],['it','it']]){
    const {message}=prepareReminderMessage({catalog,expectedEnvironment:'test',ids:['same'],storedLocale,managementToken:'a'.repeat(64)});
    assert.equal(message.subject,getEmailMessages(locale).reminderSubject);
    assert.ok(message.htmlContent.includes(`lang="${locale}"`));
    assert.ok(message.textContent.includes(`/${locale}/email-preferences/#token=`));
    assert.ok(message.textContent.includes(`/${locale}/tours/same/`));
  }
});
function fixture(locale='en',kind='summary'){
  const catalog=buildEmailCatalog(['trip','package'].map(kind=>({kind,id:'same',slug:'same',adult_price:0,
    localized:Object.fromEntries(['it','en'].map(locale=>[locale,{title:'<script>alert("x")</script> & title',url:`${origin}/${locale}/${kind==='trip'?'tours':'packages'}/same/`}])),
    image:{url:`${origin}/image.jpg`,width:640,height:400}})),origin,'2026-10-24T00:00:00Z','test');
  return prepareWishlistEmail({catalog,expectedEnvironment:'test',ids:['same','package:same'],locale,kind,unsubscribeUrl:`${origin}/email-preferences/?token=example`}).model;
}
test('both languages and message types render HTML and plain text from the same selected data',()=>{
  for(const locale of ['it','en'])for(const kind of ['summary','reminder']){
    const rendered=renderWishlistEmail(fixture(locale,kind),getEmailMessages(locale));
    assert.ok(rendered.subject.length>0);assert.match(rendered.htmlContent,new RegExp(`lang="${locale}"`));
    assert.ok(rendered.textContent.includes(`/${locale}/packages/same/`));
    assert.match(rendered.htmlContent,/€0/);assert.match(rendered.htmlContent,/role="presentation"/);
    assert.equal(rendered.htmlContent.includes('Stop favorites reminders'),locale==='en'&&kind==='reminder');
  }
});
test('catalog titles are escaped and email rendering has no JavaScript, form or remote CSS/font dependency',()=>{
  const {htmlContent}=renderWishlistEmail(fixture(),getEmailMessages('en'));
  assert.match(htmlContent,/&lt;script&gt;/);
  assert.doesNotMatch(htmlContent,/<script\b|<form\b|<link\b|@import|onerror=/i);
  assert.match(htmlContent,/width="552" height="345"/);
});
test('summary never carries reminder unsubscribe or opt-in claims',()=>{
  const {htmlContent,textContent}=renderWishlistEmail(fixture(),getEmailMessages('en'));
  assert.doesNotMatch(htmlContent,/email-preferences/);assert.doesNotMatch(textContent,/opted in/);
});
test('rejects header newlines and validates IT/EN copy keys',()=>{
  assert.throws(()=>renderWishlistEmail(fixture(),{...getEmailMessages('en'),summarySubject:'Bad\r\nHeader'}),/subject/);
  assert.deepEqual(Object.keys(getEmailMessages('it')).sort(),Object.keys(getEmailMessages('en')).sort());
});

test('IT/EN email provides primary WhatsApp contact and item-specific booking actions in HTML and plain text',()=>{
  for(const locale of ['it','en']){
    const model=fixture(locale),m=getEmailMessages(locale),rendered=renderWishlistEmail(model,m);
    const decode=value=>value.replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
    const links=[...rendered.htmlContent.matchAll(/href="(https:\/\/wa\.me\/[^\"]+)"/g)].map(match=>new URL(decode(match[1])));
    const plainLinks=[...rendered.textContent.matchAll(/https:\/\/wa\.me\/\S+/g)].map(match=>new URL(match[0]));
    assert.equal(links.length,model.items.length+2);
    for(const url of links)assert.equal(url.pathname,'/'+siteConfig.whatsapp.number);
    assert.equal(links[0].searchParams.get('text'),m.whatsappIntro);
    for(const [index,item] of model.items.entries()){
      const message=links[index+1].searchParams.get('text');
      assert.equal(message,`${m.whatsappItemIntro}\n${item.title}\n${item.url}`);
      assert.equal(plainLinks[index+1].searchParams.get('text'),message);
    }
    assert.ok(rendered.htmlContent.includes(m.bookTrip));assert.ok(rendered.htmlContent.includes(m.bookPackage));
    assert.ok(rendered.htmlContent.indexOf(m.contact)<rendered.htmlContent.indexOf('<h2'));
    assert.ok(rendered.htmlContent.includes(`href="${model.wishlistUrl}"`));
  }
});
