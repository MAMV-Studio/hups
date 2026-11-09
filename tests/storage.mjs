import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(fs.readFileSync('server/challenge-store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {challengeStore}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SECRET_KEY;
assert.equal(challengeStore(),null);
process.env.SUPABASE_URL='https://hups-test.supabase.co';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
const originalFetch=globalThis.fetch;const calls=[];
let response=true;
globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(response);};
try{
 const db=challengeStore();
 assert.equal(await db.create('1234',{created:7},0),true);
 assert.equal(calls[0].options.headers.apikey,'sb_secret_test');
 assert.equal(calls[0].options.headers.Authorization,undefined);
 assert.equal(calls[0].options.cache,'no-store');
 assert.deepEqual(JSON.parse(calls[0].options.body),{p_code:'1234',p_data:{created:7},p_expired_before:0});
 response=false;assert.equal(await db.create('1234',{},0),false);
 response=[{data:{code:'1234'},revision:2}];assert.deepEqual(await db.read('1234'),response[0]);
 response=[];assert.equal(await db.read('1234'),null);
 assert.equal(await db.save('1234',{},2),false); // another player won the revision race
 response=[{revision:3}];assert.equal(await db.save('1234',{},2),true);
 const save=calls.at(-1);assert.ok(save.url.endsWith('revision=eq.2'));
 assert.equal(JSON.parse(save.options.body).revision,3);
 globalThis.fetch=async()=>new Response('internal details',{status:503});
 await assert.rejects(db.read('1234'),/503/);
}finally{globalThis.fetch=originalFetch;delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SECRET_KEY;}
console.log('PASS: persistent REST adapter, secret headers, code collision, revision conflict, missing rooms and database errors.');
