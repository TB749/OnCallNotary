import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteBooking,allowedModes} from '../shared/catalog.mjs';
import {validateDetails,estimateBooking,eventPrefill,CALENDLY_TEST_EVENT} from '../shared/calendly.mjs';
// Expected cells C6:H17 from user-supplied On_Call_Notary_Cost_Matrix.xlsx, September 10.
const matrix = [["affidavits", "commissioning", 39, 29, 29, "Unavailable", 58, "Unavailable"], ["copies", "notarization", 39, "Unavailable", 39, "Unavailable", "Unavailable", "Unavailable"], ["copies", "guidance", "Custom quote", "Unavailable", "Custom quote + travel", "Unavailable", "Unavailable", "Unavailable"], ["business", "commissioning", 39, 29, 29, "Unavailable", 58, "Unavailable"], ["business", "notarization", 39, "Unavailable", 39, "Unavailable", "Unavailable", "Unavailable"], ["business", "guidance", "Custom quote", "Custom quote", "Custom quote + travel", "Unavailable", "Custom quote", "Unavailable"], ["international", "commissioning", 39, 29, 29, "Unavailable", 58, "Unavailable"], ["international", "notarization", 39, "Unavailable", 39, "Unavailable", "Unavailable", "Unavailable"], ["international", "guidance", "Custom quote", "Custom quote", "Custom quote + travel", "Unavailable", "Custom quote", "Unavailable"], ["mediation", "mediation", 100, "Unavailable", "Unavailable", "Unavailable", "Owner approval", "Unavailable"], ["drafting", "draft-affidavit", 65, 65, 65, "Unavailable", 65, "Unavailable"], ["drafting", "draft-consent", 50, 50, 50, "Unavailable", 50, "Unavailable"]];
const base={name:'Matrix Test',email:'matrix@example.test',phone:'4165550100',address:'123 Test Street',notes:'',quantity:1,hours:1,platform:'zoom'};
test('all 72 updated matrix cells match eligibility, base charges and review status',()=>{
 for(const [serviceId,operation,...cells] of matrix) cells.forEach((expected,i)=>{
  const timing=i<3?'regular':'urgent',mode=['in_person','online','mobile'][i%3];
  const data={...base,serviceId,operation,timing,mode};
  const errors=validateDetails(data),label=`${serviceId}/${operation}/${timing}/${mode}`;
  if(expected==='Unavailable'){assert.ok(errors.mode||errors.operation,label);return;}
  assert.deepEqual(errors,{},label);
  const quote=estimateBooking(data);
  assert.equal(quote.subtotal,typeof expected==='number'?expected*100:expected==='Owner approval'?10000:0,label);
  assert.equal(quote.status,mode==='mobile'||typeof expected!=='number'?'review_required':'calculated',label);
  assert.equal(quote.tax,Math.round(quote.subtotal*.13),label);
  assert.equal(quote.deposit+quote.balance,quote.total,label);
 });
});
test('in-person commissioning adds $10 once, retains additional seals and propagates to Calendly',()=>{
 for(const serviceId of ['affidavits','business','international']) for(const quantity of [1,2,15,500]){
  const data={...base,serviceId,operation:'commissioning',timing:'regular',mode:'in_person',quantity};
  const q=estimateBooking(data);assert.equal(q.subtotal,3900+(quantity-1)*1500);
  assert.equal(q.lines.find(l=>l.unit==='appointment').amount,1000);
  assert.match(eventPrefill({...data,quantity:1},CALENDLY_TEST_EVENT,estimateBooking({...data,quantity:1})).customAnswers.a1,/44.07/);
 }
});
test('6 PM boundary preserves online urgency, drafting rates and mediation restrictions',()=>{
 assert.deepEqual(allowedModes('mediation','17:59'),['in_person']);
 assert.deepEqual(allowedModes('mediation','18:00'),['online']);
 for(const [operation,amount] of [['draft-affidavit',6500],['draft-consent',5000]]){
  const q=quoteBooking({...base,serviceId:'drafting',operation,mode:'online',time:'18:00'});
  assert.equal(q.subtotal,amount);assert.equal(q.status,'calculated');
 }
 assert.equal(quoteBooking({...base,serviceId:'affidavits',operation:'commissioning',mode:'online',time:'17:59',quantity:2}).subtotal,4400);
 assert.equal(quoteBooking({...base,serviceId:'affidavits',operation:'commissioning',mode:'online',time:'18:00',quantity:2}).subtotal,8800);
});
