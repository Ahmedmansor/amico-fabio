// Explicit reviewed maintenance, never run during a page request or static build.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {legitimateEmailDomains} from '../src/features/auth/domain/email-validation.ts';
import {parseDisposableCatalog,disposableCatalogSql} from '../src/features/auth/data/disposable-catalog.ts';
import {readBoundedBody,withDeadline} from '../src/features/auth/data/hook-transport.ts';

const directory=new URL('../supabase/auth-protection/data/',import.meta.url);
const snapshot=new URL('disposable_email_blocklist.conf',directory);
const metadataPath=new URL('metadata.json',directory);
const sqlOutput=new URL('../.astro/auth-protection/disposable-domains.sql',import.meta.url);
const repository='disposable-email-domains/disposable-email-domains';
const args=process.argv.slice(2);
const revisionIndex=args.indexOf('--revision');
const requestedRevision=revisionIndex>=0?args[revisionIndex+1]:null;
if(requestedRevision&&!/^[a-f0-9]{40}$/.test(requestedRevision))throw Error('Use a full immutable commit SHA');
if(revisionIndex>=0&&!requestedRevision)throw Error('Missing revision');
if(args.some((value,index)=>!['--refresh','--revision'].includes(value)&&!(revisionIndex>=0&&index===revisionIndex+1)))throw Error('Unknown option');

async function download(url){
  return withDeadline(async signal=>{
    const response=await fetch(url,{headers:{'User-Agent':'Fabio-Egypt-domain-maintenance'},signal});
    if(!response.ok)throw Error(`Upstream returned HTTP ${response.status}`);
    return readBoundedBody(response.body,2_000_000,signal);
  },15000);
}
const digest=text=>createHash('sha256').update(text).digest('hex');
let text,metadata;
if(args.includes('--refresh')||requestedRevision){
  let revision=requestedRevision;
  if(!revision){const commit=JSON.parse(await download(`https://api.github.com/repos/${repository}/commits/main`));revision=commit.sha;}
  if(!/^[a-f0-9]{40}$/.test(revision))throw Error('Invalid upstream revision');
  const base=`https://raw.githubusercontent.com/${repository}/${revision}/`;
  text=await download(base+'disposable_email_blocklist.conf');
  const license=await download(base+'LICENSE.txt');
  const parsed=parseDisposableCatalog(text,[...legitimateEmailDomains,'fabioegypt.com']);
  if(parsed.length<1000||parsed.length>100000)throw Error('Unexpected catalog size; review before saving');
  if(!license.startsWith('CC0 1.0 Universal'))throw Error('Review changed upstream license before saving');
  metadata={repository,revision,url:base+'disposable_email_blocklist.conf',sha256:digest(text),retrievedAt:new Date().toISOString(),license:'CC0-1.0; upstream LICENSE.txt vendored'};
  await mkdir(directory,{recursive:true});
  await writeFile(snapshot,text);
  await writeFile(new URL('LICENSE.txt',directory),license.replace(/[\t ]+$/gm,''));
  await writeFile(metadataPath,JSON.stringify(metadata,null,2)+'\n');
}else{
  text=await readFile(snapshot,'utf8');metadata=JSON.parse(await readFile(metadataPath,'utf8'));
  if(metadata.sha256!==digest(text))throw Error('Snapshot checksum mismatch');
}
const domains=parseDisposableCatalog(text,[...legitimateEmailDomains,'fabioegypt.com']);
if(domains.length<1000||domains.length>100000)throw Error('Unexpected catalog size; review before import');
await mkdir(new URL('./',sqlOutput),{recursive:true});
await writeFile(sqlOutput,disposableCatalogSql(domains,metadata.revision));
console.log(JSON.stringify({revision:metadata.revision,sha256:metadata.sha256,domains:domains.length,playfineIncluded:domains.includes('playfine.com'),sql:'astro-site/.astro/auth-protection/disposable-domains.sql',sqlExecuted:false}));
