// Temporary loopback-only QA preview of a generated static directory, not hosting.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'dist'),port=Number(process.argv[3]||4322);
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw new Error('Invalid QA port.');
if(!fs.existsSync(path.join(root,'404.html')))throw new Error('QA directory must contain the generated bilingual 404.html.');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
http.createServer((request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
    let target=path.resolve(root,'.'+pathname);
    if(target!==root&&!target.startsWith(root+path.sep))throw new Error('Outside QA directory.');
    if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
    const exists=fs.existsSync(target)&&fs.statSync(target).isFile();
    response.writeHead(exists?200:404,{'Content-Type':mime[path.extname(exists?target:'404.html')]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(exists?target:path.join(root,'404.html')).pipe(response);
  }catch{response.writeHead(400);response.end('Invalid local QA request.');}
}).listen(port,'127.0.0.1',()=>console.log(`Static QA preview: http://127.0.0.1:${port}; directory ${root}`));
