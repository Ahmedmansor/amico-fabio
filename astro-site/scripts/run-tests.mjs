import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const tests = [];
function find(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) find(file);
    else if (entry.name.endsWith('.test.mjs')) tests.push(file);
  }
}
find('src');
const result = spawnSync(process.execPath, ['--test', ...tests.sort()], { stdio: 'inherit' });
if (result.error) throw result.error;
if(result.status!==0)process.exitCode=result.status??1;
else {
  const domain=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run'],{stdio:'inherit'});
  if(domain.error)throw domain.error;
  process.exitCode=domain.status??1;
}
