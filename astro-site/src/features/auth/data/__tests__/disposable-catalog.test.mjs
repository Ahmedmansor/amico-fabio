import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDisposableCatalog,disposableCatalogSql} from '../disposable-catalog.ts';
import {legitimateEmailDomains,validateEmailAddress} from '../../domain/email-validation.ts';

test('catalog imports deduplicate and protect providers, their subdomains and parent blocks',()=>{
  assert.deepEqual(parseDisposableCatalog('playfine.com\nPLAYFINE.COM\ngmail.com\nmx.gmail.com\nexample.co.uk\nmailinator.com', [...legitimateEmailDomains,'company.example.co.uk']),['mailinator.com','playfine.com']);
  assert.equal(Object.isFrozen(legitimateEmailDomains),true);
});
test('malformed/empty/oversized catalogs fail before SQL generation',()=>{
  for(const value of ['',"evil.com'); drop table auth.users;--",'https://mailinator.com','valid.com\nbad domain.com','x'.repeat(2_000_001)]) assert.throws(()=>parseDisposableCatalog(value,[]));
  assert.throws(()=>disposableCatalogSql(['mailinator.com'],'main'));
  assert.throws(()=>disposableCatalogSql(["x.com';drop table x;--"],'a'.repeat(40)));
});
test('generated SQL only reconciles source-owned classifications and preserves manual blocks',()=>{
  const sql=disposableCatalogSql(['playfine.com','mailinator.com'],'a'.repeat(40));
  assert.match(sql,/where d.reason like 'Maintained disposable list %'/);
  assert.match(sql,/where disposable_email_domains.reason like 'Maintained disposable list %'/);
  assert.ok(!/auth\.users|grant |revoke /i.test(sql));
});
test('user-reported disposable domain is rejected immediately including subdomains',()=>{
  for(const domain of ['playfine.com','sub.playfine.com','tanpony.com','sub.tanpony.com']) assert.deepEqual(validateEmailAddress(`probe@${domain}`),{ok:false,reason:'disposable-domain',suggestion:null});
});
