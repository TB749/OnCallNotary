const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const stamp=()=>new Date().toISOString();
const execute=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const row=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const list=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
function mailReady(env){return !!(env.RESEND_API_KEY&&env.BOOKING_FROM_EMAIL&&env.BOOKING_OWNER_EMAIL);}
function safeOrigin(request,env) {const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin||origin===env.PUBLIC_ORIGIN;}
async function body(request){if(Number(request.headers.get('content-length')||0)>12000)throw new Error('Request is too large.');const text=await request.text();if(text.length>12000)throw new Error('Request is too large.');const parsed=JSON.parse(text);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error('Invalid request.');return parsed;}
export async function flushOutbox(env,requestId=null) {
 if(!mailReady(env))return;
 const jobs=await list(env.DB,`SELECT * FROM outbox WHERE status='pending' AND request_id IN (SELECT id FROM requests WHERE kind='inquiry') ${requestId?'AND request_id=?':''} LIMIT 20`,...(requestId?[requestId]:[]));
 for(const job of jobs){
   if(Date.now()-Date.parse(job.created_at)>23*3600000){await execute(env.DB,"UPDATE outbox SET status='needs_review' WHERE id=?",job.id);continue;}
   try {
     const response=await (env.MAIL_FETCH||fetch)('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':job.id},body:JSON.stringify({from:env.BOOKING_FROM_EMAIL,to:[job.recipient],subject:job.subject,text:job.body})});
     if(!response.ok)throw new Error('Delivery provider unavailable');
     await execute(env.DB,"UPDATE outbox SET status='sent',attempts=attempts+1 WHERE id=?",job.id);
   }catch{await execute(env.DB,'UPDATE outbox SET attempts=attempts+1 WHERE id=?',job.id);}
   await execute(env.DB,"UPDATE requests SET email_status=CASE WHEN EXISTS (SELECT 1 FROM outbox WHERE request_id=? AND status <> 'sent') THEN 'pending' ELSE 'sent' END WHERE id=?",job.request_id,job.request_id);
 }
}
async function delivery(env,id){const pending=await row(env.DB,"SELECT COUNT(*) AS total FROM outbox WHERE request_id=? AND status <> 'sent'",id);return pending.total?'pending':'sent';}
async function admin(request,env){const provided=request.headers.get('Authorization')||'';return !!env.ADMIN_TOKEN&&env.ADMIN_TOKEN.length>=32&&(await hash(provided))===(await hash(`Bearer ${env.ADMIN_TOKEN}`));}
async function submit(request,env)
 {
 if(!mailReady(env))return json({error:'Online requests are temporarily unavailable. Please use our existing calendar or contact admin@on-callnotary.ca. Your entries have been kept.'},503);
 const raw=await body(request);let data;const kind='inquiry';
   data={};for(const key of ['business','name','email','phone','notarizations','commissions','contactMethod','notes'])data[key]=String(raw[key]||'').trim();
   if(data.business.length<2||data.business.length>150||data.name.length<2||data.name.length>100||!/^\S+@\S+\.\S+$/.test(data.email)||data.email.length>254||data.notes.length>2000||![data.notarizations,data.commissions].every(x=>/^\d{1,5}$/.test(x))||!['email','phone'].includes(data.contactMethod)||data.phone.length>30||data.phone.replace(/\D/g,'').length<7)return json({error:'Enter your business, contact details and estimated monthly volumes.'},400);
 const key=request.headers.get('Idempotency-Key')||'';if(!/^[a-zA-Z0-9-]{20,100}$/.test(key))return json({error:'A valid request key is required.'},400);
 const inputHash=await hash(kind+JSON.stringify(data));
 // Access token is deterministically derived from a client-held, random request key and server secret.
 // It is never derivable from the public booking reference alone.
 if(!env.BOOKING_SECRET||env.BOOKING_SECRET.length<32)return json({error:'Business inquiries are not configured. Please contact us directly.'},503);
 const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.BOOKING_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const access=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(key)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 let record=await row(env.DB,'SELECT * FROM requests WHERE idempotency_key=?',key);
 if(record&&record.input_hash!==inputHash)return json({error:'This request has changed. Please start a new submission.'},409);
 const id=record?.id||'P1-'+crypto.randomUUID();
 const summary=[`Business: ${data.business}`,`Monthly notarizations: ${data.notarizations}`,`Monthly commissions: ${data.commissions}`,`Contact by: ${data.contactMethod}`];
 const subject=`New business subscription inquiry — ${id}`;
 const message=[id,data.name,data.email,data.phone,...summary,data.notes,'Business inquiry only. No appointment or payment has been requested.'].join('\n');
 await env.DB.batch([
   env.DB.prepare('INSERT OR IGNORE INTO requests (id,access_hash,idempotency_key,input_hash,kind,payload,quote,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,await hash(access),key,inputHash,kind,JSON.stringify(data),'null',stamp()),
   env.DB.prepare('INSERT OR IGNORE INTO outbox (id,request_id,recipient,subject,body,created_at) SELECT ?,id,?,?,?,? FROM requests WHERE id=? AND input_hash=?').bind(`${id}:request`,env.BOOKING_OWNER_EMAIL,subject,message,stamp(),id,inputHash),
 ]);
 record=await row(env.DB,'SELECT * FROM requests WHERE idempotency_key=?',key);
 if(record.input_hash!==inputHash)return json({error:'Request conflict. Please retry with a new request.'},409);
 await flushOutbox(env,record.id);
 const emailStatus=await delivery(env,record.id);await execute(env.DB,'UPDATE requests SET email_status=? WHERE id=?',emailStatus,record.id);
 return json({id:record.id,access,status:record.status,emailStatus},201);
}
export async function handleApi(request,env){
 const url=new URL(request.url),path=url.pathname;
 try {
   if(!safeOrigin(request,env))return json({error:'Origin not allowed.'},403);
   if (/^\/api\/(config|quote|booking)(\/|$)/.test(path) || /^\/api\/admin\/P1-[a-f0-9-]+\/(confirm|received)$/.test(path)) return json({error:'Custom booking is retired. Use Calendly for appointments.'},410);
   if(!env.DB)return json({error:'Business inquiries are not configured. Please use the existing calendar or email admin@on-callnotary.ca.'},503);
   if(request.method==='POST'&&path==='/api/inquiry'){
     const ip=request.headers.get('CF-Connecting-IP')||'local';const minute=Math.floor(Date.now()/60000);const rateKey=await hash(`${ip}:${minute}`);
     await execute(env.DB,'DELETE FROM rate_limits WHERE expires < ?',minute);
     await execute(env.DB,'INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',rateKey,minute+2);
     if((await row(env.DB,'SELECT count FROM rate_limits WHERE key=?',rateKey)).count>10)return json({error:'Too many requests. Please wait a minute.'},429);
     return await submit(request,env);
   }
   if(path.startsWith('/api/admin/')){
     if(!await admin(request,env))return json({error:'Authorized owner access required.'},401);
     if(path==='/api/admin/requests'&&request.method==='GET')return json(await list(env.DB,'SELECT id,kind,payload,quote,status,payment_status,created_at,final_quote,email_status FROM requests ORDER BY created_at DESC LIMIT 100'));
     if(path==='/api/admin/retry-email'&&request.method==='POST'){await flushOutbox(env);return json({ok:true});}
   }
   return json({error:'Not found.'},404);
 }catch(error){return json({error:error instanceof SyntaxError?'Invalid JSON.':'Unable to process this request. Your information has been kept; please retry or contact us.'},400);}
}
