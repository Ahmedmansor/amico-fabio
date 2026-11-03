/** Backend input reader with total deadline/size bound; never logs payload. */
export async function boundedJson(request:Request,maxBytes:number,timeoutMs:number):Promise<unknown>{
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||!Number.isSafeInteger(timeoutMs)||timeoutMs<1)throw new Error('Invalid input bounds.');
  const reader=request.body?.getReader();if(!reader)throw new Error('Missing body.');
  let text='',size=0,expired=false;const decoder=new TextDecoder('utf-8',{fatal:true});
  const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},timeoutMs);
  try{while(true){const part=await reader.read();if(expired)throw new Error('Timed out.');if(part.done)break;
    size+=part.value.byteLength;if(size>maxBytes){void reader.cancel().catch(()=>{});throw new Error('Too large.');}text+=decoder.decode(part.value,{stream:true});}
    return JSON.parse(text+decoder.decode());
  }finally{clearTimeout(timer);reader.releaseLock();}
}
/** Compare digests fully; secrets never enter URLs, JSON, logs or error text. */
export async function authenticatedHeader(request:Request,name:string,expected:string):Promise<boolean>{
  const actual=request.headers.get(name);if(!actual||actual.length>512||expected.length<32)return false;
  const hash=async(value:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  const [a,b]=await Promise.all([hash(actual),hash(expected)]);let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;
}
