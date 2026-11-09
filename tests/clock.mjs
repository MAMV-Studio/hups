import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
const js=ts.transpileModule(fs.readFileSync('game-clock.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {createGameClock}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let tick=1200;const a=createGameClock(()=>tick),b=createGameClock(()=>tick);
a.sync(100000,1000,1200);b.sync(100050,1100,1200);
const start=105000;
assert.equal(start-a.now(),start-b.now());
const original=Date.now;Date.now=()=>original()+15000;
try{assert.equal(start-a.now(),4900);tick+=4900;assert.equal(a.now(),start);assert.equal(b.now(),start);}finally{Date.now=original;}
a.sync(NaN,0,tick);assert.equal(a.now(),start);
console.log('PASS: 15-second device clock skew cannot change countdown; monotonic time and network delay compensation.');
