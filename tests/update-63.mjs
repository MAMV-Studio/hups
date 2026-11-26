import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const uri=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const lib=uri(compile('libgame.ts'));
const extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib)));
const tasks=await import(uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra))));
const progression=await import(uri(compile('app/progression.ts')));
assert.equal(tasks.revealTimeMs('digits'),1500);
for(const [id,threshold] of [[6,10],[7,25],[8,50]]){
 assert.equal(progression.unlockedAvatar(id,threshold,false),false);
 assert.equal(progression.unlockedAvatar(id,threshold-1,true),false);
 assert.equal(progression.unlockedAvatar(id,threshold,true),true);
}
assert.equal(progression.dailySeed('2026-11-26'),progression.dailySeed('2026-11-26'));
assert.notEqual(progression.dailySeed('2026-11-26'),progression.dailySeed('2026-11-27'));
const lines=new Set();
for(let seed=0;seed<100;seed++){
 const line=tasks.makeTask('line',seed).data;lines.add(JSON.stringify(line.model));assert.ok(line.length>100);
 const direction=tasks.makeTask('alternate',seed).data;
 assert.equal(direction.directions.length,10);assert.equal(direction.inks.length,10);
 assert.deepEqual(direction.inks.slice(0,2),direction.directions.slice(0,2));
 assert.equal(direction.directions[3],direction.directions[4]);
 assert.notEqual(direction.inks[3],direction.directions[3]);
 const stars=tasks.makeTask('stars',seed).data;
 assert.equal(stars.positions.length,stars.symbols.length);assert.equal(stars.colors.length,12);
 const dots=tasks.makeTask('dots',seed).data.positions;
 assert.ok(dots.every(p=>p.x>=25&&p.x<=275&&p.y>=25&&p.y<=275));
}
assert.ok(lines.size>=4);
assert.ok(!tasks.taskCatalog.some(t=>t.id.startsWith('xmas')));
console.log('PASS: unlock thresholds, number reveal, varied lines, scattered shapes, ten word directions and Christmas games removed.');
