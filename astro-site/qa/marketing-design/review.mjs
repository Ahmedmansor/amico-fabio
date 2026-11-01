import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER});
const output=new URL('./screenshots/',import.meta.url);await mkdir(output,{recursive:true});
const results=[];
try{
 for(const locale of ['it','en'])for(const width of [375,1280]){
  const page=await browser.newPage({viewport:{width,height:1050},reducedMotion:'reduce'}),errors=[],remote=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:4338/'))remote.push(new URL(request.url()).hostname);});
  await page.goto(`http://127.0.0.1:4338/${locale}/qa-marketing-card/`);
  const root=page.locator('[data-marketing-consent]'),choice=root.locator('[data-marketing-choice]');
  await root.waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);await root.locator('img').evaluate(n=>n.decode());
  const row={locale,width,uncheckedInitially:!(await choice.isChecked()),portraitLoads:await root.locator('img').evaluate(n=>n.naturalWidth>0)};
  const signup=page.locator('[data-login-marketing-row]'),intent=signup.locator('[data-login-marketing-intent]');
  row.signupUnchecked=!(await intent.isChecked());row.signupOptional=!(await intent.evaluate(n=>n.required));
  await intent.focus();await page.keyboard.press('Space');row.signupKeyboard=await intent.isChecked();
  row.signupPortrait=await signup.locator('img').evaluate(async n=>{await n.decode();return n.naturalWidth>0;});
  await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-signup.png`,output)),animations:'disabled'});
  await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-ready.png`,output)),animations:'disabled'});
  await choice.focus();await page.keyboard.press('Space');row.keyboardChoice=await choice.isChecked();
  await root.locator('[data-marketing-save]').click();row.previewDoesNotClaimSave=(await root.locator('[data-marketing-status]').textContent()).includes(locale==='it'?'nessuna preferenza':'no preference');
  await page.locator('[data-qa-state=failed]').click();row.failedLocked=await choice.isDisabled();row.retryVisible=await root.locator('[data-marketing-retry]').isVisible();
  await page.screenshot({path:fileURLToPath(new URL(`${locale}-${width}-failed.png`,output)),animations:'disabled'});
  await root.locator('[data-marketing-retry]').click();row.retryReady=!(await choice.isDisabled())&&!(await choice.isChecked());
  await page.locator('[data-qa-state=verify]').click();row.unverifiedLocked=await choice.isDisabled();
  await page.locator('[data-qa-state=loading]').click();row.loadingLocked=await root.locator('[data-marketing-save]').isDisabled();
  await page.locator('[data-qa-state=ready]').click();
  row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);row.errors=errors;row.remoteRequests=remote;
  results.push(row);await page.close();
 }
}finally{await browser.close();}
const liveMarketingStillGated=!(await readFile(new URL('../../dist/en/wishlist/index.html',import.meta.url),'utf8')).includes('data-marketing-consent');
await writeFile(new URL('./review.json',import.meta.url),JSON.stringify({liveMarketingStillGated,results},null,2)+'\n');
const failures=results.filter(row=>!row.signupUnchecked||!row.signupOptional||!row.signupKeyboard||!row.signupPortrait||!row.uncheckedInitially||!row.portraitLoads||!row.keyboardChoice||!row.previewDoesNotClaimSave||!row.failedLocked||!row.retryVisible||!row.retryReady||!row.unverifiedLocked||!row.loadingLocked||row.overflow||row.errors.length||row.remoteRequests.length);
console.log(JSON.stringify({cases:results.length,liveMarketingStillGated,failures},null,2));if(failures.length||!liveMarketingStillGated)process.exitCode=1;
