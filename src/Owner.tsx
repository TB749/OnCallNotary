import {useState} from 'react';
import './booking.css';
export default function Owner() {
  const [token,setToken]=useState(''), [items,setItems]=useState<any[]>([]), [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  async function call(path:string,body?:object) {
    const response=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error);
    return data;
  }
  async function load() {
    setBusy(true);
    try {setItems(await call('/api/admin/requests'));setMessage('');}
    catch(error:any){setMessage(error.message);}
    finally{setBusy(false);}
  }
  return <main className="sb-admin">
    <a href="/">← Website</a><h1>Business inquiries &amp; saved requests</h1>
    <p>Manage new appointments in Calendly. Previous booking records are read-only. Your access token stays in memory.</p>
    <label>Owner access token<input type="password" autoComplete="off" value={token} onChange={event=>setToken(event.target.value)}/></label>
    <button disabled={busy} onClick={load}>Load requests</button>
    <button disabled={busy} onClick={async()=>{setBusy(true);try{await call('/api/admin/retry-email',{});setMessage('Business inquiry email retry processed. Reload requests to check delivery. Previous booking emails were not retried.');}catch(error:any){setMessage(error.message);}finally{setBusy(false);}}}>Retry pending inquiry email</button>
    {message&&<p role="status">{message}</p>}
    {items.map(record=><article key={record.id}><h2>{record.id}</h2><p>{record.kind==='inquiry'?'Business inquiry':'Previous booking (read-only)'} · {record.status} · email {record.email_status}</p><pre>{JSON.stringify(JSON.parse(record.payload),null,2)}</pre></article>)}
  </main>;
}
