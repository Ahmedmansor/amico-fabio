import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const sources=['iphone-audit-final.json','iphone-audit-catalog-verified.json','iphone-audit-recovery-verified.json','iphone-extra-final.json'];
const latest=new Map(),runs=[];
for(const file of sources){
 const report=JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
 runs.push({file,cases:report.results.length,passed:report.results.filter(r=>r.status==='pass').length,failed:report.results.filter(r=>r.status==='fail').length});
 for(const row of report.results)latest.set(`${row.device}:${row.locale||'it'}:${row.name||row.kind}`,{...row,evidence:file});
}
const cases=[...latest.values()],passed=cases.filter(r=>r.status==='pass').length;
const report={date:'2026-11-03',sourceCommit:'c521282',engine:'WebKit 26.0',physicalDevice:false,deployed:false,externalSubmissions:0,
 methodology:'Latest result per distinct device/language/journey; retained original runs and focused reruns. Synthetic Auth and campaign responses, blocked external traffic.',
 runs,total:cases.length,passed,failed:cases.length-passed,cases};
await writeFile(new URL('IPHONE_AUDIT.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({runs,total:report.total,passed,failed:report.failed,deployed:false,externalSubmissions:0}));
assert.equal(report.failed,0);assert.equal(report.total,60);
