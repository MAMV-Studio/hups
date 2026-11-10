'use client';
// No names, chat, browser identifiers or permanent device IDs are sent.
async function send(body:unknown){for(let n=0;n<3;n++){try{const r=await fetch('/api/plays',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),keepalive:true});if(r.ok)return await r.json();}catch{}if(n<2)await new Promise(r=>setTimeout(r,1200*(n+1)));}return null;}
export function beginCount(app:'hups'|'pikkuhups',practice=false){const round=crypto.randomUUID();const pending=send({action:'start',round,app,practice});let done=false;return {complete(){if(done)return;done=true;void pending.then(v=>{if(v?.ticket)return send({action:'complete',round,app,practice,ticket:v.ticket});});}};}
export function countShared(auth:{code:string,token:string}){void send({kind:'shared',code:auth.code,token:auth.token});}
