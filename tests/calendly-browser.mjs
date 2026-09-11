// Browser-only Calendly fixtures. Never creates appointments or sends mail.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Windows/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
  mkdirSync('qa',{recursive:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],apiCalls=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiCalls.push(r.url());});
  // Isolate the existing calendar as well as the new one. Fake widget creates
  // a frame to exercise exact origin AND source checks on postMessage.
  await page.route('https://assets.calendly.com/assets/external/widget.js',r=>r.fulfill({contentType:'application/javascript',body:`window.Calendly={initInlineWidget(options){window.lastCalendly=options;const frame=document.createElement('iframe');frame.title='Calendly test fixture';frame.src='https://calendly.com/test-fixture';options.parentElement.appendChild(frame);}};`}));
  await page.route('https://calendly.com/**',r=>r.fulfill({contentType:'text/html',body:'<html><body>Local test calendar — no appointment is created.</body></html>'}));
  const fill=async()=>{
    await page.locator('#service-drafting a').click();
    await page.locator('#sb-timing').selectOption('regular');
    await page.getByRole('radio',{name:'Online',exact:true}).check();
    await page.getByRole('radio',{name:'Zoom Call',exact:true}).check();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.locator('#sb-operation').selectOption('draft-affidavit');
    await page.locator('#sb-name').fill('Local Test');
    await page.locator('#sb-email').fill('local@example.test');
    await page.getByRole('button',{name:'Review estimate',exact:true}).click();
    await page.getByText('$73.45',{exact:true}).waitFor();
  };
  await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#services article').count(),6);
  const rects=await page.locator('#services article').evaluateAll(els=>els.map(e=>({id:e.id,y:e.getBoundingClientRect().y})));
  assert.equal(rects[0].y,rects[2].y);assert.equal(rects[3].y,rects[5].y);assert.ok(rects[3].y>rects[0].y);
  assert.equal(rects[3].id,'service-international');
  for (const serviceId of ['affidavits','business','international']) {
    await page.locator(`#service-${serviceId} a`).click();
    await page.locator('#sb-timing').selectOption('regular');
    await page.getByRole('radio',{name:'In-Person',exact:true}).check();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    if(serviceId!=='affidavits') await page.locator('#sb-operation').selectOption('commissioning');
    await page.locator('#sb-name').fill('Local Test');
    await page.locator('#sb-email').fill('local@example.test');
    await page.getByRole('button',{name:'Review estimate',exact:true}).click();
    await page.getByText('$44.07',{exact:true}).waitFor();
    await page.getByText('In-person appointment fee',{exact:true}).waitFor();
  }
  await page.locator('#service-mediation a').click();
  await page.locator('#sb-timing').selectOption('regular');
  assert.equal(await page.getByRole('radio',{name:'Online',exact:true}).count(),0);
  for(const [operation,total] of [['draft-affidavit','$73.45'],['draft-consent','$56.50']]) {
    await page.locator('#service-drafting a').click();
    await page.locator('#sb-timing').selectOption('urgent');
    await page.getByRole('radio',{name:'Zoom Call',exact:true}).check();
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.locator('#sb-operation').selectOption(operation);
    await page.locator('#sb-phone').fill('4165550100');
    await page.getByRole('button',{name:'Review estimate',exact:true}).click();
    await page.getByText(total,{exact:true}).waitFor();
    await page.getByText('Price estimate',{exact:true}).waitFor();
  }
  await fill();
  await page.getByText(/Test booking: all services use the same/).waitFor();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  assert.equal(await page.locator('#sb-email').inputValue(),'local@example.test');
  assert.equal(await page.locator('input[type=time]').count(),0);
  await page.getByRole('button',{name:'Review estimate',exact:true}).click();
  await page.locator('.sb-consent input').check();
  assert.equal(await page.getByText('$73.45',{exact:true}).count(),1);
  await page.getByRole('button',{name:'Choose available time'}).click();
  await page.locator('.sb-calendly iframe').waitFor();
  assert.equal(await page.evaluate(()=>window.lastCalendly.url),'https://calendly.com/tombee10/notary-commissioner-standard-1');
  const prefill=await page.evaluate(()=>window.lastCalendly.prefill);
  assert.equal(prefill.name,'Local Test');assert.equal(prefill.email,'local@example.test');
  assert.match(prefill.customAnswers.a1,/Draft Affidavit/);assert.match(prefill.customAnswers.a1,/73.45/);
  const send=async(origin,selector)=>page.evaluate(({origin,selector})=>window.dispatchEvent(new MessageEvent('message',{origin,source:document.querySelector(selector).contentWindow,data:{event:'calendly.event_scheduled'}})),{origin,selector});
  await send('https://evil.test','.sb-calendly iframe');
  await page.evaluate(()=>{const frame=document.createElement('iframe');frame.id='unrelated-frame';document.body.appendChild(frame);});
  await send('https://calendly.com','#unrelated-frame');
  assert.equal(await page.getByText(/Calendly reports your appointment is scheduled/).count(),0);
  await send('https://calendly.com','.sb-calendly iframe');
  await page.getByText(/Calendly reports your appointment is scheduled/).waitFor();
  assert.equal(await page.getByText(/Send to:/).count(),0);
  await page.getByRole('button',{name:'Back to review'}).click();
  await page.getByText('$73.45',{exact:true}).waitFor();
  // Script failure retains details and offers a retry without creating a booking.
  await page.evaluate(()=>{delete window.Calendly;document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')?.remove();});
  await page.route('https://assets.calendly.com/assets/external/widget.js',r=>r.abort());
  await page.getByRole('button',{name:'Choose available time'}).click();
  await page.getByText(/The calendar could not load/).waitFor();
  await page.getByRole('button',{name:'Back to review'}).click();
  await page.getByText('$73.45',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.locator('#service-mediation a').click();
  await page.locator('#sb-timing').selectOption('urgent');
  assert.equal(await page.getByRole('radio',{name:'In-Person',exact:true}).count(),0);
  assert.equal(await page.getByRole('radio',{name:'Mobile Visit',exact:true}).count(),0);
  await page.getByRole('radio',{name:'Zoom Call'}).check();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('#sb-phone').fill('');
  await page.getByRole('button',{name:'Review estimate'}).click();
  await page.getByText('Enter a valid phone number.',{exact:true}).waitFor();
  await page.locator('#smart-booking').screenshot({path:'qa/calendly-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(apiCalls,[]);assert.deepEqual(errors,[]);
  writeFileSync('qa/calendly-browser-results.json',JSON.stringify({passed:true,liveBooking:false,apiCalls,pageErrors:errors,checks:['desktop 3+3','retained inputs','unchanged drafting estimate','shared test event notice','mapped event prefill','foreign origin/source rejected','no payment issued','script failure recovery','urgent phone and online rules','mobile no overflow']},null,2));
  console.log('Calendly browser checks passed. No live bookings or emails.');
} finally {await browser.close();}
