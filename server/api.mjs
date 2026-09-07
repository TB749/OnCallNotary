import {SERVICES,MODES,OPERATIONS,pricingSettings,quoteBooking,validateBooking,taxTotals,money,localParts} from '../shared/catalog.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const stamp=()=>new Date().toISOString();
const execute=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const row=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const list=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
function quotePlan(data){const {serviceId,operation,date,time,mode,platform,quantity,hours,address}=data;return {serviceId,operation,date,time,mode,platform,quantity,hours,address};}
async function quoteSignature(data,quote,expires,secret){return sign(JSON.stringify({plan:quotePlan(data),quote,expires}),secret);}
function mailReady(env){return !!(env.RESEND_API_KEY&&env.BOOKING_FROM_EMAIL&&env.BOOKING_OWNER_EMAIL);}
function safeOrigin(request,env) {const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin||origin===env.PUBLIC_ORIGIN;}
async function body(request){if(Number(request.headers.get('content-length')||0)>12000)throw new Error('Request is too large.');const text=await request.text();if(text.length>12000)throw new Error('Request is too large.');const parsed=JSON.parse(text);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error('Invalid request.');return parsed;}
async function queue(db,id,kind,recipient,subject,text){await execute(db,'INSERT OR IGNORE INTO outbox (id,request_id,recipient,subject,body,created_at) VALUES (?,?,?,?,?,?)',`${id}:${kind}`,id,recipient,subject,text,stamp());}
export async function flushOutbox(env,requestId=null) {
 if(!mailReady(env))return;
 const jobs=await list(env.DB,`SELECT * FROM outbox WHERE status='pending' ${requestId?'AND request_id=?':''} LIMIT 20`,...(requestId?[requestId]:[]));
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
function recordForClient(record,env){
 const final=record.final_quote?JSON.parse(record.final_quote):null;
 const payment=record.status==='confirmed'&&final&&env.ETRANSFER_EMAIL?{recipient:env.ETRANSFER_EMAIL,amount:final.deposit,reference:record.id}:null;
 return {id:record.id,status:record.status,paymentStatus:record.payment_status,quote:final||JSON.parse(record.quote||'null'),payment,details:JSON.parse(record.payload),emailStatus:record.email_status};
}
async function submit(request,env,kind) {
 if(!mailReady(env))return json({error:'Online requests are temporarily unavailable. Please use our existing calendar or contact admin@on-callnotary.ca. Your entries have been kept.'},503);
 const raw=await body(request);let data,quote;
 if(kind==='booking'){
   const checked=validateBooking(raw,env.NOW?.()||new Date());if(Object.keys(checked.errors).length)return json({error:'Please check the highlighted fields.',errors:checked.errors},400);
   data=checked.data;const settings=pricingSettings(env);
   if(data.termsVersion!==settings.termsVersion)return json({error:'Booking terms have changed. Refresh the page before submitting; keep a copy of your notes.'},409);
   quote=quoteBooking(data,settings);
   const [expiry,signature]=String(raw.quoteToken||'').split('.');const expires=Number(expiry);
   if(!env.BOOKING_SECRET||env.BOOKING_SECRET.length<32)return json({error:'Online booking is not configured. Please use our existing calendar or contact us.'},503);
   if(!signature||!Number.isSafeInteger(expires)||expires<Date.now()||expires>Date.now()+16*60000||signature!==await quoteSignature(data,quote,expires,env.BOOKING_SECRET))return json({error:'Your quote has expired or changed. Return to Details and review the current price before submitting.'},409);
 }else {
   data={};for(const key of ['business','name','email','phone','notarizations','commissions','contactMethod','notes'])data[key]=String(raw[key]||'').trim();
   if(data.business.length<2||data.business.length>150||data.name.length<2||data.name.length>100||!/^\S+@\S+\.\S+$/.test(data.email)||data.email.length>254||data.notes.length>2000||![data.notarizations,data.commissions].every(x=>/^\d{1,5}$/.test(x))||!['email','phone'].includes(data.contactMethod)||data.phone.length>30||data.phone.replace(/\D/g,'').length<7)return json({error:'Enter your business, contact details and estimated monthly volumes.'},400);
 }
 const key=request.headers.get('Idempotency-Key')||'';if(!/^[a-zA-Z0-9-]{20,100}$/.test(key))return json({error:'A valid request key is required.'},400);
 const inputHash=await hash(kind+JSON.stringify(data));
 // Access token is deterministically derived from a client-held, random request key and server secret.
 // It is never derivable from the public booking reference alone.
 if(!env.BOOKING_SECRET||env.BOOKING_SECRET.length<32)return json({error:'Online booking is not configured. Please contact us directly.'},503);
 const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.BOOKING_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const access=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(key)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 let record=await row(env.DB,'SELECT * FROM requests WHERE idempotency_key=?',key);
 if(record&&record.input_hash!==inputHash)return json({error:'This request has changed. Please start a new submission.'},409);
 const id=record?.id||'P1-'+crypto.randomUUID();
 const summary=kind==='booking'?[
   SERVICES.find(s=>s.id===data.serviceId).title,OPERATIONS[data.operation].label,`${data.date} ${data.time} America/Toronto`,`${MODES[data.mode]} ${data.platform}`,`Quantity: ${data.quantity}; planned hours: ${data.hours}`,data.address,
   ...quote.lines.map(x=>`${x.label}: ${money(x.amount)}`),`HST: ${money(quote.tax)}; ${quote.status==='calculated'?'Calculated':'Known charges only'} total: ${money(quote.total)}`,`Deposit after confirmation: ${money(quote.deposit)}; balance: ${money(quote.balance)}`,...quote.reasons
 ]:[`Business: ${data.business}`,`Monthly notarizations: ${data.notarizations}`,`Monthly commissions: ${data.commissions}`,`Contact by: ${data.contactMethod}`];
 const subject=`New ${kind==='booking'?'booking request':'business subscription inquiry'} — ${id}`;
 const message=[id,data.name,data.email,data.phone,...summary,data.notes,'No payment requested. Confirm availability and final scope before issuing e-Transfer instructions.'].join('\n');
 await env.DB.batch([
   env.DB.prepare('INSERT OR IGNORE INTO requests (id,access_hash,idempotency_key,input_hash,kind,payload,quote,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,await hash(access),key,inputHash,kind,JSON.stringify(data),JSON.stringify(quote||null),stamp()),
   env.DB.prepare('INSERT OR IGNORE INTO outbox (id,request_id,recipient,subject,body,created_at) SELECT ?,id,?,?,?,? FROM requests WHERE id=? AND input_hash=?').bind(`${id}:request`,env.BOOKING_OWNER_EMAIL,subject,message,stamp(),id,inputHash),
 ]);
 record=await row(env.DB,'SELECT * FROM requests WHERE idempotency_key=?',key);
 if(record.input_hash!==inputHash)return json({error:'Request conflict. Please retry with a new request.'},409);
 await flushOutbox(env,record.id);
 const emailStatus=await delivery(env,record.id);await execute(env.DB,'UPDATE requests SET email_status=? WHERE id=?',emailStatus,record.id);
 return json({id:record.id,access,status:record.status,emailStatus},201);
}
function torontoInstant(date,time) {
 // Resolve local time by round-trip, rather than treating Toronto wall time as UTC.
 for(const offset of [4,5]){const utc=new Date(`${date}T${time}:00Z`);utc.setUTCHours(utc.getUTCHours()+offset);const local=localParts(utc);if(local.date===date&&local.time===time)return utc.toISOString();}
 throw new Error('Invalid Toronto time.');
}
async function confirm(request,env,id){
 const record=await row(env.DB,'SELECT * FROM requests WHERE id=?',id);if(!record||record.kind!=='booking')return json({error:'Booking not found.'},404);
 if(record.status==='confirmed')return json({error:'This booking is already confirmed. Use its existing confirmation.'},409);
 const data=JSON.parse(record.payload),input=await body(request),quote=JSON.parse(record.quote);
 if(input.externalCalendarChecked!==true&&input.externalCalendarChecked!=='yes')return json({error:'Check the existing Calendly calendar and other commitments before confirming.'},400);
 const checked=validateBooking(data,env.NOW?.()||new Date());if(Object.keys(checked.errors).length)return json({error:'The requested time has expired or is no longer eligible. Ask the customer to submit a new request.',errors:checked.errors},409);
 const duration=Number(input.durationMinutes);if(!Number.isInteger(duration)||duration<15||duration>480)return json({error:'Specify a duration from 15 to 480 minutes.'},400);
 if(data.operation==='mediation'&&duration!==data.hours*60)return json({error:'Duration must match the requested mediation hours.'},400);
 let final=quote;
 if(quote.status!=='calculated'){
   const serviceCents=Number(input.serviceCents),distance=Number(input.distanceKm||0),reason=String(input.reason||'').trim();
   if(!Number.isSafeInteger(serviceCents)||serviceCents<0||serviceCents>10000000||!reason||reason.length>1000||!Number.isFinite(distance)||distance<0||distance>1000)return json({error:'Enter the approved service amount in cents, verified distance and a pricing explanation.'},400);
   if(data.mode==='mobile'&&(!Object.hasOwn(input,'distanceKm')||distance<=0))return json({error:'A verified positive mobile travel distance is required.'},400);
   if(data.mode!=='mobile'&&distance!==0)return json({error:'Travel is not applicable to this booking.'},400);
   const travel=Math.round(distance*150);
   final={status:'calculated',lines:[{label:reason,amount:serviceCents,quantity:1,unit:'service'},...(travel?[{label:`Verified travel (${distance} km)`,amount:travel,quantity:distance,unit:'km'}]:[])],reasons:[],...taxTotals(serviceCents+travel)};
 }
 if(!env.ETRANSFER_EMAIL||!/^\S+@\S+\.\S+$/.test(env.ETRANSFER_EMAIL))return json({error:'Set the approved e-Transfer recipient before confirming.'},503);
 if(!mailReady(env))return json({error:'Email is not configured.'},503);
 const starts=torontoInstant(data.date,data.time),ends=new Date(new Date(starts).getTime()+duration*60000).toISOString();
 // One atomic SQLite statement arbitrates overlapping intervals, including different start times.
 const now=stamp();
 const confirmationText=[`Your appointment is confirmed.`,SERVICES.find(s=>s.id===data.serviceId).title,OPERATIONS[data.operation].label,`${data.date} ${data.time} America/Toronto`,MODES[data.mode],data.platform,data.address,...final.lines.map(x=>`${x.label}: ${money(x.amount)}`),`HST: ${money(final.tax)}; total: ${money(final.total)}`,`Please send the 50% deposit of ${money(final.deposit)} by Interac e-Transfer to ${env.ETRANSFER_EMAIL}.`,`Reference: ${id}`,`Balance after deposit: ${money(final.balance)}.`,`Payment status: unpaid. Questions: ${env.BOOKING_OWNER_EMAIL}`].join('\n');
 const results=await env.DB.batch([
   env.DB.prepare('INSERT OR IGNORE INTO reservations (request_id,starts_at,ends_at) SELECT ?,?,? WHERE NOT EXISTS (SELECT 1 FROM reservations WHERE starts_at < ? AND ends_at > ?)').bind(id,starts,ends,ends,starts),
   env.DB.prepare("UPDATE requests SET status='confirmed',confirmed_at=?,starts_at=?,ends_at=?,final_quote=?,email_status='pending' WHERE id=? AND status='requested' AND EXISTS (SELECT 1 FROM reservations WHERE request_id=? AND starts_at=? AND ends_at=?)").bind(now,starts,ends,JSON.stringify(final),id,id,starts,ends),
   env.DB.prepare("INSERT INTO audit SELECT ?,id,?,? FROM requests WHERE id=? AND status='confirmed' AND confirmed_at=?").bind(crypto.randomUUID(),'Owner checked external calendar; booking confirmed; deposit unpaid',now,id,now),
   env.DB.prepare("INSERT OR IGNORE INTO outbox (id,request_id,recipient,subject,body,created_at) SELECT ?,id,?,?,?,? FROM requests WHERE id=? AND status='confirmed' AND confirmed_at=?").bind(`${id}:confirmation`,data.email,`Appointment confirmed — ${id}`,confirmationText,now,id,now),
 ]);
 if(!results[1].meta.changes)return json({error:'This time overlaps a confirmed appointment or another confirmation was processed. Refresh the list.'},409);
 await flushOutbox(env,id);const emailStatus=await delivery(env,id);await execute(env.DB,'UPDATE requests SET email_status=? WHERE id=?',emailStatus,id);
 return json({status:'confirmed',emailStatus});
}
export async function handleApi(request,env){
 const url=new URL(request.url),path=url.pathname;
 try {
   if(!safeOrigin(request,env))return json({error:'Origin not allowed.'},403);
   if(path==='/api/config'&&request.method==='GET')return json(pricingSettings(env));
   if(path==='/api/quote'&&request.method==='POST'){
     const input=await body(request);const checked=validateBooking(input,env.NOW?.()||new Date());
     const errors=Object.fromEntries(Object.entries(checked.errors).filter(([k])=>!['name','email','phone','termsAccepted'].includes(k)));
     if(Object.keys(errors).length)return json({error:'Check your booking details.',errors},400);
   const quote=quoteBooking(checked.data,pricingSettings(env));const expires=Date.now()+15*60000;
   const quoteToken=env.BOOKING_SECRET?.length>=32?`${expires}.${await quoteSignature(checked.data,quote,expires,env.BOOKING_SECRET)}`:null;
   return json({...quote,quoteToken,expiresAt:expires});
   }
   if(!env.DB)return json({error:'Online booking is not configured. Please use the existing calendar or email admin@on-callnotary.ca.'},503);
   if(request.method==='POST'&&['/api/booking','/api/inquiry'].includes(path)){
     const ip=request.headers.get('CF-Connecting-IP')||'local';const minute=Math.floor(Date.now()/60000);const rateKey=await hash(`${ip}:${minute}`);
     await execute(env.DB,'DELETE FROM rate_limits WHERE expires < ?',minute);
     await execute(env.DB,'INSERT INTO rate_limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',rateKey,minute+2);
     if((await row(env.DB,'SELECT count FROM rate_limits WHERE key=?',rateKey)).count>10)return json({error:'Too many requests. Please wait a minute.'},429);
     return await submit(request,env,path.endsWith('inquiry')?'inquiry':'booking');
   }
   const statusMatch=path.match(/^\/api\/booking\/(P1-[a-f0-9-]+)$/);
   if(statusMatch&&request.method==='GET'){
     const record=await row(env.DB,'SELECT * FROM requests WHERE id=?',statusMatch[1]);
     if(!record||record.access_hash!==await hash(request.headers.get('X-Booking-Access')||''))return json({error:'Booking not found.'},404);
     return json(recordForClient(record,env));
   }
   if(path.startsWith('/api/admin/')){
     if(!await admin(request,env))return json({error:'Authorized owner access required.'},401);
     if(path==='/api/admin/requests'&&request.method==='GET')return json(await list(env.DB,'SELECT id,kind,payload,quote,status,payment_status,created_at,final_quote,email_status FROM requests ORDER BY created_at DESC LIMIT 100'));
     if(path==='/api/admin/retry-email'&&request.method==='POST'){await flushOutbox(env);return json({ok:true});}
     const action=path.match(/^\/api\/admin\/(P1-[a-f0-9-]+)\/(confirm|received)$/);
     if(action&&request.method==='POST'){
       if(action[2]==='confirm')return await confirm(request,env,action[1]);
       const changed=await execute(env.DB,"UPDATE requests SET payment_status='received' WHERE id=? AND status='confirmed' AND payment_status='unpaid'",action[1]);
       if(!changed.meta.changes)return json({error:'Confirm the booking first, or the deposit is already recorded.'},409);
       await execute(env.DB,'INSERT INTO audit VALUES (?,?,?,?)',crypto.randomUUID(),action[1],'Owner verified deposit receipt',stamp());
       return json({paymentStatus:'received'});
     }
   }
   return json({error:'Not found.'},404);
 }catch(error){return json({error:error instanceof SyntaxError?'Invalid JSON.':'Unable to process this request. Your information has been kept; please retry or contact us.'},400);}
}
