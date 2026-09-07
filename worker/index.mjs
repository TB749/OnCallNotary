import {handleApi,flushOutbox} from '../server/api.mjs';
export default {
 async fetch(request,env){
   if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env);
   return env.ASSETS.fetch(request);
 },
 async scheduled(_event,env,ctx){ctx.waitUntil(flushOutbox(env));}
};
