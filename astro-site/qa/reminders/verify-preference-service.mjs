import assert from 'node:assert/strict';
const endpoint='https://iiivnvwspoikfrlclhyr.supabase.co/functions/v1/wishlist-email-preferences';
for(const [name,method,origin,bearer,status] of [
  ['preflight','OPTIONS','http://127.0.0.1:4322',null,204],
  ['anonymous','GET','http://127.0.0.1:4322',null,401],
  ['denied-origin','GET','https://untrusted.test',null,403],
  ['invalid-token','GET','http://127.0.0.1:4322','synthetic-invalid-token',401],
]){
  const response=await fetch(endpoint,{method,headers:{Origin:origin,...(bearer?{Authorization:`Bearer ${bearer}`}:{})},redirect:'error',signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,status,name);
  assert.equal(response.headers.get('access-control-allow-origin'),name==='denied-origin'?null:origin);
  console.log(`${name}: ${status}, expected CORS. No real session or email used.`);
}
