// Local browser regression; all API responses and mail are isolated fixtures.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {createDB} from '../server/local.mjs';
import {handleApi} from '../server/api.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/Windows/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const env={DB:createDB(),BOOKING_SECRET:'local-test-secret'.repeat(3),ADMIN_TOKEN:'local-test-admin'.repeat(3),RESEND_API_KEY:'fake',BOOKING_FROM_EMAIL:'sender@example.test',BOOKING_OWNER_EMAIL:'owner@example.test',MAIL_FETCH:async()=>new Response('{}')};
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://assets.calendly.com/**',r=>r.abort());
 await page.route('https://calendly.com/**',r=>r.abort());
 await page.route('**/api/**',async route=>{const r=route.request();const response=await handleApi(new Request(r.url(),{method:r.method(),headers:r.headers(),...(['GET','HEAD'].includes(r.method())?{}:{body:r.postData()})}),env);await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});});
 const url=process.env.PREVIEW_URL||'http://127.0.0.1:5173';await page.goto(url);
 for(const [key,value] of Object.entries({business:'Local Company',name:'Local Tester',email:'test@example.test',phone:'4165550100',notarizations:'20',commissions:'10'}))await page.locator(`#business-packages input[name="${key}"]`).fill(value);
 await page.getByRole('button',{name:'Send inquiry',exact:true}).click();await page.getByText(/Your inquiry is saved/).waitFor();
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM requests').get().n,1);
 await page.goto(url+'/owner');await page.getByRole('button',{name:'Load requests'}).click();await page.getByText('Authorized owner access required.').waitFor();
 await page.getByLabel('Owner access token').fill(env.ADMIN_TOKEN);await page.getByRole('button',{name:'Load requests'}).click();await page.getByText(/Local Company/).waitFor();
 assert.equal(await page.getByRole('button',{name:/Confirm booking|Record verified deposit/}).count(),0);
 assert.deepEqual(errors,[]);console.log('Business inquiry and read-only owner browser checks passed. No live email.');
}finally{await browser.close();env.DB.sqlite.close();}
