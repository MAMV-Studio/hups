import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
let state={version:19,length:8,code:'1234',seed:123,created:Date.now(),start:1,players:[{id:'host',token:'h',name:'A',scores:Array(8).fill(500)},{id:'guest',token:'g',name:'B',scores:[500]}]},rev=0;
globalThis.__store = {
 async create(code,data) {state=structuredClone(data);rev=0;return true;},
 async read(code) {return {data:structuredClone(state),revision:rev};},
 async save(code,data,revision) {if(revision!==rev)return false;state=structuredClone(data);rev++;return true;}
};
const source=compile('app/api/challenge/route.ts').replace("'../../../libgame'",JSON.stringify(uri(compile('libgame.ts')))).replace("import { challengeStore } from '../../../server/challenge-store';","const challengeStore=()=>globalThis.__store;");
const {POST}=await import(uri(source));
const call=async(token,action,extra={})=>{const r=await POST(new Request('http://test/api',{method:'POST',body:JSON.stringify({token,action,code:'1234',version:19,...extra})}));return [r.status,await r.json()]};

assert.equal((await call('g','poll',{version:7}))[0],426);
state.players[1].scores=Array(8).fill(400);
const before=state.seed;
assert.equal((await call('g','rematch'))[0],200); // guest proposes
assert.equal(state.proposal.choices.guest,true);
assert.equal(state.seed,before); // scores stay until choices made
assert.equal((await call('h','accept'))[0],200);
assert.notEqual(state.seed,before);assert.equal(state.code,'1234');assert.ok(state.players.every(p=>p.scores.length===0));assert.equal(state.players.length,2);
state.start=Date.now()-1;
assert.equal((await call('g','progress',{seed:before,scores:[900]}))[1].state.seed,state.seed);assert.equal(state.players[1].scores.length,0);
assert.equal((await call('g','progress',{seed:state.seed,scores:[900]}))[0],200);
assert.equal((await call('h','poll'))[1].state.players[1].scores[0],900);
assert.equal((await call('g','progress',{seed:state.seed,scores:[900,800]}))[0],200);
assert.equal((await call('g','progress',{seed:state.seed,scores:[900]}))[0],200);
assert.deepEqual(state.players[1].scores,[900,800]); // delayed update cannot erase points
assert.equal((await call('g','progress',{seed:state.seed,scores:[800]}))[0],400);
state.players.forEach(p=>p.scores=Array(8).fill(500));
assert.equal((await call('g','rematch'))[0],200);
assert.equal((await call('h','decline'))[1].left,true);
assert.equal(state.players.length,1);assert.equal(state.players[0].id,'guest');
state.players[0].scores=Array(8).fill(500);state.players.push({id:'new',token:'n',scores:[]});
await call('g','rematch');state.proposal.deadline=Date.now()-1;
await call('g','poll');assert.equal(state.players.length,1);assert.equal(state.players[0].id,'guest');
console.log('PASS: guest proposes, both accept, one declines, absent player timeout, preserved code, live scores, stale prefixes and version mismatch.');

const [created,newRoom]=await call(null,'create',{name:'Testi'});
assert.equal(created,200);assert.match(newRoom.code,/^[1-9][0-9]{3}$/);assert.equal(newRoom.state.version,19);
const joined=await call(null,'join',{code:newRoom.code,name:'Toinen'});assert.equal(joined[0],200);assert.equal(joined[1].state.players.length,2);
console.log('PASS: four-digit creation and two-player join.');

for(const length of [5,12,20]){
 const [,r]=await call(null,'create',{name:'Pituus',length});assert.equal(r.state.length,length);
 const auth=r.token;state.start=Date.now()-1;
 assert.equal((await call(auth,'finish',{code:r.code,seed:state.seed,scores:Array(length-1).fill(700)}))[0],400);
 assert.equal((await call(auth,'finish',{code:r.code,seed:state.seed,scores:Array(length+1).fill(700)}))[0],400);
 assert.equal((await call(auth,'finish',{code:r.code,seed:state.seed,scores:Array(length).fill(700)}))[0],200);
 assert.equal((await call(auth,'rematch',{code:r.code}))[0],200);assert.equal(state.length,length);
}
console.log('PASS: server enforces selected 5, 12 and 20 task counts, including rematches.');
