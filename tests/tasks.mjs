import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
function compile(path){return ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;}
const lib='data:text/javascript;base64,'+Buffer.from(compile('libgame.ts')).toString('base64');const extra='data:text/javascript;base64,'+Buffer.from(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib))).toString('base64');const src=compile('tasks.ts').replace("'./extra-tasks'",JSON.stringify(extra)).replace("'./libgame'",JSON.stringify(lib));const {taskDeck,makeTask,taskCatalog,tapScore,sequenceScore,sequencePhase,answerTimeMs,speedAdjustedScore,handsOnTasks}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
assert.equal(taskCatalog.length,112);assert.equal(new Set(taskCatalog.map(t=>t.id )).size,112);
assert.deepEqual(taskDeck(1234),taskDeck(1234));assert.notDeepEqual(taskDeck(1234).map(t=>t.id),taskDeck(2345).map(t=>t.id));const seen=new Set;
for(let seed=0;seed<500;seed++){const deck=taskDeck(seed);assert.equal(deck.length,8);assert.equal(new Set(deck.map(t=>t.id)).size,8);deck.forEach(t=>seen.add(t.id));for(const {id} of taskCatalog){const t=makeTask(id,seed),d=t.data;assert.ok(t.instruction.length>15);if(['colors','picorder'].includes(id)){assert.equal(d.order.length,id==='colors'?4:3);assert.ok(d.order.every(n=>n>=0&&n<=3));}if(id==='pictures'){assert.equal(d.first.length,4);assert.equal(d.second.filter(p=>d.first.some(q=>q.name===p.name)).length,3);}if(id==='dots'){assert.equal(d.options.length,4);assert.ok(d.options.includes(d.count));assert.equal(new Set(d.options).size,4);}if(['add','subtract','missing','digits'].includes(id)){assert.ok(d.options.includes(d.answer));assert.equal(new Set(d.options).size,4);}if(id==='add')assert.equal(d.answer,d.a+d.b);if(id==='subtract')assert.equal(d.answer,d.a-d.b);if(id==='more')assert.notEqual(...d.counts);if(id==='pair')assert.equal(d.pairs.filter(p=>p[0].name===p[1].name).length,1);}}
assert.equal(seen.size,112);assert.equal(tapScore({x:150,y:150},{x:150,y:150}),1000);assert.equal(tapScore({x:250,y:250},{x:150,y:150}),0);assert.equal(sequenceScore([0,1,2,3],[0,1,2,3]),1000);assert.equal(sequenceScore([0,1,0,3],[0,1,2,3]),750);
for(let i=0;i<4;i++){assert.deepEqual(sequencePhase(i*1000,4),{showing:true,index:i});assert.equal(sequencePhase(i*1000+999,4).index,i);}assert.equal(sequencePhase(4000,4).showing,false);
console.log('PASS: 112 games, seeded matching challenges, unique eight-game rounds, correct choices, center-tap scoring, sequence scoring, one-second color steps and four-second reveal boundary.');

for(const {id} of taskCatalog){const t=makeTask(id,66);assert.equal(speedAdjustedScore(0,id,9000,t.data),0);const a=speedAdjustedScore(1000,id,10000,t.data),b=speedAdjustedScore(1000,id,20000,t.data);assert.ok(Number.isInteger(a)&&a>=0&&a<=1000);if(!['timer','reaction','bubbles'].includes(id))assert.ok(a>b, id+' must reward faster answers');else assert.equal(a,b);}
assert.equal(answerTimeMs('colors',4000),0);assert.equal(answerTimeMs('colors',5000),1000);assert.equal(answerTimeMs('pictures',4000),1000);assert.equal(answerTimeMs('numsequence',4000),1000);assert.equal(answerTimeMs('flashes',4500,{count:5}),1000);assert.equal(speedAdjustedScore(1000,'colors',5000),speedAdjustedScore(1000,'add',1000));
for(let seed=0;seed<50;seed++){for(const id of ['near10','middle','descend','shortword','longword','sides','lettergap','equal','redcount','flashes']){const d=makeTask(id,seed).data;if(id==='near10')assert.equal(d.answer,[...d.numbers].sort((a,b)=>Math.abs(a-10)-Math.abs(b-10))[0]);if(id==='middle')assert.equal(d.answer,[...d.numbers].sort((a,b)=>a-b)[1]);if(id==='descend')assert.deepEqual(d.order,[...d.numbers].sort((a,b)=>b-a));if(['equal','redcount','flashes'].includes(id))assert.ok(d.options.includes(d.count));if(['sides','lettergap'].includes(id))assert.ok(d.options.includes(d.answer));}}
console.log('PASS: speed rewards, memory display-time exclusion, no double timing penalties, descending order and new game answers.');

for(let seed=0;seed<100;seed++){const d=makeTask('hidepics',seed).data;assert.equal(d.pictures.length,6);assert.equal(new Set(d.pictures.map(p=>p.name)).size,6);assert.ok(d.answer>=0&&d.answer<6);for(const id of ['ink','even','double','half','nextpattern','alphabet','animal','fruit']){const d=makeTask(id,seed).data;if(d.options)assert.ok(d.options.includes(d.answer));}}
assert.equal(answerTimeMs('hidepics',4000),1000);assert.equal(answerTimeMs('reversepics',4000),1000);
console.log('PASS: new memory layout data, choice answers and reveal timing.');

for(let n=5;n<=20;n++){const a=taskDeck(100,n),b=taskDeck(100,n);assert.equal(a.length,n);assert.equal(new Set(a.map(t=>t.id)).size,n);assert.deepEqual(a,b);}
assert.ok(!taskCatalog.some(t=>t.id==='shadow'));
for(let seed=0;seed<100;seed++){const e=makeTask('differences',seed).data;assert.equal(e.changes.length,3);assert.equal(new Set(e.changes).size,3);assert.ok(e.changes.every(i=>i>=0&&i<6));}
console.log('PASS: 5–20 unique matching tasks, shadow choices, exactly three nonoverlapping differences.');

let withCalculation=0;
for(let seed=0;seed<500;seed++){for(const length of [5,8,12,20]){const deck=taskDeck(seed,length);const n=deck.filter(t=>['add','subtract','double','half'].includes(t.id)).length;assert.ok(n<=1);if(length===8&&n)withCalculation++;}}
assert.ok(withCalculation>0&&withCalculation<150);
console.log('PASS: calculations occur in a minority of rounds, never more than one per round.');
const lookSrc=compile('app/task-look.ts').replace("'../extra-tasks'",JSON.stringify(extra));const {taskActions,colorSymbols}=await import('data:text/javascript;base64,'+Buffer.from(lookSrc).toString('base64'));
for(const t of taskCatalog)assert.ok(taskActions[t.id]?.length>5,'Every game needs a clear short action: '+t.id);
assert.equal(new Set(colorSymbols).size,4);
console.log('PASS: all 112 games have a short action heading and four distinct color symbols.');

for(let seed=0;seed<200;seed++)for(const length of [5,10,15,20]){const deck=taskDeck(seed,length);assert.equal(deck.filter(t=>handsOnTasks.includes(t.id)).length,Math.ceil(length*.6));assert.equal(new Set(deck.map(t=>t.id)).size,length);assert.deepEqual(deck,taskDeck(seed,length));}
console.log('PASS: every shared-seed round has 60% hands-on challenges without duplicate tasks or mismatched decks.');
