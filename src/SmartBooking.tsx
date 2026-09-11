import {useEffect, useMemo, useRef, useState} from 'react';
import {SERVICES, OPERATIONS, MODES, allowedModes, money} from '../shared/catalog.mjs';
import {CALENDLY_HOME, USE_SHARED_TEST_EVENT, estimateTime, validateDetails, estimateBooking, resolveEvent, eventPrefill, bookingDetails} from '../shared/calendly.mjs';
import CalendlyBooking from './CalendlyBooking';
import './booking.css';

type Form = {serviceId:string; operation:string; timing:string; mode:string; platform:string; quantity:number; hours:number; address:string; name:string; email:string; phone:string; notes:string; termsAccepted:boolean};
type Quote = {status:string; lines:{label:string; amount:number; quantity:number; unit:string}[]; reasons:string[]; subtotal:number; tax:number; total:number; deposit:number; balance:number};
const initial:Form = {serviceId:'', operation:'', timing:'', mode:'', platform:'', quantity:1, hours:1, address:'', name:'', email:'', phone:'', notes:'', termsAccepted:false};

export function Summary({quote}:{quote:Quote|null}) {
  if (!quote) return null;
  return <div className="sb-summary"><h4>{quote.status === 'calculated' ? 'Price estimate' : 'Known charges · review needed'}</h4>
    {quote.lines.map((line, index) => <div key={index}><span>{line.label}{line.quantity > 1 ? ` · ${line.quantity} ${line.unit}s` : ''}</span><strong>{money(line.amount)}</strong></div>)}
    <div><span>Subtotal</span><span>{money(quote.subtotal)}</span></div><div><span>HST (13%)</span><span>{money(quote.tax)}</span></div>
    <div className="sb-total"><span>{quote.status === 'calculated' ? 'Estimated total' : 'Known charges, including HST'}</span><strong>{money(quote.total)}</strong></div>
    {quote.status === 'calculated' ? <><div><span>Estimated 50% deposit after confirmation</span><strong>{money(quote.deposit)}</strong></div><div><span>Estimated balance after deposit</span><span>{money(quote.balance)}</span></div></> : <p>A complete price needs review before any payment amount can be issued.</p>}
    {quote.reasons.map(reason => <p key={reason}>{reason}</p>)}<p>This estimate is not an invoice or a payment request. Final scope and charges require confirmation.</p>
  </div>;
}

