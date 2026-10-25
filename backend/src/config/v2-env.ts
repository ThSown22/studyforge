import { isIP } from 'node:net';

function integer(name:string,fallback:number,min:number,max:number){
  const raw=process.env[name];
  if(raw===undefined||raw==='')return fallback;
  if(!/^\d+$/.test(raw))throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  const value=Number(raw);
  if(value<min||value>max)throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  return value;
}
export function getV2Config(){
  const host=process.env.HOST||'0.0.0.0';
  if(host!=='localhost'&&!isIP(host))throw new Error('HOST must be an IP address or localhost.');
  const secure=process.env.SECURE_COOKIES;
  if(secure!==undefined&&!['true','false'].includes(secure))throw new Error('SECURE_COOKIES must be true or false.');
  if(process.env.NODE_ENV==='production'&&secure!=='true')throw new Error('Production requires SECURE_COOKIES=true and HTTPS.');
  const allowedOrigins=(process.env.ALLOWED_ORIGINS||'http://localhost:3000,http://127.0.0.1:3000').split(',').map(value=>value.trim()).filter(Boolean);
  if(!allowedOrigins.length)throw new Error('ALLOWED_ORIGINS needs at least one origin.');
  for(const origin of allowedOrigins){
    let parsed:URL;try{parsed=new URL(origin);}catch{throw new Error('ALLOWED_ORIGINS contains an invalid URL.');}
    if(!['http:','https:'].includes(parsed.protocol)||parsed.origin!==origin)throw new Error('ALLOWED_ORIGINS must contain HTTP(S) origins only.');
  }
  return{host,port:integer('API_PORT',3001,1,65535),secureCookies:secure==='true',sessionTtlSeconds:integer('SESSION_TTL_SECONDS',604800,300,2592000),allowedOrigins};
}
