import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildEmailCatalog} from '../../domain/catalog.ts';
import {prepareWishlistEmail} from '../../domain/email.ts';
import {renderWishlistEmail} from '../wishlist-email.ts';
import {getEmailMessages} from '../../data/messages.mjs';
const origin='https://preview.example.test';
function fixture(locale='en',kind='summary'){
  const catalog=buildEmailCatalog(['trip','package'].map(kind=>({kind,id:'same',slug:'same',adult_price:0,
    localized:Object.fromEntries(['it','en'].map(locale=>[locale,{title:'<script>alert("x")</script> & title',url:`${origin}/${locale}/${kind==='trip'?'tours':'packages'}/same/`}])),
    image:{url:`${origin}/image.jpg`,width:640,height:400}})),origin,'2026-10-24T00:00:00Z','test');
  return prepareWishlistEmail({catalog,expectedEnvironment:'test',ids:['same','package:same'],locale,kind,cardLimit:4,unsubscribeUrl:`${origin}/email-preferences/?token=example`}).model;
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