export default function SmartBooking() {
  const [form, setForm] = useState<Form>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState<Quote|null>(null);
  const [scheduling, setScheduling] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const service = SERVICES.find(item => item.id === form.serviceId);
  const operation = OPERATIONS[form.operation as keyof typeof OPERATIONS];
  const urgent = form.timing === 'urgent';
  const modes = allowedModes(form.serviceId, estimateTime(form.timing));
  const route = useMemo(() => quote ? resolveEvent(form) : null, [form, quote]);
  const prefill = useMemo(() => route && quote ? eventPrefill(form, route, quote) : null, [form, route, quote]);

  useEffect(() => {
    const select = (event:Event) => {
      const selected = SERVICES.find(item => item.id === (event as CustomEvent).detail);
      if (!selected) return;
      setForm(current => ({...current, serviceId:selected.id, operation:selected.operations.length === 1 ? selected.operations[0] : '', timing:'', mode:'', platform:'', address:'', quantity:1, hours:1, termsAccepted:false}));
      setStep(0); setQuote(null); setScheduling(false); setErrors({}); setMessage('');
    };
    window.addEventListener('smart-booking', select);
    return () => window.removeEventListener('smart-booking', select);
  }, []);
  useEffect(() => {if (started.current) heading.current?.focus(); started.current = true;}, [step, scheduling]);

  const set = (key:keyof Form, value:string|number|boolean) => {
    setForm(current => {
      const next = {...current, [key]:value};
      if (['serviceId', 'timing'].includes(key)) {
        next.mode = ''; next.platform = ''; next.address = '';
        if (key === 'serviceId') {
          const selected = SERVICES.find(item => item.id === value);
          next.operation = selected?.operations.length === 1 ? selected.operations[0] : '';
          next.quantity = 1; next.hours = 1;
        }
        const eligible = allowedModes(next.serviceId, estimateTime(next.timing));
        if (next.timing && eligible.length === 1) next.mode = eligible[0];
      }
      if (key === 'mode') {next.platform = ''; if (value !== 'mobile') next.address = '';}
      if (key !== 'termsAccepted') next.termsAccepted = false;
      return next;
    });
    if (key !== 'termsAccepted') setQuote(null);
    setErrors({}); setMessage('');
  };
  const field = (key:keyof Form) => ({id:`sb-${key}`, name:key, 'aria-invalid':!!errors[key], 'aria-describedby':errors[key] ? `err-${key}` : undefined});
  const error = (key:string) => errors[key] ? <span id={`err-${key}`} className="sb-field-error">{errors[key]}</span> : null;
  const next = () => {
    const allErrors = validateDetails(form);
    const currentErrors = step === 0 ? Object.fromEntries(Object.entries(allErrors).filter(([key]) => ['serviceId', 'timing', 'mode', 'platform'].includes(key))) : allErrors;
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length) {setMessage('Please check the highlighted fields.'); return;}
    setMessage('');
    if (step === 0) {setStep(1); return;}
    try {setQuote(estimateBooking(form)); setStep(2);} catch (failure) {setMessage(failure instanceof Error ? failure.message : 'Please check your details.');}
  };
  const schedule = () => {
    if (!form.termsAccepted) {setErrors({termsAccepted:'Please acknowledge the estimate and booking terms.'}); return;}
    if (Object.keys(validateDetails(form)).length || !route) {setMessage('Online scheduling is not available for this selection. Your details remain here.'); return;}
    setScheduling(true); setMessage('');
  };

  return <div className="smart-booking" id="smart-booking"><p className="sb-eyebrow">Smart Booking</p>
    <h3 ref={heading} tabIndex={-1}>{scheduling ? 'Choose an available appointment' : ['Choose your service & period', 'A few details', 'Review & schedule'][step]}</h3>
    <p className="sb-intro">Estimate your service, then choose an available time in Calendly. No payment is collected here.</p>
    {USE_SHARED_TEST_EVENT && <p className="sb-help">Test booking: all services use the same 30-minute Calendly event. Your selected service, format, planned duration and price remain subject to review.</p>}
    <ol className="sb-steps" aria-label="Booking progress">{['Service & period', 'Details & contact', 'Review & schedule'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    {scheduling && route && prefill ? <><CalendlyBooking url={route.url} prefill={prefill}/><p className="sb-help">Completing this website form does not create an appointment. Finish the Calendly steps above. e-Transfer arrangements follow booking confirmation.</p><button type="button" onClick={() => setScheduling(false)}>Back to review</button></> :
    <form noValidate onSubmit={event => {event.preventDefault(); step === 2 ? schedule() : next();}}>
      {message && <p className="sb-error" role="alert">{message}</p>}
      {step === 0 && <>
        <label htmlFor="sb-serviceId">Service type *</label><select {...field('serviceId')} value={form.serviceId} onChange={event => set('serviceId', event.target.value)}><option value="">Choose a service</option>{SERVICES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>{error('serviceId')}
        {form.serviceId && <><label htmlFor="sb-timing">Appointment period *</label><select {...field('timing')} value={form.timing} onChange={event => set('timing', event.target.value)}><option value="">Choose a period</option><option value="regular">Before 6 PM · Office hours</option><option value="urgent">From 6 PM · Urgent / online</option></select>{error('timing')}<p className="sb-help">America/Toronto. This period determines your estimate and eligible format. Calendly supplies the actual available dates and times. Your selected period is a request; check the event time before booking.</p></>}
        {form.timing && form.serviceId && <><fieldset><legend>Appointment format *</legend><div className="sb-options">{modes.map(mode => <label key={mode} className={form.mode === mode ? 'selected' : ''}><input type="radio" name="mode" checked={form.mode === mode} onChange={() => set('mode', mode)}/>{MODES[mode as keyof typeof MODES]}</label>)}</div>{!modes.length && <p>This service requires physical attendance. Choose office hours.</p>}</fieldset>{error('mode')}{urgent && <p className="sb-help">Online commissioning uses double the regular service price. Drafting stays at its regular price. After-hours mediation requires review.</p>}</>}
        {form.mode === 'online' && <><fieldset><legend>Video platform *</legend><div className="sb-options">{[['whatsapp', 'WhatsApp Video Call'], ['zoom', 'Zoom Call']].map(([value, label]) => <label key={value} className={form.platform === value ? 'selected' : ''}><input type="radio" name="platform" checked={form.platform === value} onChange={() => set('platform', value)}/>{label}</label>)}</div></fieldset>{error('platform')}</>}
      </>}
      {step === 1 && <>
        <p className="sb-help">{service?.title} · {urgent ? 'From 6 PM' : 'Before 6 PM'} · {MODES[form.mode as keyof typeof MODES]}</p>
        {service && service.operations.length > 1 && <><label htmlFor="sb-operation">{form.serviceId === 'drafting' ? 'Document to draft' : 'Service needed'} *</label><select {...field('operation')} value={form.operation} onChange={event => set('operation', event.target.value)}><option value="">Choose an option</option>{service.operations.map(id => <option key={id} value={id}>{OPERATIONS[id as keyof typeof OPERATIONS].label}</option>)}</select></>}{error('operation')}
        {operation?.unit === 'seal' && <><label htmlFor="sb-quantity">Number of seals *</label><input {...field('quantity')} type="number" min="1" max="500" value={form.quantity} onChange={event => set('quantity', Number(event.target.value))}/>{error('quantity')}<p className="sb-help">Additional seals are $15 each before 6 PM and $30 each for urgent online commissioning. In-person commissioning includes a $10 appointment fee. Ask us to review bulk page pricing separately.</p></>}
        {form.operation === 'mediation' && <><label htmlFor="sb-hours">Planned hours *</label><input {...field('hours')} type="number" min="1" max="8" step="1" value={form.hours} onChange={event => set('hours', Number(event.target.value))}/>{error('hours')}<p className="sb-help">$100/hour. Other durations and overtime require a separate agreement.</p></>}
        {form.serviceId === 'drafting' && <p className="sb-help">Affidavit $65 · Travel Consent Letter $50. Commissioning and notarization are separate services.</p>}
        {form.mode === 'mobile' && <><label htmlFor="sb-address">Service address *</label><input {...field('address')} autoComplete="street-address" maxLength={500} value={form.address} onChange={event => set('address', event.target.value)}/>{error('address')}<p className="sb-help">$1.50/km; the billable distance and complete price require review.</p></>}
        <label htmlFor="sb-name">Full name *</label><input {...field('name')} autoComplete="name" maxLength={100} value={form.name} onChange={event => set('name', event.target.value)}/>{error('name')}
        <label htmlFor="sb-email">Email address *</label><input {...field('email')} type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => set('email', event.target.value)}/>{error('email')}
        <label htmlFor="sb-phone">Phone number {urgent || form.platform === 'whatsapp' ? '*' : '(optional)'}</label><input {...field('phone')} type="tel" autoComplete="tel" value={form.phone} onChange={event => set('phone', event.target.value)}/>{error('phone')}
        <details className="sb-notes"><summary>Add a note (optional)</summary><label htmlFor="sb-notes">Additional details</label><textarea {...field('notes')} maxLength={2000} value={form.notes} onChange={event => set('notes', event.target.value)}/></details>{error('notes')}
      </>}
      {step === 2 && <>
        <p><strong>{service?.title}</strong><br/>{operation?.label}<br/>{urgent ? 'From 6 PM' : 'Before 6 PM'} · America/Toronto<br/>{MODES[form.mode as keyof typeof MODES]} {form.platform}<br/>{form.name} · {form.email}</p>
        <Summary quote={quote}/>
        {route ? <><p className="sb-help">Your details will be passed to Calendly. Choose an available time and complete the booking there. The estimate does not reserve a time. Payment arrangements follow booking confirmation.</p><label className="sb-consent"><input type="checkbox" checked={form.termsAccepted} onChange={event => set('termsAccepted', event.target.checked)}/>I understand this is an estimate, and I must complete my appointment in Calendly. Payment is requested only after confirmation.</label>{error('termsAccepted')}</> : <>
          <p role="status" className="sb-help">{quote?.status === 'review_required' ? 'This service needs a scope or price review before scheduling.' : 'Online scheduling for this selection is not available yet.'} Your details have not been submitted and no appointment has been created.</p>
          <p className="sb-help"><a href={CALENDLY_HOME} target="_blank" rel="noopener noreferrer">View the existing Calendly booking options</a>. This opens the general calendar; your selection and estimate are not transferred. Check the event details before booking.</p>
          <details className="sb-notes"><summary>Your service details</summary><textarea aria-label="Service details to copy" readOnly value={quote ? bookingDetails(form, quote) : ''}/></details>
        </>}
      </>}
      <div className="sb-actions">{step > 0 && <button type="button" onClick={() => {setStep(step - 1); setMessage(''); setErrors({});}}>Back</button>}{step < 2 ? <button className="sb-primary" type="submit">{step === 0 ? 'Continue' : 'Review estimate'}</button> : route && <button className="sb-primary" type="submit">Choose available time</button>}</div>
    </form>}
  </div>;
}
