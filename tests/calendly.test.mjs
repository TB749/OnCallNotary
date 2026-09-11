import test from 'node:test';
import assert from 'node:assert/strict';
import {quoteBooking, SERVICES, allowedModes} from '../shared/catalog.mjs';
import {validateDetails, estimateBooking, resolveEvent, eventPrefill, EVENT_ROUTES, CALENDLY_TEST_EVENT} from '../shared/calendly.mjs';

const form = {serviceId:'affidavits', operation:'commissioning', timing:'regular', mode:'online', platform:'zoom', quantity:2, hours:1, address:'', name:'Test Person', email:'test@example.test', phone:'', notes:'Please review my documents.'};
const route = {...form, url:'https://calendly.com/oncall-notaryontario/test-only', reviewed:true, detailsQuestion:'a3', maxSeals:10};

test('independent test URL is exact and remains disabled pending configuration review', () => {
  const pending = {...route, ...CALENDLY_TEST_EVENT};
  assert.equal(resolveEvent(form, [pending]), null);
  const reviewed = {...pending, reviewed:true};
  assert.equal(resolveEvent(form, [reviewed]), reviewed);
  for (const url of [CALENDLY_TEST_EVENT.url + '-other', CALENDLY_TEST_EVENT.url + '?x=1', 'https://calendly.com/tombee10/other']) {
    assert.equal(resolveEvent(form, [{...reviewed,url}]), null);
  }
});

test('estimates preserve all existing operation calculations, quantities, urgency and rounding', () => {
  const services = {commissioning:'affidavits', notarization:'copies', guidance:'copies', mediation:'mediation', 'draft-affidavit':'drafting', 'draft-consent':'drafting'};
  for (const [operation, serviceId] of Object.entries(services)) for (const timing of ['regular','urgent']) for (const quantity of [1,2,14,15,49,50,500]) {
    const data = {...form, serviceId, operation, timing, quantity, hours:3};
    assert.deepEqual(estimateBooking(data), quoteBooking({...data,time:timing === 'urgent' ? '18:00' : '12:00'}));
  }
  const draft = estimateBooking({...form,serviceId:'drafting',operation:'draft-affidavit'});
  assert.equal(draft.total,7345); assert.equal(draft.deposit,3673); assert.equal(draft.balance,3672);
});
test('shared test event is the default without inventing production routes', () => {
  assert.deepEqual(EVENT_ROUTES,[]);
  assert.equal(resolveEvent(form),CALENDLY_TEST_EVENT);
  assert.equal(resolveEvent(form,[{...route,url:'https://calendly.com/oncall-notaryontario'}]),null);
});

test('all valid services, formats, periods and scopes use the shared test event', () => {
  for (const service of SERVICES) for (const operation of service.operations) for (const timing of ['regular','urgent']) {
    for (const mode of allowedModes(service.id,timing === 'urgent' ? '18:00' : '12:00')) {
      for (const platform of mode === 'online' ? ['zoom','whatsapp'] : ['']) {
        const data = {...form,serviceId:service.id,operation,timing,mode,platform,quantity:500,hours:8,address:'123 Test Street',phone:'+1 416 555 0100'};
        if (Object.keys(validateDetails(data)).length) {assert.equal(resolveEvent(data),null); continue;}
        assert.equal(resolveEvent(data),CALENDLY_TEST_EVENT);
        const details = eventPrefill(data,CALENDLY_TEST_EVENT,estimateBooking(data)).customAnswers.a1;
        assert.match(details,/Shared test event/);
        if (estimateBooking(data).status === 'review_required') assert.match(details,/Known charges only/);
      }
    }
  }
});
test('routing requires exact service, operation, period, format, platform and reviewed event', () => {
  assert.equal(resolveEvent(form,[route]),route);
  for (const patch of [{serviceId:'business'},{operation:'notarization'},{timing:'urgent'},{mode:'in_person'},{platform:'whatsapp'},{reviewed:false},{detailsQuestion:'a11'},{url:'https://evil.test/event'},{url:'https://calendly.com/another-account/event'},{url:route.url+'?redirect=x'}]) assert.equal(resolveEvent(form,[{...route,...patch}]),null);
  assert.equal(resolveEvent(form,[route,route]),null);
  assert.equal(resolveEvent(form,[{...route,maxSeals:1}]),null);
});
test('mediation duration must match; mobile and unapproved urgency cannot auto-book', () => {
  const mediation = {...form, serviceId:'mediation', operation:'mediation',hours:2};
  assert.equal(resolveEvent(mediation,[{...route,...mediation,hours:1}]),null);
  assert.ok(resolveEvent(mediation,[{...route,...mediation}]));
  const mobile = {...form,mode:'mobile',platform:'',address:'123 Test Street'};
  assert.equal(resolveEvent(mobile,[{...route,...mobile}]),null);
  const urgent = {...mediation,timing:'urgent'};
  assert.equal(resolveEvent(urgent,[{...route,...urgent}]),null);
});
test('validation keeps physical attendance, urgent phone and quantity rules', () => {
  assert.deepEqual(validateDetails(form),{});
  assert.ok(validateDetails({...form,timing:'urgent'}).phone);
  assert.ok(validateDetails({...form,platform:'whatsapp'}).phone);
  assert.ok(validateDetails({...form,serviceId:'business',operation:'notarization'}).operation);
  assert.ok(validateDetails({...form,quantity:1.5}).quantity);
  assert.ok(validateDetails({...form,hours:9}).hours);
  assert.ok(validateDetails({...form,mode:'mobile',platform:''}).address);
});
test('prefill uses the reviewed text-question index and labels prices as estimates', () => {
  const prefill=eventPrefill({...form,phone:'+1 416 555 0100'},route,estimateBooking(form));
  assert.equal(prefill.email,form.email);
  assert.deepEqual(Object.keys(prefill.customAnswers),['a3']);
  assert.match(prefill.customAnswers.a3,/Seals: 2/);
  assert.match(prefill.customAnswers.a3,/not a final invoice/);
  assert.match(prefill.customAnswers.a3,/416 555 0100/);
  assert.match(prefill.customAnswers.a3,/Please review my documents/);
});
