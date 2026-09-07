import {createServer,loadEnv} from 'vite';
import {startApi} from '../server/local.mjs';
const env={...loadEnv('development',process.cwd(),''),...process.env};
const api=startApi(env,8788);
const vite=await createServer();await vite.listen();vite.printUrls();
const close=async()=>{api.close();await vite.close();process.exit();};process.on('SIGTERM',close);process.on('SIGINT',close);
