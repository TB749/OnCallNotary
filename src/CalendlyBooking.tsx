import {useEffect, useRef, useState} from 'react';

type Prefill = {name:string; email:string; customAnswers:Record<string,string>};
export default function CalendlyBooking({url, prefill}:{url:string; prefill:Prefill}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading available appointments…');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let cancelled = false;
    let initialized = false;
    const timer = window.setTimeout(() => {if (!cancelled) setStatus('The calendar is taking longer to load. Retry or open Calendly directly.');}, 15000);
    const fail = () => {if (!cancelled) {window.clearTimeout(timer); setStatus('The calendar could not load. Retry or open Calendly directly.');}};
    const initialize = () => {
      if (cancelled || initialized || !(window as any).Calendly) return;
      initialized = true;
      try {(window as any).Calendly.initInlineWidget({url, parentElement:element, prefill});}
      catch {fail();}
    };
    const message = (event:MessageEvent) => {
      const frame = element.querySelector('iframe');
      if (event.origin !== 'https://calendly.com' || !frame || event.source !== frame.contentWindow) return;
      if (typeof event.data?.event !== 'string' || !event.data.event.startsWith('calendly.')) return;
      window.clearTimeout(timer);
      if (event.data.event === 'calendly.event_scheduled') {
        setStatus('Calendly reports your appointment is scheduled. Review the confirmation in the calendar below for your time and options to manage your appointment. No payment is collected here.\nSomeone will reach out and contact you.');
      } else if (['calendly.profile_page_viewed', 'calendly.event_type_viewed', 'calendly.date_and_time_selected'].includes(event.data.event)) {
        setStatus('Choose an available time and complete your booking in Calendly below.');
      }
    };
    window.addEventListener('message', message);
    let script = document.querySelector<HTMLScriptElement>('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    if ((window as any).Calendly) initialize();
    else {
      // On explicit retry, replace a failed shared loader; otherwise reuse it.
      if (retry && script) {script.remove(); script = null;}
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', initialize);
      script.addEventListener('error', fail);
    }
    return () => {cancelled = true; window.clearTimeout(timer); window.removeEventListener('message', message); script?.removeEventListener('load', initialize); script?.removeEventListener('error', fail); element.replaceChildren();};
  }, [url, prefill, retry]);
  return <section aria-label="Schedule with Calendly">
    <p role="status" style={{whiteSpace:'pre-line'}}>{status}</p>
    <div ref={container} className="sb-calendly" />
    <div className="sb-actions"><button type="button" onClick={() => {setStatus('Loading available appointments…'); setRetry(value => value + 1);}}>Reload calendar</button></div>
    <p className="sb-help"><a href={url} target="_blank" rel="noopener noreferrer">Open this event in Calendly</a>. If you use a new tab, enter your details there; this page will not track that booking.</p>
  </section>;
}
