import { createV2App } from './v2-app.ts';
import { getV2Config } from './config/v2-env.ts';

const {host,port}=getV2Config();
const app=createV2App();
await app.db.query('SELECT 1');
app.server.listen(port,host,()=>console.log(`StudyForge V2 API listening on ${host}:${port}`));
app.server.on('error',async error=>{console.error(error);await app.close();process.exitCode=1;});
for (const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,async()=>{await app.close();process.exit(0);});
