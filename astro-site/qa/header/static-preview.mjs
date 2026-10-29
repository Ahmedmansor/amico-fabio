// Local QA transport only; deployment remains a static Astro directory.
// Gzip mirrors compressed HTTP delivery without changing the built files.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {gzipSync} from 'node:zlib';
const root=resolve('dist'),port=Number(process.env.QA_PORT||4333);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.png':'image/png','.txt':'text/plain','.xml':'application/xml'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  const body=await readFile(file),type=types[extname(file)]||'application/octet-stream';
  const compressed=/gzip/.test(req.headers['accept-encoding']||'')&&/text\/|json|xml|svg/.test(type);
  const payload=compressed?gzipSync(body):body;
  res.writeHead(200,{'Content-Type':type,'Content-Length':payload.length,'Cache-Control':'no-cache','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});res.end(payload);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static QA preview: http://127.0.0.1:${port} (gzip, no-cache)`));
