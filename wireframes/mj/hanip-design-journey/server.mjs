import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {extname,resolve,sep} from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.gz':'application/gzip'};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
  if(!(await stat(path)).isFile()){res.writeHead(404);res.end();return;}
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('파일을 찾을 수 없습니다.');}
}).listen(port,'127.0.0.1',()=>console.log(`한입 디자인 프로토타입: http://localhost:${port}`));
