import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const phase=process.argv[2]||'after';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL(`./screenshots/${phase}/`,import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
 for(const locale of ['it','en'])for(const width of [375,768,1280]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
  const response=await page.goto(`http://127.0.0.1:4333/${locale}/`,{waitUntil:'load'});
  await page.evaluate(()=>document.fonts.ready);
  const consent=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages);
  const reject=page.getByRole('button',{name:consent.reject,exact:true});await reject.first().waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await reject.first().isVisible())await reject.first().click();
  const facts=await page.evaluate(()=>({hero:document.querySelector('.hero-title').textContent,bio:document.querySelector('.wf-overlay-text').innerHTML,reviews:[...document.querySelectorAll('.review-card')].map(n=>n.textContent.replace(/\s+/g,' ').trim()),destinations:[...document.querySelectorAll('.home-destinations>a')].map(n=>({text:n.textContent.replace(/\s+/g,' ').trim(),href:n.getAttribute('href')}))}));
  await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-top.png`,output)),animations:'disabled'});
  await page.locator('#who-fabio').scrollIntoViewIfNeeded();await page.locator('.wf-bg').evaluate(img=>img.decode());await page.locator('.wf-figure').evaluate(img=>img.decode());await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-poster.png`,output)),animations:'disabled'});
  const row={locale,width,status:response.status(),...facts};
  if(phase==='after'){
   const poster=await page.locator('.wf-container').boundingBox();await page.mouse.move(poster.x+poster.width*.85,poster.y+poster.height*.35);
   await page.waitForTimeout(300);row.posterTilt=await page.locator('.wf-scene').evaluate(n=>getComputedStyle(n).transform);
   row.motionChunk=requests.some(url=>url.includes('home-motion'));
   await page.locator('.wf-bio-btn').click();row.biographyOpens=await page.locator('#fabio-biography').evaluate(n=>n.open);await page.keyboard.press('Escape');row.biographyCloses=!(await page.locator('#fabio-biography').evaluate(n=>n.open));
   row.videos=await page.locator('[data-home-video]').count();row.benefits=await page.locator('.home-benefit').count();row.steps=await page.locator('.home-steps>li').count();
   await page.locator('[data-review-next]').click();await page.waitForTimeout(650);row.reviewMoves=await page.locator('#reviewsTrack').evaluate(n=>n.scrollLeft>10);
   await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-reviews.png`,output)),animations:'disabled'});
   row.vimeoBeforePlay=requests.some(url=>url.includes('vimeo.com'));
   if(width===1280&&locale==='en'){
    const pause=page.locator('[data-review-pause]');await pause.click();await page.mouse.move(0,0);await page.locator('#reviewsTrack').evaluate(n=>n.scrollTo({left:0,behavior:'instant'}));await page.waitForTimeout(6800);
    row.reviewAutoMoves=await page.locator('#reviewsTrack').evaluate(n=>n.scrollLeft>10);
    await pause.click();const stopped=await page.locator('#reviewsTrack').evaluate(n=>n.scrollLeft);await page.waitForTimeout(6500);row.reviewPauseWorks=await page.locator('#reviewsTrack').evaluate((n,stopped)=>Math.abs(n.scrollLeft-stopped)<2,stopped);
    await page.locator('.home-videos').scrollIntoViewIfNeeded();await page.screenshot({path:fileURLToPath(new URL('en-1280-videos.png',output)),animations:'disabled'});
   }
  }
  row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);row.errors=errors;results.push(row);await page.close();
 }
}finally{await browser.close();}
const report={phase,results};
if(phase==='after'){
 const before=JSON.parse(await readFile(new URL('./review-before.json',import.meta.url),'utf8'));
 report.comparison=results.map(row=>({locale:row.locale,width:row.width,preserved:['hero','bio','reviews','destinations'].every(key=>JSON.stringify(row[key])===JSON.stringify(before.results.find(n=>n.locale===row.locale&&n.width===row.width)[key]))}));
}
await writeFile(new URL(`./review-${phase}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
const failures=results.filter(r=>r.status!==200||r.overflow||r.errors.length||(phase==='after'&&(!r.biographyOpens||!r.biographyCloses||r.videos!==6||r.benefits!==3||r.steps!==4||!r.reviewMoves||r.vimeoBeforePlay||(r.width===375&&r.motionChunk)||(r.width>375&&!r.motionChunk)||(r.reviewAutoMoves===false)||(r.reviewPauseWorks===false))));
console.log(JSON.stringify({phase,cases:results.length,failures,comparison:report.comparison},null,2));if(failures.length||report.comparison?.some(n=>!n.preserved))process.exitCode=1;
