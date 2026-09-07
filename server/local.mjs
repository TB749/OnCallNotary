import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import {handleApi} from './api.mjs';
export function createDB(file=':memory:') {
 const sqlite=new DatabaseSync(file);sqlite.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));sqlite.exec('PRAGMA foreign_keys=ON;');
 const wrap=(sql,args=[])=>({sql,args,bind(...values){return wrap(sql,values);},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});
 return {sqlite,prepare:wrap,async batch(statements){sqlite.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>{const r=sqlite.prepare(s.sql).run(...s.args);return {meta:{changes:Number(r.changes)}};});sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
}
export function startApi(env,port=8788){
 mkdirSync('.local',{recursive:true});const DB=createDB('.local/bookings.sqlite');
 const server=createServer(async(req,res)=>{
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>12000){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
   const headers=new Headers();for(const [k,v]of Object.entries(req.headers)){if(v)headers.set(k,Array.isArray(v)?v.join(','):v);}
   const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
   const result=await handleApi(request,{...env,DB});res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
 });server.listen(port,'127.0.0.1');return server;
}
