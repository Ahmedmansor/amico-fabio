import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const phase=process.argv[2]||'after';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL(`./screenshots/${phase}/`,import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
 for(const [id,path] of [['home','/en/'],['article','/it/blog/pianificare-viaggio-egitto-2027/'],['tour','/en/tours/ras_mohammed_white_island_vip/']])for(const width of [375,768,1280]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4333'+path);
  const reject=await page.locator('#cookie-consent-config').evaluate(n=>JSON.parse(n.textContent).messages.reject);
  const button=page.getByRole('button',{name:reject,exact:true}).first();await button.waitFor({state:'visible',timeout:2000}).catch(()=>{});if(await button.isVisible())await button.click();
  await page.locator('#global-footer').scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);await page.locator('#global-footer img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode())));
  const row=await page.locator('#global-footer').evaluate(footer=>{
   const text=selector=>footer.querySelector(selector)?.textContent.replace(/\s+/g,' ').trim();
   const rect=footer.getBoundingClientRect();
   return {bio:text('.af-bio'),heritage:text('.af-legacy-text'),copyright:text('.af-copy'),headings:[...footer.querySelectorAll('h2')].map(n=>n.textContent),links:[...footer.querySelectorAll('a')].map(n=>({href:n.getAttribute('href'),label:n.getAttribute('aria-label')||n.textContent.trim()})).sort((a,b)=>a.href.localeCompare(b.href)),radius:parseFloat(getComputedStyle(footer).borderTopLeftRadius),inset:rect.left,overflow:document.documentElement.scrollWidth>innerWidth,icons:[...footer.querySelectorAll('.af-social-icon')].map(n=>({color:getComputedStyle(n).color,width:n.getBoundingClientRect().width})),targets:[...footer.querySelectorAll('.af-social-btn')].map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})),divider:footer.querySelector('.af-bottom')?getComputedStyle(footer.querySelector('.af-bottom')).borderTopWidth:null};
  });
  await page.screenshot({path:fileURLToPath(new URL(`${id}-${width}.png`,output)),animations:'disabled'});
  results.push({id,path,width,...row,errors});await page.close();
 }
}finally{await browser.close();}
const report={phase,results};
if(phase==='after'){
 const before=JSON.parse(await readFile(new URL('./review-before.json',import.meta.url),'utf8'));
 report.preserved=results.every(row=>{const old=before.results.find(n=>n.id===row.id&&n.width===row.width);return ['bio','heritage','copyright','headings','links'].every(key=>JSON.stringify(row[key])===JSON.stringify(old[key]));});
}
await writeFile(new URL(`./review-${phase}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
const failures=results.filter(r=>r.overflow||r.errors.length||(phase==='after'&&(r.radius<20||r.inset<=0||r.icons.length!==4||r.icons.some(n=>n.color!=='rgb(255, 255, 255)')||r.targets.some(n=>n.width<44||n.height<44)||r.divider!=='1px')));
console.log(JSON.stringify({phase,cases:results.length,preserved:report.preserved,failures},null,2));if(failures.length||report.preserved===false)process.exitCode=1;
