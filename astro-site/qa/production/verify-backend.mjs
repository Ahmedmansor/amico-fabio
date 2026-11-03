// Read-only release checks. No authenticated writes, Auth sending or mailbox test.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='https://iiivnvwspoikfrlclhyr.supabase.co/functions/v1/';
const origin='https://fabioegypt.com', checks=[];
for(const name of ['account-locale','wishlist-email-preferences','wishlist-email-management']) {
  for(const allowed of [origin,'https://amico-fabio-iyzo.vercel.app']) {
    const response=await fetch(base+name,{method:'OPTIONS',headers:{Origin:allowed,'Access-Control-Request-Method':'GET'}});
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),allowed,`${name}: allowed origin`);
    assert.ok(response.ok);checks.push({name,kind:'preflight',origin:allowed,status:response.status});
  }
  const blocked=await fetch(base+name,{method:'OPTIONS',headers:{Origin:'https://untrusted.invalid','Access-Control-Request-Method':'GET'}});
  assert.notEqual(blocked.headers.get('Access-Control-Allow-Origin'),'https://untrusted.invalid');
  checks.push({name,kind:'hostile-origin-rejected',status:blocked.status});
  const denied=await fetch(base+name,{headers:{Origin:origin}});
  assert.ok([400,401,403,405].includes(denied.status),`${name}: anonymous/capability-free GET must fail (${denied.status})`);
  checks.push({name,kind:'unauthenticated-denied',status:denied.status});
}
const hook=await fetch(base+'auth-send-email',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
assert.equal(hook.status,401);checks.push({name:'auth-send-email',kind:'unsigned-hook-denied',status:hook.status});
await writeFile(new URL('./backend.json',import.meta.url),JSON.stringify({origin,checks,realEmailsSent:0,authenticatedWrites:0},null,2)+'\n');
console.log(`Production backend: ${checks.length} CORS/auth-denial checks passed; no email or account mutation.`);
