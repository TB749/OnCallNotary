export const TIMEZONE = 'America/Toronto';
export const money = cents => new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD'}).format(cents/100);
export const SERVICES = [
 {id:'affidavits',title:'Affidavits & Statutory Declarations',blurb:'Name change, common-law status, insurance claims, travel consent and more.',image:'/istockphoto-1057613520-612x612.jpg',points:['Sworn & affirmed statements','Commissioner-certified signatures','Remote commissioning available'],operations:['commissioning']},
 {id:'copies',title:'Certified Copies & Legalization',blurb:'True copies for passports, IDs, diplomas, bank statements, plus authentication guidance.',image:'/istockphoto-505753884-612x612.jpg',points:['Notary-certified true copies','Document apostille prep','Corporate & personal records'],operations:['notarization','guidance']},
 {id:'business',title:'Business & Real Estate',blurb:'Contracts, minutes books, real estate forms, CPA documents and corporate resolutions.',image:'/documents-scales-justice-stamp-public-260nw-2155309751.jpg',points:['Witnessing & execution','Mobile visits across the GTA','Appointment availability confirmed individually'],operations:['notarization','commissioning','guidance']},
 {id:'international',title:'International & Immigration',blurb:'Letters of invitation, sponsorship, consent to travel, translations (verification) and more.',image:'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=960&q=80',points:['Cross-border compliance','Certified translations (verification)','Partner network for legalization'],operations:['notarization','commissioning','guidance']},
 {id:'mediation',title:'Mediation',blurb:'Neutral third-party mediation for landlord, civil, family and real-estate matters.',image:'/services/mediation.png',points:['$100 per hour','Choose your planned hours','No legal advice or representation'],operations:['mediation']},
 {id:'drafting',title:'Legal Document Drafting',blurb:'Affidavit and travel consent letter drafting. Commissioning and notarization are charged separately.',image:'/services/legal-drafting.png',points:['Draft Affidavit — $65','Travel Consent Letter — $50'],operations:['draft-affidavit','draft-consent']},
];
export const OPERATIONS = {
 commissioning:{label:'Commissioning',first:2900,additional:1500,unit:'seal',online:true},
 notarization:{label:'Notarization / witnessing',first:3900,additional:1500,unit:'seal',online:false},
 guidance:{label:'Other document support / custom quote',unit:'quote',online:true},
 mediation:{label:'Mediation',first:10000,unit:'hour',online:true},
 'draft-affidavit':{label:'Draft Affidavit',first:6500,unit:'document',online:true},
 'draft-consent':{label:'Travel Consent Letter',first:5000,unit:'document',online:true},
};
export const MODES = {in_person:'In-Person',online:'Online',mobile:'Mobile Visit'};
export function localParts(now = new Date()) {
 const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}
