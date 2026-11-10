import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const core=uri(compile('server/play-stats.ts')),store=uri(compile('server/challenge-store.ts'));
const {sign,adminValid,roundUuid}=await import(core);
const admin=await import(uri(compile('app/api/admin/route.ts').replace("'../../../server/play-stats'",JSON.stringify(core))));
const plays=await import(uri(compile('app/api/plays/route.ts').replace("'../../../server/play-stats'",JSON.stringify(core)).replace("'../../../server/challenge-store'",JSON.stringify(store))));
process.env.HUPS_ADMIN_PASSWORD='long-test-password-only';process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
const req=(body,cookie='',origin='https://hups.test')=>new Request('https://hups.test/api/admin',{method:'POST',headers:{'Content-Type':'application/json',origin,cookie},body:JSON.stringify(body)});
const oldFetch=globalThis.fetch;let recorded=[],room;
globalThis.fetch=async(url,o)=>{if(url.includes('hups_challenges?'))return Response.json(room?[{data:room,revision:1}]:[]);if(url.endsWith('hups_record_plays')){recorded.push(...JSON.parse(o.body).p_entries);return Response.json(true);}return Response.json({rows:[],updated:new Date().toISOString()});};
try{
 assert.equal((await admin.GET(new Request('https://hups.test/api/admin'))).status,401);
 assert.equal((await admin.POST(req({password:'wrong'}))).status,401);
 assert.equal((await admin.POST(req({password:process.env.HUPS_ADMIN_PASSWORD},'','https://evil.test'))).status,403);
 const logged=await admin.POST(req({password:process.env.HUPS_ADMIN_PASSWORD}));assert.equal(logged.status,200);const cookie=logged.headers.get('set-cookie');assert.ok(cookie.includes('HttpOnly'));assert.ok(cookie.includes('SameSite=Strict'));
 assert.equal((await admin.GET(new Request('https://hups.test/api/admin',{headers:{cookie}}))).status,200);
 assert.equal(adminValid(new Request('https://hups.test',{headers:{cookie:'hups_admin=1.'+sign('admin:1')}})),false);
 const id=crypto.randomUUID();let r=await plays.POST(req({round:id,app:'pikkuhups',action:'complete',ticket:'fake'}));assert.equal(r.status,403);assert.equal(recorded.length,0);
 r=await plays.POST(req({round:id,app:'pikkuhups',action:'start'}));assert.equal(r.status,200);const {ticket}=await r.json();r=await plays.POST(req({round:id,app:'pikkuhups',action:'complete',ticket}));assert.equal(r.status,200);assert.equal(recorded[0].finished,false);assert.equal(recorded[1].finished,true);assert.equal(recorded[0].round_id,recorded[1].round_id);
 room={code:'1234',seed:7,created:1,start:Date.now()-1000,length:5,players:Array.from({length:4},(_,i)=>({id:crypto.randomUUID(),token:'private'+i,name:'never-record-me',scores:i===0?[1,2,3,4,5]:[]}))};
 recorded=[];r=await plays.POST(req({kind:'shared',code:'1234',token:'wrong'}));assert.equal(r.status,403);assert.equal(recorded.length,0);
 r=await plays.POST(req({kind:'shared',code:'1234',token:'private0'}));assert.equal(r.status,200);assert.equal(recorded.length,4);assert.equal(new Set(recorded.map(v=>v.round_id)).size,1);assert.equal(recorded.filter(v=>v.finished).length,1);assert.ok(!JSON.stringify(recorded).includes('private'));assert.ok(!JSON.stringify(recorded).includes('never-record'));
 const first=recorded[0].round_id;room.seed++;r=await plays.POST(req({kind:'shared',code:'1234',token:'private0'}));assert.notEqual(recorded.at(-1).round_id,first);assert.equal(roundUuid('x'),roundUuid('x'));
 console.log('PASS: stats authentication, cookie expiry, origin guard, completion tickets, shared room membership, four players counted under one round, rematch separation, no names or tokens recorded.');
}finally{globalThis.fetch=oldFetch;}
// Client completion waits for the confirmed start and can only be sent once.
const client=await import(uri(compile('app/play-counter.ts')));const sent=[];let release;
globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);sent.push(body);if(body.action==='start')return new Promise(r=>release=()=>r(Response.json({ticket:'confirmed'})));return Response.json({ok:true});};
try{const count=client.beginCount('pikkuhups');count.complete();count.complete();assert.equal(sent.length,1);release();for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,0));assert.equal(sent.length,2);assert.equal(sent[1].action,'complete');assert.equal(sent[1].ticket,'confirmed');assert.equal(sent[0].round,sent[1].round);assert.equal(Object.keys(sent[0]).includes('name'),false);console.log('PASS: client waits for start confirmation and completes exactly once.');}finally{globalThis.fetch=oldFetch;}
