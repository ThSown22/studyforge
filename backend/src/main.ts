import { createApp } from './app.ts';
import { getConfig } from './config/env.ts';
import { waitForPostgres } from './infrastructure/database/postgres.ts';

const {host,port}=getConfig();
const app=createApp();
let shuttingDown=false;
async function shutdown(exitCode:number,error?:unknown){
  if(shuttingDown)return;
  shuttingDown=true;
  if(error)console.error('[StudyForge API] shutting down after error:',error);
  const force=setTimeout(()=>{console.error('[StudyForge API] graceful shutdown timed out.');process.exit(1);},10_000);
  force.unref();
  try{await app.close();}
  finally{clearTimeout(force);process.exit(exitCode);}
}
app.server.on('error',error=>{void shutdown(1,error);});
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void shutdown(0);});
try{
  await waitForPostgres(app.db);
  app.server.listen(port,host,()=>console.log(`StudyForge V2 API listening on ${host}:${port}`));
}catch(error){
  console.error('[StudyForge API] PostgreSQL did not become ready:',error);
  await app.close();
  process.exitCode=1;
}
