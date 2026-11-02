import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const page=await browser.newPage({viewport:{width:375,height:900},hasTouch:true});
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4341';
try{
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.motionTasks=[];window.motionPhases=[{name:'load',start:0}];new PerformanceObserver(list=>window.motionTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});});
 await page.goto(`${origin}/en/`,{waitUntil:'load'});await page.getByRole('button',{name:'Reject optional',exact:true}).click();
 for(const [name,selector] of [['hero','#home-hero-track'],['reviews','#reviewsTrack'],['videos','#home-video-track']]){
  await page.evaluate(name=>window.motionPhases.push({name,start:performance.now()}),name);
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction(selector=>document.querySelector(selector).scrollLeft>80,selector,{timeout:14000});
  await page.waitForTimeout(700);console.log(`${name} advanced under 4x CPU`);
 }
 const profile=await page.evaluate(()=>({phases:window.motionPhases,tasks:window.motionTasks.map(task=>({...task,phase:window.motionPhases.findLast(phase=>phase.start<=task.start).name}))}));
 const result={origin,cpuSlowdown:4,...profile};await writeFile(process.env.QA_REPORT||'qa/home-refresh/motion-main-thread.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