export function urgentFor(time) {return /^\d{2}:\d{2}$/.test(time) && time >= '18:00';}
export function allowedModes(serviceId,time) {
 if(urgentFor(time)) return serviceId==='copies'?[]:['online'];
 return serviceId==='copies'?['in_person','mobile']: serviceId==='mediation'?['in_person','online']:['in_person','online','mobile'];
}
export function taxTotals(subtotal) {
 if(!Number.isSafeInteger(subtotal)||subtotal<0||subtotal>10000000) throw new Error('Invalid subtotal.');
 const tax=Math.round(subtotal*13/100), total=subtotal+tax, deposit=Math.round(total/2);
 return {subtotal,tax,total,deposit,balance:total-deposit,currency:'CAD'};
}
export function pricingSettings(env={}) {
 const pageOperations=String(env.PAGE_PRICING_OPERATIONS||'').split(',').filter(x=>['commissioning','notarization'].includes(x));
 const urgentOperations=String(env.URGENT_OPERATIONS||'commissioning').split(',').filter(x=>Object.hasOwn(OPERATIONS,x));
 return {pageOperations,urgentOperations,terms:env.BOOKING_TERMS||'',termsVersion:env.TERMS_VERSION||'p1-review',notice:'Payment by e-Transfer only after booking confirmation.'};
}
export function quoteBooking(data,settings=pricingSettings()) {
 const op=OPERATIONS[data.operation], service=SERVICES.find(s=>s.id===data.serviceId);
 if(!op||!service?.operations.includes(data.operation)) throw new Error('Choose an operation for this service.');
 const lines=[],reasons=[];
 const pages=settings.pageOperations.includes(data.operation);
 const quantity=data.operation==='mediation'?Number(data.hours):op.unit==='seal'?Number(data.quantity):1;
 if(!Number.isInteger(quantity)||quantity<1||quantity> (op.unit==='hour'?8:500)) throw new Error('Enter a valid whole-number quantity.');
 if(op.unit==='quote')reasons.push('This document needs an individual scope and price review.');
 else {
   let amount=op.unit==='seal'?(pages? quantity*(quantity>=50?300:quantity>=15?400:1500):op.first+(quantity-1)*op.additional):op.first*quantity;
   lines.push({label:op.label,quantity,unit:pages?'page':op.unit,amount});
   if(urgentFor(data.time)) {
     if(settings.urgentOperations.includes(data.operation))lines.push({label:'Urgent service adjustment (2× regular service total)',quantity:1,unit:'adjustment',amount});
     else reasons.push('After-hours eligibility and pricing require owner approval for this service.');
   }
 }
 if(data.mode==='mobile')reasons.push('Travel is $1.50/km. The billable distance and service location must be verified before a final total is issued.');
 return {status:reasons.length?'review_required':'calculated',lines,reasons,...taxTotals(lines.reduce((sum,x)=>sum+x.amount,0)),billingUnit:pages?'page':op.unit,notes:['13% HST. The 50% deposit is requested only after confirmation.','Final scope and appointment availability require confirmation.']};
}
export function validateBooking(input, now=new Date()) {
 const errors={}; const clean=v=>typeof v==='string'?v.trim():'';
 const data={serviceId:clean(input.serviceId),operation:clean(input.operation),date:clean(input.date),time:clean(input.time),mode:clean(input.mode),platform:clean(input.platform),quantity:Number(input.quantity??1),hours:Number(input.hours??1),address:clean(input.address),name:clean(input.name),email:clean(input.email),phone:clean(input.phone),notes:clean(input.notes),termsAccepted:input.termsAccepted===true,termsVersion:clean(input.termsVersion)};
 const service=SERVICES.find(s=>s.id===data.serviceId),op=OPERATIONS[data.operation];
 if(!service)errors.serviceId='Choose a service.';
 if(!service?.operations.includes(data.operation))errors.operation='Choose the document service you need.';
 const today=localParts(now);
 if(data.date!==today.date)errors.date='Choose a time today in Toronto. Contact us for a future date.';
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))errors.time='Choose a valid appointment time.';
 else {
   const requested=Number(data.time.slice(0,2))*60+Number(data.time.slice(3));
   const current=Number(today.time.slice(0,2))*60+Number(today.time.slice(3))+now.getUTCSeconds()/60;
   if(requested<=current)errors.time='Choose a future time today.';
   if(urgentFor(data.time)&&requested-current<30)errors.time='Urgent appointments need at least 30 minutes’ notice.';
 }
 if(!allowedModes(data.serviceId,data.time).includes(data.mode))errors.mode='This format is not available for the selected time and service.';
 if(data.mode==='online' && op?.online===false)errors.operation='This operation requires physical attendance. Change the time or requested operation.';
 if(data.mode==='online'&&!['whatsapp','zoom'].includes(data.platform))errors.platform='Choose WhatsApp Video Call or Zoom Call.';
 if(data.mode!=='online')data.platform='';
 if(data.name.length<2||data.name.length>100||/[\r\n]/.test(data.name))errors.name='Enter your full name.';
 if(data.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))errors.email='Enter a valid email address.';
 if((urgentFor(data.time)||data.platform==='whatsapp'||data.phone)&&(!/^[+\d\s().-]+$/.test(data.phone)||data.phone.replace(/\D/g,'').length<7||data.phone.replace(/\D/g,'').length>15))errors.phone='Enter a valid phone number.';
 if(data.mode==='mobile'&&(data.address.length<8||data.address.length>500))errors.address='Enter the full service address.';
 if(data.mode!=='mobile')data.address='';
 if(!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>500)errors.quantity='Enter 1 to 500.';
 if(!Number.isInteger(data.hours)||data.hours<1||data.hours>8)errors.hours='Choose 1 to 8 hours, or contact us for a different duration.';
 if(data.notes.length>2000)errors.notes='Keep notes under 2,000 characters.';
 if(!data.termsAccepted)errors.termsAccepted='Please acknowledge the booking request terms.';
 return {data,errors};
}
