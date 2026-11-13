import { createApp } from './app.ts';
import { getConfig } from './config/env.ts';

const {host,port}=getConfig();
const app=createApp();
await app.db.query('SELECT 1');
app.server.listen(port,host,()=>console.log(`StudyForge V2 API listening on ${host}:${port}`));
app.server.on('error',async error=>{console.error(error);await app.close();process.exitCode=1;});
for (const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,async()=>{await app.close();process.exit(0);});
