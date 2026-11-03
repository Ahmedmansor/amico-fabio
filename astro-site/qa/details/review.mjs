import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const phase=process.argv[2]||'after',origin='http://127.0.0.1:4333';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL(`./screenshots/${phase}/`,import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
 for(const locale of ['it','en'])for(const route of ['tours/ras_mohammed_white_island_vip/','packages/sharm_confidential/'])for(const width of [375,768,1280]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const path=`/${locale}/${route}`,response=await page.goto(origin+path,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>document.fonts.ready);
  const reject=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);
  const button=page.getByRole('button',{name:reject,exact:true});await button.first().waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await button.first().isVisible())await button.first().click();
  const facts=await page.evaluate(()=>{
   const text=id=>document.getElementById(id)?.textContent.replace(/\s+/g,' ').trim()||'';
   const list=id=>[...document.querySelectorAll(`#${id}>li`)].map(n=>n.textContent.replace(/^[✓×•\s]+/,'').replace(/\s+/g,' ').trim());
   const config=JSON.parse(document.getElementById('booking-config').textContent);
   return {title:text('detail-title'),duration:text('detail-duration'),description:text('detail-desc'),fullDescription:text('detail-full-desc'),notes:text('detail-important'),highlights:list('detail-highlights'),includes:list('detail-includes'),excludes:list('detail-excludes'),price:text('card-price'),initialTotal:text('live-total-price'),prices:config.prices,addons:config.addons,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const name=`${locale}-${route.split('/')[0]}-${width}`;
  await page.locator('#hero-bg-img').evaluate(img=>img.decode());
  await page.screenshot({path:fileURLToPath(new URL(name+'.png',output)),animations:'disabled'});
  const overlaps=[];
  for(const offset of [-180,0,220,500]){
   await page.evaluate(offset=>{const card=document.getElementById('booking-card-container');scrollTo(0,card.getBoundingClientRect().top+scrollY+offset);},offset);
   overlaps.push(await page.evaluate(()=>{const a=document.getElementById('detail-info-card').getBoundingClientRect(),b=document.getElementById('booking-card-container').getBoundingClientRect();return Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);}));
  }
  await page.screenshot({path:fileURLToPath(new URL(name+'-booking.png',output)),animations:'disabled'});
  let interaction={};
  if(phase==='after'){
   await page.locator('[data-gallery-open]').first().click();const dialog=page.locator('[data-product-gallery-dialog]');
   interaction.galleryOpens=await dialog.evaluate(n=>n.open);interaction.galleryImages=await dialog.locator('[data-gallery-select]').count();
   await dialog.locator('[data-lightbox-image]').evaluate(img=>img.decode());interaction.galleryLoads=await dialog.locator('[data-lightbox-image]').evaluate(img=>img.naturalWidth>0);
   await dialog.locator('[data-gallery-next]').click();interaction.galleryNext=await dialog.locator('[data-gallery-select="1"]').getAttribute('aria-pressed')==='true';await page.keyboard.press('ArrowLeft');interaction.galleryKeyboard=await dialog.locator('[data-gallery-select="0"]').getAttribute('aria-pressed')==='true';
   if(width===1280)await page.screenshot({path:fileURLToPath(new URL(name+'-gallery.png',output)),animations:'disabled'});
   await page.keyboard.press('Escape');interaction.galleryCloses=!(await dialog.evaluate(n=>n.open));
   interaction.photoCursor=await page.locator('.product-photo').first().evaluate(n=>getComputedStyle(n).cursor);
   interaction.darkHeaderMatches=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor===getComputedStyle(document.getElementById('global-header')).backgroundColor);
   if(width===1280){
    interaction.sticky=await page.evaluate(()=>{const n=document.querySelector('.sticky-form-panel');scrollTo(0,n.getBoundingClientRect().top+scrollY+300);const r=n.getBoundingClientRect();return getComputedStyle(n).position==='sticky'&&r.top>=80&&r.top<110&&r.bottom<=innerHeight;});
   }else{
    await page.evaluate(()=>scrollTo(0,0));const cta=page.locator('[data-form-mobile-bar] a');await cta.click();interaction.mobileReachesForm=await page.locator('#booking-card-container').evaluate(n=>{const r=n.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
   }
   const prices=facts.prices;
   await page.locator('[data-pax="adults"][data-change="1"]').click();await page.locator('[data-pax="children"][data-change="1"]').click();
   const actual=Number((await page.locator('#live-total-price').textContent()).replace('€',''));
   interaction.totalUpdates=Math.abs(actual-(prices.adult*(prices.minPax+1)+prices.child))<.001;
   await page.locator('[data-pax="adults"][data-change="-1"]').click();await page.locator('[data-pax="children"][data-change="-1"]').click();
   const included=page.locator('#included-trips-grid [data-trip-id]');
   if(await included.count()){await included.first().click();interaction.includedTripOpens=await page.locator('#included-trip-modal').isVisible();await page.keyboard.press('Escape');interaction.includedTripCloses=!(await page.locator('#included-trip-modal').isVisible());}

  }
  results.push({path,width,status:response.status(),...facts,overlap:overlaps.some(Boolean),errors,...interaction});await page.close();
 }
}finally{await browser.close();}
const report={origin,phase,results};
if(phase==='after'){
 const before=JSON.parse(await readFile(new URL('./review-before.json',import.meta.url),'utf8'));
 report.comparison=results.map(row=>{const old=before.results.find(n=>n.path===row.path&&n.width===row.width);return {path:row.path,width:row.width,preserved:['title','duration','description','fullDescription','notes','highlights','includes','excludes','price','initialTotal','prices','addons'].every(key=>JSON.stringify(old[key])===JSON.stringify(row[key])),overlap:row.overlap,overflow:row.overflow};});
}
await writeFile(new URL(`./review-${phase}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({phase,cases:results.length,overlaps:results.filter(n=>n.overlap).map(n=>({path:n.path,width:n.width})),errors:results.filter(n=>n.errors.length||n.overflow||n.status!==200),comparison:report.comparison},null,2));
